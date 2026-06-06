// /kiwa-hardhat 出力 (Layer 1 spec test-spec-mint-nft.md 由来)
// 用途: examples/mint-nft の Hardhat 経路 test 後付け導入 (Foundry .t.sol と並立)
// 観点 grouping: 1 正常系 / 2 異常系 / 3 境界値 / 4 状態遷移 / 5 権限 / 10 セキュリティ

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const fc = require('fast-check');

describe('MintNft (Layer 2 Hardhat example)', () => {
  async function deployFixture() {
    const [deployer, alice, bob, carol] = await ethers.getSigners();
    const MintNft = await ethers.getContractFactory('MintNft');
    const target = await MintNft.deploy();
    return { target, deployer, alice, bob, carol };
  }

  describe('観点 1: 正常系', () => {
    it('TC-001 mint(alice) → tokenId == 1', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      const tx = await target.mint(alice.address);
      await expect(tx).to.emit(target, 'Transfer').withArgs(ethers.ZeroAddress, alice.address, 1);
      expect(await target.balanceOf(alice.address)).to.equal(1n);
      expect(await target.ownerOf(1)).to.equal(alice.address);
      expect(await target.totalSupply()).to.equal(1n);
    });

    it('TC-002 batchMint(alice, 3) → balanceOf 4', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await target.batchMint(alice.address, 3);
      expect(await target.balanceOf(alice.address)).to.equal(4n);
      expect(await target.totalSupply()).to.equal(4n);
    });

    it('TC-003 royaltyInfo(_, 1 ether) → 0.05 ether to deployer', async () => {
      const { target, deployer } = await loadFixture(deployFixture);
      await target.mint(deployer.address);
      const [receiver, amount] = await target.royaltyInfo(1, ethers.parseEther('1'));
      expect(receiver).to.equal(deployer.address);
      expect(amount).to.equal(ethers.parseEther('0.05'));
    });

    it('TC-004 transferFrom by owner → ownerOf == bob', async () => {
      const { target, alice, bob } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await target.connect(alice).transferFrom(alice.address, bob.address, 1);
      expect(await target.ownerOf(1)).to.equal(bob.address);
    });
  });

  describe('観点 2: 異常系', () => {
    it('TC-005 mint(address(0)) → InvalidRecipient', async () => {
      const { target } = await loadFixture(deployFixture);
      await expect(target.mint(ethers.ZeroAddress))
        .to.be.revertedWithCustomError(target, 'InvalidRecipient');
    });

    it('TC-006 非 owner transferFrom → NotOwner', async () => {
      const { target, alice, bob } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await expect(target.connect(bob).transferFrom(alice.address, bob.address, 1))
        .to.be.revertedWithCustomError(target, 'NotOwner');
    });

    it('TC-007 transferFrom to address(0) → InvalidRecipient', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await expect(target.connect(alice).transferFrom(alice.address, ethers.ZeroAddress, 1))
        .to.be.revertedWithCustomError(target, 'InvalidRecipient');
    });
  });

  describe('観点 3: 境界値', () => {
    it('TC-008 batchMint MAX_SUPPLY (10) → success', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await target.batchMint(alice.address, 10);
      expect(await target.totalSupply()).to.equal(10n);
    });

    it('TC-009 MAX_SUPPLY 到達後 mint → MaxSupplyReached', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await target.batchMint(alice.address, 10);
      await expect(target.mint(alice.address))
        .to.be.revertedWithCustomError(target, 'MaxSupplyReached');
    });

    it('TC-010 batchMint MAX_SUPPLY + 1 → MaxSupplyReached', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await expect(target.batchMint(alice.address, 11))
        .to.be.revertedWithCustomError(target, 'MaxSupplyReached');
    });

    it('fuzz batchMint count 1〜10 範囲は常に success', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 10 }), async (count) => {
          const { target: t, alice: a } = await loadFixture(deployFixture);
          await t.batchMint(a.address, count);
          expect(await t.totalSupply()).to.equal(BigInt(count));
        }),
        { numRuns: 10 }
      );
    });
  });

  describe('観点 4: 状態遷移', () => {
    it('TC-011 enumerable index が batchMint 後 連番取得', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await target.batchMint(alice.address, 4);
      expect(await target.tokenOfOwnerByIndex(alice.address, 0)).to.equal(1n);
      expect(await target.tokenOfOwnerByIndex(alice.address, 1)).to.equal(2n);
      expect(await target.tokenOfOwnerByIndex(alice.address, 2)).to.equal(3n);
      expect(await target.tokenOfOwnerByIndex(alice.address, 3)).to.equal(4n);
    });

    it('TC-012 transfer 後の enumerable index は reorder', async () => {
      const { target, alice, bob } = await loadFixture(deployFixture);
      await target.batchMint(alice.address, 4);
      await target.connect(alice).transferFrom(alice.address, bob.address, 2);
      expect(await target.balanceOf(alice.address)).to.equal(3n);
      const aliceTokens = [];
      for (let i = 0; i < 3; i++) {
        aliceTokens.push(await target.tokenOfOwnerByIndex(alice.address, i));
      }
      expect(aliceTokens.includes(2n)).to.be.false;
      expect(await target.tokenOfOwnerByIndex(bob.address, 0)).to.equal(2n);
    });
  });

  describe('観点 5: 権限', () => {
    it('TC-013 approve で bob が transferFrom 可能', async () => {
      const { target, alice, bob } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await target.connect(alice).approve(bob.address, 1);
      expect(await target.getApproved(1)).to.equal(bob.address);

      await target.connect(bob).transferFrom(alice.address, bob.address, 1);
      expect(await target.ownerOf(1)).to.equal(bob.address);
    });

    it('TC-014 setApprovalForAll で operator が transferFrom 可能', async () => {
      const { target, alice, bob, carol } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await target.connect(alice).setApprovalForAll(carol.address, true);
      expect(await target.isApprovedForAll(alice.address, carol.address)).to.be.true;

      await target.connect(carol).transferFrom(alice.address, bob.address, 1);
      expect(await target.ownerOf(1)).to.equal(bob.address);
    });
  });

  describe('観点 10: セキュリティ', () => {
    it('TC-015 safeTransferFrom to EOA → success', async () => {
      const { target, alice, bob } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await target.connect(alice)['safeTransferFrom(address,address,uint256)'](alice.address, bob.address, 1);
      expect(await target.ownerOf(1)).to.equal(bob.address);
    });

    it('TC-016 supportsInterface で ERC721 + ERC2981 を確認', async () => {
      const { target } = await loadFixture(deployFixture);
      expect(await target.supportsInterface('0x01ffc9a7')).to.be.true;  // ERC165
      expect(await target.supportsInterface('0x80ac58cd')).to.be.true;  // ERC721
      expect(await target.supportsInterface('0x780e9d63')).to.be.true;  // Enumerable
      expect(await target.supportsInterface('0x2a55205a')).to.be.true;  // ERC2981
      expect(await target.supportsInterface('0xffffffff')).to.be.false;
    });

    it('TC-020 [CRITICAL] 非 owner / 非 operator の approve → NotOwner revert', async () => {
      const { target, alice, bob, carol } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await expect(target.connect(bob).approve(carol.address, 1))
        .to.be.revertedWithCustomError(target, 'NotOwner');
    });

    it('TC-021 [CRITICAL] tokenOfOwnerByIndex で index 範囲外 → OwnerIndexOutOfBounds', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await expect(target.tokenOfOwnerByIndex(alice.address, 1))
        .to.be.revertedWithCustomError(target, 'OwnerIndexOutOfBounds');
    });

    it('TC-022 [CRITICAL] tokenByIndex で index 範囲外 → TokenIndexOutOfBounds', async () => {
      const { target, alice } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await expect(target.tokenByIndex(1))
        .to.be.revertedWithCustomError(target, 'TokenIndexOutOfBounds');
    });

    it('TC-023 [MAJOR] Approval event の args 検証', async () => {
      const { target, alice, bob } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await expect(target.connect(alice).approve(bob.address, 1))
        .to.emit(target, 'Approval').withArgs(alice.address, bob.address, 1);
    });

    it('TC-024 [MAJOR] ApprovalForAll event の args 検証', async () => {
      const { target, alice, carol } = await loadFixture(deployFixture);
      await expect(target.connect(alice).setApprovalForAll(carol.address, true))
        .to.emit(target, 'ApprovalForAll').withArgs(alice.address, carol.address, true);
    });

    it('TC-025 [MAJOR] operator が token approve を代行できる', async () => {
      const { target, alice, bob, carol } = await loadFixture(deployFixture);
      await target.mint(alice.address);
      await target.connect(alice).setApprovalForAll(carol.address, true);
      await target.connect(carol).approve(bob.address, 1);
      expect(await target.getApproved(1)).to.equal(bob.address);
    });

    it('TC-026 [MINOR] ownerOf に存在しない tokenId → revert', async () => {
      const { target } = await loadFixture(deployFixture);
      await expect(target.ownerOf(999)).to.be.revertedWith('ERC721: nonexistent');
    });
  });
});
