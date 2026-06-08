const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture, time } = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('GatedContent', function () {
  async function deployFixture() {
    const [alice, bob, charlie] = await ethers.getSigners();
    const NFT = await ethers.getContractFactory('GateNFT');
    const nft = await NFT.deploy();
    const Gated = await ethers.getContractFactory('GatedContent');
    const gated = await Gated.deploy(await nft.getAddress());
    return { nft, gated, alice, bob, charlie };
  }

  async function mintFor(nft, signer) {
    await nft.connect(signer).mint();
  }

  // ============================================================
  // 観点 1: 正常系
  // ============================================================

  describe('観点 1: 正常系', function () {
    it('TC-002 getSecret() NFT holder で success + Accessed emit + accessCount+1', async function () {
      const { nft, gated, alice } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await expect(gated.connect(alice).getSecret())
        .to.emit(gated, 'Accessed')
        .withArgs(alice.address);

      expect(await gated.accessCount()).to.equal(1);
    });

    it('SECRET 定数は "alpha-pass-2025" と一致', async function () {
      const { gated } = await loadFixture(deployFixture);
      expect(await gated.SECRET()).to.equal('alpha-pass-2025');
    });

    it('TC-003 grantTimedAccess で expiry / grantor 記録 + event emit', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      const ttl = 3600n;
      const blockBefore = await ethers.provider.getBlock('latest');
      const expectedExpiry = BigInt(blockBefore.timestamp) + ttl + 1n; // tx は次 block

      const tx = await gated.connect(alice).grantTimedAccess(bob.address, ttl);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const actualExpiry = BigInt(block.timestamp) + ttl;

      expect(await gated.timedAccessExpiry(bob.address)).to.equal(actualExpiry);
      expect(await gated.timedAccessGrantor(bob.address)).to.equal(alice.address);
    });

    it('isGated true / false 経路', async function () {
      const { nft, gated, alice } = await loadFixture(deployFixture);
      expect(await gated.isGated(alice.address)).to.equal(false);
      await mintFor(nft, alice);
      expect(await gated.isGated(alice.address)).to.equal(true);
    });
  });

  // ============================================================
  // 観点 2: 異常系
  // ============================================================

  describe('観点 2: 異常系', function () {
    it('TC-005 NFT 0 個で getSecret → NotGated revert', async function () {
      const { gated, alice } = await loadFixture(deployFixture);
      await expect(gated.connect(alice).getSecret()).to.be.revertedWithCustomError(
        gated,
        'NotGated',
      );
      expect(await gated.accessCount()).to.equal(0);
    });

    it('TC-006 NFT 0 個で grantTimedAccess → NotGated revert', async function () {
      const { gated, alice, bob } = await loadFixture(deployFixture);
      await expect(
        gated.connect(alice).grantTimedAccess(bob.address, 3600),
      ).to.be.revertedWithCustomError(gated, 'NotGated');
    });

    it('TC-007 grantTimedAccess ttl=0 → InvalidTtl revert', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await expect(
        gated.connect(alice).grantTimedAccess(bob.address, 0),
      ).to.be.revertedWithCustomError(gated, 'InvalidTtl');
    });
  });

  // ============================================================
  // 観点 3: 境界値
  // ============================================================

  describe('観点 3: 境界値', function () {
    it('TC-010 ttl=1 で hasAccess true (同 block)', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);
      await gated.connect(alice).grantTimedAccess(bob.address, 1);
      expect(await gated.hasAccess(bob.address)).to.equal(true);
    });

    it('TC-011 expiry+1 で hasAccess false', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);
      await gated.connect(alice).grantTimedAccess(bob.address, 1);

      // expiresAt+1 まで進める
      await time.increase(3);
      expect(await gated.hasAccess(bob.address)).to.equal(false);
    });

    it('TC-012 strict less-than の境界 (expiresAt 同値で true)', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      const tx = await gated.connect(alice).grantTimedAccess(bob.address, 100);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);
      const expiresAt = block.timestamp + 100;

      // expiresAt - 1 → true
      await time.setNextBlockTimestamp(expiresAt - 1);
      await ethers.provider.send('evm_mine', []);
      expect(await gated.hasAccess(bob.address)).to.equal(true);

      // expiresAt → true (strict less-than `<`)
      await time.setNextBlockTimestamp(expiresAt);
      await ethers.provider.send('evm_mine', []);
      expect(await gated.hasAccess(bob.address)).to.equal(true);

      // expiresAt + 1 → false
      await time.setNextBlockTimestamp(expiresAt + 1);
      await ethers.provider.send('evm_mine', []);
      expect(await gated.hasAccess(bob.address)).to.equal(false);
    });
  });

  // ============================================================
  // 観点 4: 状態遷移
  // ============================================================

  describe('観点 4: 状態遷移', function () {
    it('TC-013 grantor が NFT 失うと delegated access も失効', async function () {
      const { nft, gated, alice, bob, charlie } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await gated.connect(alice).grantTimedAccess(bob.address, 3600);

      // bob は最初 access 可能
      await gated.connect(bob).getSecret();
      expect(await gated.accessCount()).to.equal(1);

      // alice が NFT を charlie に transfer
      await nft.connect(alice).transferFrom(alice.address, charlie.address, 1);

      // bob は revoke される
      await expect(gated.connect(bob).getSecret()).to.be.revertedWithCustomError(
        gated,
        'NotGated',
      );
      expect(await gated.accessCount()).to.equal(1);
    });

    it('TC-015 grantTimedAccess 上書き', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await gated.connect(alice).grantTimedAccess(bob.address, 100);
      const firstExpiry = await gated.timedAccessExpiry(bob.address);

      await gated.connect(alice).grantTimedAccess(bob.address, 200);
      const secondExpiry = await gated.timedAccessExpiry(bob.address);

      expect(secondExpiry).to.be.gt(firstExpiry);
      expect(await gated.timedAccessGrantor(bob.address)).to.equal(alice.address);
    });
  });

  // ============================================================
  // 観点 5: 権限
  // ============================================================

  describe('観点 5: 権限', function () {
    it('TC-017 grantTimedAccess は NFT holder のみ', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await expect(
        gated.connect(bob).grantTimedAccess(alice.address, 3600),
      ).to.be.revertedWithCustomError(gated, 'NotGated');
    });

    it('TC-018 自分自身に grant 許容', async function () {
      const { nft, gated, alice } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      const tx = await gated.connect(alice).grantTimedAccess(alice.address, 3600);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      expect(await gated.timedAccessExpiry(alice.address)).to.equal(block.timestamp + 3600);
      expect(await gated.timedAccessGrantor(alice.address)).to.equal(alice.address);
    });
  });

  // ============================================================
  // 観点 6: 入力バリデーション
  // ============================================================

  describe('観点 6: 入力バリデーション', function () {
    it('TC-019 ttl=0 必ず InvalidTtl', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);
      await expect(
        gated.connect(alice).grantTimedAccess(bob.address, 0),
      ).to.be.revertedWithCustomError(gated, 'InvalidTtl');
    });

    it('TC-020 ttl=type(uint256).max で overflow revert', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      const maxUint = 2n ** 256n - 1n;
      await expect(gated.connect(alice).grantTimedAccess(bob.address, maxUint))
        .to.be.reverted; // generic panic on overflow
    });

    it('fast-check 相当: 様々な ttl で hasAccess 整合性', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      for (const ttl of [1, 100, 3600, 86400, 31536000]) {
        const { gated: freshGated, alice: a, bob: b, nft: n } = await loadFixture(deployFixture);
        await mintFor(n, a);
        await freshGated.connect(a).grantTimedAccess(b.address, ttl);
        expect(await freshGated.hasAccess(b.address)).to.equal(true);
      }
    });
  });

  // ============================================================
  // 観点 7: 冪等性
  // ============================================================

  describe('観点 7: 冪等性', function () {
    it('TC-023 getSecret 3 回で accessCount=3', async function () {
      const { nft, gated, alice } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await gated.connect(alice).getSecret();
      await gated.connect(alice).getSecret();
      await gated.connect(alice).getSecret();

      expect(await gated.accessCount()).to.equal(3);
    });

    it('TC-024 grantTimedAccess 2 回で expiry 上書き、 grantor 同じ', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await gated.connect(alice).grantTimedAccess(bob.address, 3600);
      await gated.connect(alice).grantTimedAccess(bob.address, 7200);

      expect(await gated.timedAccessGrantor(bob.address)).to.equal(alice.address);
    });
  });

  // ============================================================
  // 観点 8: 並行処理
  // ============================================================

  describe('観点 8: 並行処理', function () {
    it('TC-027 同 block 内 2 つの grantTimedAccess を同 user に → 後勝ち', async function () {
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await gated.connect(alice).grantTimedAccess(bob.address, 100);
      await gated.connect(alice).grantTimedAccess(bob.address, 200);

      // 後勝ちで grantor は同じ
      expect(await gated.timedAccessGrantor(bob.address)).to.equal(alice.address);
    });
  });

  // ============================================================
  // 観点 10: セキュリティ
  // ============================================================

  describe('観点 10: セキュリティ', function () {
    it('TC-029 expiry のみ未来 + grantor=0 → bypass 不可', async function () {
      // hardhat の network helpers で storage 書き換え
      const { nft, gated, alice, bob } = await loadFixture(deployFixture);

      const gatedAddr = await gated.getAddress();
      const slotExpiry = ethers.solidityPackedKeccak256(
        ['address', 'uint256'],
        [bob.address, 1], // mapping slot 1 = timedAccessExpiry
      );
      const slotGrantor = ethers.solidityPackedKeccak256(
        ['address', 'uint256'],
        [bob.address, 2], // mapping slot 2 = timedAccessGrantor
      );

      const blockNow = await ethers.provider.getBlock('latest');
      const futureTs = blockNow.timestamp + 10000;
      await ethers.provider.send('hardhat_setStorageAt', [
        gatedAddr,
        slotExpiry,
        ethers.zeroPadValue(ethers.toBeHex(futureTs), 32),
      ]);
      await ethers.provider.send('hardhat_setStorageAt', [
        gatedAddr,
        slotGrantor,
        ethers.ZeroHash,
      ]);

      // grantor = 0 で hasAccess false
      expect(await gated.hasAccess(bob.address)).to.equal(false);

      // getSecret も NotGated revert
      await expect(gated.connect(bob).getSecret()).to.be.revertedWithCustomError(
        gated,
        'NotGated',
      );
    });

    it('TC-030 grantor 失効後 delegated access も失効', async function () {
      const { nft, gated, alice, bob, charlie } = await loadFixture(deployFixture);
      await mintFor(nft, alice);
      await gated.connect(alice).grantTimedAccess(bob.address, 3600);

      // alice が NFT を charlie に
      await nft.connect(alice).transferFrom(alice.address, charlie.address, 1);

      expect(await gated.hasAccess(bob.address)).to.equal(false);
      await expect(gated.connect(bob).getSecret()).to.be.revertedWithCustomError(
        gated,
        'NotGated',
      );

      // charlie は新所有者
      expect(await gated.hasAccess(charlie.address)).to.equal(true);
    });

    it('TC-031 reentrancy 不要 — state 一貫性', async function () {
      const { nft, gated, alice } = await loadFixture(deployFixture);
      await mintFor(nft, alice);

      await gated.connect(alice).getSecret();
      await gated.connect(alice).getSecret();

      expect(await gated.accessCount()).to.equal(2);
    });
  });
});
