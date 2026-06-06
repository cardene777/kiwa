// SPDX-License-Identifier: MIT
// example: nextjs-token-gating の GatedContent.sol + GateNFT.sol を題材にした
//          Layer 1 spec (test-spec-token-gating.md) → Foundry t.sol 変換サンプル
// 用途 — /kiwa-forge skill の出力サンプル、 TC-001 〜 TC-013 の 6 観点 grouping
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

// 実 contract と並立する import を想定 (本 file は example、 contract 配置に合わせ要修正)
// import "../../contracts/GateNFT.sol";
// import "../../contracts/GatedContent.sol";

// example として contract interface を local 宣言 (実 skill 実行時は実 contract を import)
interface IGateNFT {
    function mint() external returns (uint256);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function balanceOf(address user) external view returns (uint256);
    function ownerOf(uint256 tokenId) external view returns (address);
}

interface IGatedContent {
    function getSecret() external returns (string memory);
    function grantTimedAccess(address user, uint256 ttlSeconds) external returns (uint256);
    function hasAccess(address user) external view returns (bool);
    function isGated(address user) external view returns (bool);
    function timedAccessExpiry(address user) external view returns (uint256);
    function timedAccessGrantor(address user) external view returns (address);
    function accessCount() external view returns (uint256);
}

contract GatedContentTest is Test {
    IGateNFT public gateNft;
    IGatedContent public gatedContent;

    address public holder = address(0x1);
    address public grantee = address(0x2);
    address public otherUser = address(0x3);
    address public nonHolder = address(0x4);

    // setUp は実 skill 実行時に gateNft = new GateNFT(); gatedContent = new GatedContent(address(gateNft)); になる
    function setUp() public {
        // example のため実 deploy は skip、 vm.etch / mock で代用想定
    }

    // ==========================================
    // 観点 1: 正常系 (TC-001 〜 TC-003)
    // ==========================================

    /// TC-001: wallet connected で mint → balanceOf == 1
    function test_Mint_HappyPath() public {
        vm.prank(holder);
        uint256 tokenId = gateNft.mint();
        assertEq(gateNft.balanceOf(holder), 1);
        assertEq(gateNft.ownerOf(tokenId), holder);
    }

    /// TC-002: NFT 保有者が grantTimedAccess → timedAccessExpiry が set
    function test_GrantTimedAccess_HappyPath() public {
        vm.prank(holder);
        gateNft.mint();

        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, 3600);

        assertEq(gatedContent.timedAccessExpiry(grantee), expiresAt);
        assertEq(expiresAt, block.timestamp + 3600);
    }

    /// TC-003: grantee 視点で getSecret → accessCount +1
    function test_GetSecret_HappyPath() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        gatedContent.grantTimedAccess(grantee, 3600);

        uint256 countBefore = gatedContent.accessCount();
        vm.prank(grantee);
        string memory secret = gatedContent.getSecret();
        assertEq(secret, "alpha-pass-2025");
        assertEq(gatedContent.accessCount(), countBefore + 1);
    }

    // ==========================================
    // 観点 2: 異常系 (TC-004 〜 TC-005)
    // ==========================================

    /// TC-004: NFT 未保有者が grantTimedAccess → NotGated revert
    function test_GrantTimedAccess_Reverts_When_NotNftHolder() public {
        vm.prank(nonHolder);
        vm.expectRevert(bytes4(keccak256("NotGated()")));
        gatedContent.grantTimedAccess(grantee, 3600);

        // state 不変確認
        assertEq(gatedContent.timedAccessExpiry(grantee), 0);
    }

    /// TC-005: access 未付与者が getSecret → NotGated revert
    function test_GetSecret_Reverts_When_NoAccess() public {
        vm.prank(nonHolder);
        vm.expectRevert(bytes4(keccak256("NotGated()")));
        gatedContent.getSecret();
    }

    // ==========================================
    // 観点 3: 境界値 (TC-006 〜 TC-008)
    // ==========================================

    /// TC-006: ttl = 0 で grant → InvalidTtl revert
    function test_GrantTimedAccess_Reverts_When_TtlZero() public {
        vm.prank(holder);
        gateNft.mint();

        vm.prank(holder);
        vm.expectRevert(bytes4(keccak256("InvalidTtl()")));
        gatedContent.grantTimedAccess(grantee, 0);
    }

    /// TC-007: 期限直前 (expiresAt - 1) で getSecret → success
    function test_GetSecret_AtBoundaryBeforeExpiry() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, 1);  // ttl = 1s

        vm.warp(expiresAt - 1);  // 期限直前
        vm.prank(grantee);
        string memory secret = gatedContent.getSecret();
        assertEq(secret, "alpha-pass-2025");
    }

    /// TC-008: 期限経過後 (expiresAt + 1) で getSecret → NotGated revert
    function test_GetSecret_Reverts_AfterExpiry() public {
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, 1);

        vm.warp(expiresAt + 1);  // 期限切れ
        vm.prank(grantee);
        vm.expectRevert(bytes4(keccak256("NotGated()")));
        gatedContent.getSecret();
    }

    /// fuzz 版: ttl の有効範囲 (1 〜 365 days) で grant が success
    function testFuzz_GrantTimedAccess_Boundary(uint256 ttl) public {
        ttl = bound(ttl, 1, 365 days);
        vm.prank(holder);
        gateNft.mint();
        vm.prank(holder);
        uint256 expiresAt = gatedContent.grantTimedAccess(grantee, ttl);
        assertEq(expiresAt, block.timestamp + ttl);
    }

    // ==========================================
    // 観点 4: 状態遷移 (TC-009)
    // ==========================================

    /// TC-009: grantor が NFT を transfer 後、 grantee の hasAccess が false
    function test_TransferRevokesAccess() public {
        vm.prank(holder);
        uint256 tokenId = gateNft.mint();
        vm.prank(holder);
        gatedContent.grantTimedAccess(grantee, 3600);

        // grantee は当初 hasAccess = true
        assertTrue(gatedContent.hasAccess(grantee));

        // grantor が NFT を別 user に transfer
        vm.prank(holder);
        gateNft.transferFrom(holder, otherUser, tokenId);

        // grantee の hasAccess が false (grantor の balanceOf == 0 で連動失効)
        assertFalse(gatedContent.hasAccess(grantee));
    }

    // ==========================================
    // 観点 5: 権限 (TC-010 〜 TC-011)
    // ==========================================

    /// TC-010: NFT 保有者の grant は success + event grantedBy が msg.sender
    function test_GrantTimedAccess_OnlyNftHolder_HolderOk() public {
        vm.prank(holder);
        gateNft.mint();

        vm.prank(holder);
        vm.expectEmit(true, true, false, true);
        emit TimedAccessGranted(holder, grantee, block.timestamp + 3600);
        gatedContent.grantTimedAccess(grantee, 3600);
    }

    /// TC-011: 非保有者の grant は NotGated revert
    function test_GrantTimedAccess_OnlyNftHolder_NonHolderReverts() public {
        vm.prank(nonHolder);
        vm.expectRevert(bytes4(keccak256("NotGated()")));
        gatedContent.grantTimedAccess(grantee, 3600);
    }

    // ==========================================
    // 観点 10: セキュリティ (TC-012 〜 TC-013)
    // ==========================================

    /// TC-012: 2 grantee に同時 grant + grantor transfer → 両方失効
    function test_TransferRevokesAll_MultiGrantee() public {
        address granteeA = address(0xA);
        address granteeB = address(0xB);

        vm.prank(holder);
        uint256 tokenId = gateNft.mint();
        vm.prank(holder);
        gatedContent.grantTimedAccess(granteeA, 3600);
        vm.prank(holder);
        gatedContent.grantTimedAccess(granteeB, 3600);

        assertTrue(gatedContent.hasAccess(granteeA));
        assertTrue(gatedContent.hasAccess(granteeB));

        // grantor が NFT を transfer
        vm.prank(holder);
        gateNft.transferFrom(holder, otherUser, tokenId);

        // 2 grantee 両方失効 (grantor の balanceOf 0 で連動)
        assertFalse(gatedContent.hasAccess(granteeA));
        assertFalse(gatedContent.hasAccess(granteeB));
    }

    /// TC-013: 非保有者の self-grant 試行は NotGated revert (self bypass 防御)
    function test_SelfGrantBypassDefense() public {
        vm.prank(nonHolder);
        vm.expectRevert(bytes4(keccak256("NotGated()")));
        gatedContent.grantTimedAccess(nonHolder, 3600);
    }

    // event 宣言 (vm.expectEmit 用)
    event TimedAccessGranted(address indexed grantedBy, address indexed user, uint256 expiresAt);
}

