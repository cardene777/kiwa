# Foundry fuzz / invariant 実装パターン

`forge fuzz` と `forge invariant` の実装パターン詳細。 `/contract-test-foundry` Step 4 で本 file を Read する。

## fuzz test

### 基本パターン

```solidity
function testFuzz_Mint_AnyAmount(uint256 amount) public {
    vm.assume(amount > 0 && amount <= MAX_MINT);
    vm.prank(owner);
    uint256 tokenId = target.mint{value: amount * MINT_PRICE}();
    assertEq(target.ownerOf(tokenId), owner);
}
```

### vm.assume の使い分け

| 用途 | コード | 注意 |
|---|---|---|
| 範囲制限 | `vm.assume(x > 0 && x < N);` | 範囲が狭すぎると fuzz が無効 (試行が捨てられすぎる) |
| 除外条件 | `vm.assume(addr != address(0) && addr != address(this));` | reject rate < 0.5 が目安 (forge が warning 出す) |
| 状態前提 | (`vm.assume` でなく `setUp` で seed) | setUp で前提条件を seed する方が試行効率が良い |

### bound 関数の使用

`vm.assume` で reject rate が高い場合は `bound` で値を範囲内にクランプ:

```solidity
function testFuzz_GrantTimedAccess(uint256 ttl) public {
    ttl = bound(ttl, 1, 365 days);  // 1 〜 365 日に強制クランプ
    vm.prank(holder);
    uint256 expiresAt = target.grantTimedAccess(grantee, ttl);
    assertEq(expiresAt, block.timestamp + ttl);
}
```

reject なしで全 fuzz 試行を有効に使える。

### configuration

```toml
# foundry.toml
[fuzz]
runs = 1000           # default 256、 重要 fn は 1000+
seed = "0x..."        # 再現用 seed (省略推奨、 fuzz の本質は新規 sample)
max_test_rejects = 65536  # reject 上限 (これを超えると fuzz 失敗扱い)
```

## invariant test

### 基本パターン

```solidity
contract TokenInvariantTest is Test {
    Token public token;
    Handler public handler;

    function setUp() public {
        token = new Token();
        handler = new Handler(token);
        // handler を targetContract に指定 (handler 経由でのみ token を操作)
        targetContract(address(handler));
    }

    // 全 state 変更後も totalSupply == sum(balanceOf) が保たれること
    function invariant_TotalSupplyEqualsSumBalance() public {
        assertEq(token.totalSupply(), handler.ghost_TotalBalance());
    }
}
```

### Handler pattern

`invariant_*` test は random sequence の operation を試行するため、 直接 contract を target にすると invalid call で fuzz が無駄になる。 Handler contract で valid sequence を制御:

```solidity
contract Handler is Test {
    Token public token;
    address[] public actors;
    uint256 public ghost_TotalBalance;

    constructor(Token _token) {
        token = _token;
        actors = new address[](5);
        for (uint i = 0; i < 5; i++) {
            actors[i] = makeAddr(string.concat("actor", vm.toString(i)));
        }
    }

    function mint(uint256 actorSeed, uint256 amount) public {
        amount = bound(amount, 1, 1e18);
        address actor = actors[bound(actorSeed, 0, actors.length - 1)];
        vm.prank(actor);
        token.mint(amount);
        ghost_TotalBalance += amount;
    }

    function transfer(uint256 fromSeed, uint256 toSeed, uint256 amount) public {
        address from = actors[bound(fromSeed, 0, actors.length - 1)];
        address to = actors[bound(toSeed, 0, actors.length - 1)];
        uint256 balance = token.balanceOf(from);
        if (balance == 0) return;
        amount = bound(amount, 1, balance);
        vm.prank(from);
        token.transfer(to, amount);
        // totalSupply 不変 (mint/burn なし) のため ghost も更新なし
    }
}
```

### configuration

```toml
# foundry.toml
[invariant]
runs = 256            # default 256
depth = 500           # 1 run あたりの operation 数 (default 500)
fail_on_revert = false # revert を許容 (true だと 1 件 revert で fuzz fail)
call_override = false # vm.prank の覆い焼き禁止
```

