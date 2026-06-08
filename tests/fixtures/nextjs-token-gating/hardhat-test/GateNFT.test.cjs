const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('GateNFT', function () {
  async function deployFixture() {
    const [alice, bob, charlie] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory('GateNFT');
    const nft = await NFT.deploy();
    return { nft, alice, bob, charlie };
  }

  // ============================================================
  // 観点 1: 正常系
  // ============================================================

  describe('観点 1: 正常系', function () {
    it('TC-001 mint() で tokenId=1 が発行され Transfer emit', async function () {
      const { nft, alice } = await loadFixture(deployFixture);

      await expect(nft.connect(alice).mint())
        .to.emit(nft, 'Transfer')
        .withArgs(ethers.ZeroAddress, alice.address, 1);

      expect(await nft.ownerOf(1)).to.equal(alice.address);
      expect(await nft.balanceOf(alice.address)).to.equal(1);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it('TC-004 transferFrom で所有権移転 + Transfer emit', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.connect(alice).mint();

      await expect(nft.connect(alice).transferFrom(alice.address, bob.address, 1))
        .to.emit(nft, 'Transfer')
        .withArgs(alice.address, bob.address, 1);

      expect(await nft.ownerOf(1)).to.equal(bob.address);
      expect(await nft.balanceOf(alice.address)).to.equal(0);
      expect(await nft.balanceOf(bob.address)).to.equal(1);
    });
  });

  // ============================================================
  // 観点 2: 異常系
  // ============================================================

  describe('観点 2: 異常系', function () {
    it('TC-008 別 user の transferFrom → NotOwner revert', async function () {
      const { nft, alice, bob, charlie } = await loadFixture(deployFixture);
      await nft.connect(alice).mint();

      await expect(
        nft.connect(bob).transferFrom(alice.address, charlie.address, 1),
      ).to.be.revertedWithCustomError(nft, 'NotOwner');
    });

    it('TC-009 transferFrom to=address(0) → InvalidRecipient revert', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.connect(alice).mint();

      await expect(
        nft.connect(alice).transferFrom(alice.address, ethers.ZeroAddress, 1),
      ).to.be.revertedWithCustomError(nft, 'InvalidRecipient');
    });

    it('TC-022 存在しない tokenId の transferFrom → NotOwner revert', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);

      await expect(
        nft.connect(alice).transferFrom(alice.address, bob.address, 999),
      ).to.be.revertedWithCustomError(nft, 'NotOwner');
    });
  });

  // ============================================================
  // 観点 4: 状態遷移
  // ============================================================

  describe('観点 4: 状態遷移', function () {
    it('TC-014 mint 3 回で totalSupply=3、 balanceOf=3', async function () {
      const { nft, alice } = await loadFixture(deployFixture);

      await nft.connect(alice).mint();
      await nft.connect(alice).mint();
      await nft.connect(alice).mint();

      expect(await nft.totalSupply()).to.equal(3);
      expect(await nft.balanceOf(alice.address)).to.equal(3);
      expect(await nft.ownerOf(1)).to.equal(alice.address);
      expect(await nft.ownerOf(2)).to.equal(alice.address);
      expect(await nft.ownerOf(3)).to.equal(alice.address);
    });
  });

  // ============================================================
  // 観点 5: 権限
  // ============================================================

  describe('観点 5: 権限', function () {
    it('TC-016 transferFrom は所有者のみ呼び出し可能', async function () {
      const { nft, alice, charlie } = await loadFixture(deployFixture);
      await nft.connect(alice).mint();

      await expect(
        nft.connect(charlie).transferFrom(alice.address, charlie.address, 1),
      ).to.be.revertedWithCustomError(nft, 'NotOwner');
    });
  });

  // ============================================================
  // 観点 6: 入力バリデーション (fast-check 相当の境界探索)
  // ============================================================

  describe('観点 6: 入力バリデーション', function () {
    it('TC-021 to=address(0) は常に InvalidRecipient', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      // 異なる mint 数で繰り返し
      for (const mintCount of [1, 3, 5, 10]) {
        const { nft: freshNft, alice: freshAlice } = await loadFixture(deployFixture);
        for (let i = 0; i < mintCount; i++) {
          await freshNft.connect(freshAlice).mint();
        }
        await expect(
          freshNft.connect(freshAlice).transferFrom(freshAlice.address, ethers.ZeroAddress, 1),
        ).to.be.revertedWithCustomError(freshNft, 'InvalidRecipient');
      }
    });
  });

  // ============================================================
  // 観点 7: 冪等性 (新 tokenId 発行で非冪等)
  // ============================================================

  describe('観点 7: 冪等性', function () {
    it('TC-025 mint() 2 回で異なる tokenId 発行 (非冪等)', async function () {
      const { nft, alice } = await loadFixture(deployFixture);

      const tx1 = await nft.connect(alice).mint();
      await tx1.wait();
      const tx2 = await nft.connect(alice).mint();
      await tx2.wait();

      expect(await nft.totalSupply()).to.equal(2);
      expect(await nft.balanceOf(alice.address)).to.equal(2);
    });
  });

  // ============================================================
  // 観点 8: 並行処理
  // ============================================================

  describe('観点 8: 並行処理', function () {
    it('TC-026 同 block 内で 2 user が mint → 異なる tokenId', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);

      const [tx1, tx2] = await Promise.all([
        nft.connect(alice).mint(),
        nft.connect(bob).mint(),
      ]);
      await Promise.all([tx1.wait(), tx2.wait()]);

      expect(await nft.totalSupply()).to.equal(2);
      // alice / bob のどちらが先か順序保証はないが、 両方が 1 つずつ持つ
      expect(await nft.balanceOf(alice.address)).to.equal(1);
      expect(await nft.balanceOf(bob.address)).to.equal(1);
    });

    it('TC-028 transferFrom race — 移転後の再 transferFrom は NotOwner', async function () {
      const { nft, alice, bob, charlie } = await loadFixture(deployFixture);
      await nft.connect(alice).mint();

      await nft.connect(alice).transferFrom(alice.address, bob.address, 1);

      await expect(
        nft.connect(alice).transferFrom(alice.address, charlie.address, 1),
      ).to.be.revertedWithCustomError(nft, 'NotOwner');
    });
  });
});