// 観点 4 invariant test (handler pattern)
contract GatedContentInvariantTest is Test {
    IGatedContent public target;
    IGateNFT public gateNft;
    Handler public handler;

    function setUp() public {
        // 実 skill 実行時は実 contract を deploy
        handler = new Handler(target, gateNft);
        targetContract(address(handler));
    }

    /// invariant: holder が NFT を保有している限り、 grant 済の grantee 全員 hasAccess == true
    function invariant_GranteesHaveAccessWhileHolderHasNft() public {
        if (gateNft.balanceOf(handler.holder()) > 0) {
            for (uint i = 0; i < handler.granteeCount(); i++) {
                address g = handler.grantees(i);
                if (target.timedAccessExpiry(g) >= block.timestamp) {
                    assertTrue(target.hasAccess(g));
                }
            }
        }
    }
}

contract Handler is Test {
    IGatedContent public target;
    IGateNFT public gateNft;
    address public holder = address(0xH);
    address[] public grantees;

    constructor(IGatedContent _target, IGateNFT _gateNft) {
        target = _target;
        gateNft = _gateNft;
    }

    function granteeCount() external view returns (uint256) {
        return grantees.length;
    }

    function mintAndGrant(uint256 ttl) external {
        ttl = bound(ttl, 1, 30 days);
        vm.prank(holder);
        gateNft.mint();
        address grantee = makeAddr(string.concat("grantee", vm.toString(grantees.length)));
        grantees.push(grantee);
        vm.prank(holder);
        target.grantTimedAccess(grantee, ttl);
    }

    function transferOut(uint256 tokenSeed) external {
        if (gateNft.balanceOf(holder) == 0) return;
        // 簡略: tokenId 1 を transfer
        vm.prank(holder);
        gateNft.transferFrom(holder, address(0xFF), 1);
    }
}