`fail_on_revert = false` を default 推奨 (handler が valid sequence を制御するが、 まれな edge case で revert することはあり)。

### ghost variable で invariant を表現

invariant test では「state 変更を集計した shadow variable」を ghost と呼び、 invariant の右辺で使う:

| ghost 名 | 意味 |
|---|---|
| `ghost_TotalBalance` | mint 合計から burn 合計を引いた残高 (totalSupply の shadow) |
| `ghost_LastMinter` | 最後に mint した address (invariant: `lastMinter.balanceOf() > 0`) |
| `ghost_GrantCount` | grant 回数の累積 (invariant: `accessCount <= grantCount * maxAccess`) |

```solidity
function invariant_BalanceSumEqualsTotalSupply() public {
    uint256 sumBalance = 0;
    for (uint i = 0; i < handler.actorCount(); i++) {
        sumBalance += token.balanceOf(handler.actors(i));
    }
    assertEq(sumBalance, token.totalSupply());
}
```

## reentrancy attack pattern

```solidity
contract ReentrancyAttacker {
    Vault public vault;
    uint256 public attackCount;

    constructor(Vault _vault) {
        vault = _vault;
    }

    function attack() external payable {
        vault.deposit{value: msg.value}();
        vault.withdraw(msg.value);  // ここで receive() が呼ばれる
    }

    receive() external payable {
        if (attackCount < 3 && address(vault).balance >= msg.value) {
            attackCount++;
            vault.withdraw(msg.value);  // 再入
        }
    }
}

contract VaultTest is Test {
    Vault public vault;

    function test_Deposit_RejectsReentrancy() public {
        vault = new Vault();
        ReentrancyAttacker attacker = new ReentrancyAttacker(vault);
        vm.deal(address(attacker), 10 ether);

        // ReentrancyGuard で 2 回目以降の withdraw が revert することを確認
        vm.expectRevert("ReentrancyGuard: reentrant call");
        attacker.attack{value: 1 ether}();
    }
}
```

## signature recovery test (EIP-712 / personal_sign)

```solidity
function test_Permit_AcceptsValidSig() public {
    uint256 privateKey = 0x1234;
    address owner = vm.addr(privateKey);
    uint256 deadline = block.timestamp + 1 hours;

    bytes32 digest = keccak256(abi.encodePacked(
        "\x19\x01",
        target.DOMAIN_SEPARATOR(),
        keccak256(abi.encode(PERMIT_TYPEHASH, owner, spender, value, target.nonces(owner), deadline))
    ));

    (uint8 v, bytes32 r, bytes32 s) = vm.sign(privateKey, digest);

    target.permit(owner, spender, value, deadline, v, r, s);
    assertEq(target.allowance(owner, spender), value);
}

function test_Permit_RejectsForgedSig() public {
    uint256 attackerKey = 0x9999;
    address owner = vm.addr(0x1234);  // 別 key で sign された owner

    bytes32 digest = keccak256(/* 同じ permit 構造 */);
    (uint8 v, bytes32 r, bytes32 s) = vm.sign(attackerKey, digest);

    vm.expectRevert("ERC20Permit: invalid signature");
    target.permit(owner, spender, value, deadline, v, r, s);
}
```

## fork test (mainnet state での test)

```solidity
function setUp() public {
    uint256 forkId = vm.createSelectFork(vm.rpcUrl("mainnet"), 18_000_000);
    target = new MyContract();
}

function test_AgainstMainnetState() public {
    address whale = 0x...;  // 実 mainnet の whale address
    vm.startPrank(whale);
    // mainnet state を使った test
}
```

`foundry.toml` の `rpc_endpoints` で `mainnet = "https://..."` を設定。

## 関連

- SSOT: `docs/SKILL-DESIGN.ja.md` § Step 3 / Step 4
- 観点 → helper マッピング: `references/foundry-mapping.md`
- example: `examples/example-token-gating.t.sol`
