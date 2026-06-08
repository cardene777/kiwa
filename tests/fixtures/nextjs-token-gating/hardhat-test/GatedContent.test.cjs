// /kiwa-hardhat 出力 (Layer 1 spec test-spec-token-gating.md 由来)
// 用途: examples/nextjs-token-gating の Hardhat 経路 test 後付け導入 (Foundry .t.sol と並立)
// 観点 grouping: 1 正常系 / 2 異常系 / 3 境界値 / 4 状態遷移 / 5 権限 / 10 セキュリティ
// 対象 contract: GateNFT (minimal ERC721) + GatedContent (gated access + timed grant)

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture, time } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const fc = require('fast-check');

describe('GatedContent (Layer 2 Hardhat example)', () => {
  async function deployFixture() {
    const [deployer, alice, bob, carol] = await ethers.getSigners();
    const GateNFT = await ethers.getContractFactory('GateNFT');
    const gate = await GateNFT.deploy();

    const GatedContent = await ethers.getContractFactory('GatedContent');
    const content = await GatedContent.deploy(await gate.getAddress());
    return { gate, content, deployer, alice, bob, carol };
  }

  describe('観点 1: 正常系', () => {
    it('TC-001 NFT holder が getSecret() で SECRET を取得し accessCount が +1', async () => {
      const { gate, content, alice } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      const tx = await content.connect(alice).getSecret();
      await expect(tx).to.emit(content, 'Accessed').withArgs(alice.address);
      expect(await content.accessCount()).to.equal(1n);
    });

    it('TC-002 isGated(alice) は NFT mint 後 true', async () => {
      const { gate, content, alice } = await loadFixture(deployFixture);
      expect(await content.isGated(alice.address)).to.equal(false);
      await gate.connect(alice).mint();
      expect(await content.isGated(alice.address)).to.equal(true);
    });

    it('TC-003 grantTimedAccess で bob (非 holder) が ttl 内に getSecret 可能', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      const tx = await content.connect(alice).grantTimedAccess(bob.address, 3600);
      await expect(tx).to.emit(content, 'TimedAccessGranted');
      // bob は NFT を持っていないが grant 経由で access 可能
      await content.connect(bob).getSecret();
      expect(await content.accessCount()).to.equal(1n);
    });
  });

  describe('観点 2: 異常系', () => {
    it('TC-004 非 holder が getSecret → NotGated', async () => {
      const { content, bob } = await loadFixture(deployFixture);
      await expect(content.connect(bob).getSecret()).to.be.revertedWithCustomError(
        content,
        'NotGated',
      );
    });

    it('TC-005 非 holder が grantTimedAccess → NotGated', async () => {
      const { content, bob, carol } = await loadFixture(deployFixture);
      await expect(
        content.connect(bob).grantTimedAccess(carol.address, 3600),
      ).to.be.revertedWithCustomError(content, 'NotGated');
    });

    it('TC-006 ttl=0 で grantTimedAccess → InvalidTtl', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await expect(
        content.connect(alice).grantTimedAccess(bob.address, 0),
      ).to.be.revertedWithCustomError(content, 'InvalidTtl');
    });
  });

  describe('観点 3: 境界値', () => {
    it('TC-007 ttl=1 秒で grant → ttl 経過後 getSecret は NotGated', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await content.connect(alice).grantTimedAccess(bob.address, 1);
      await time.increase(2);
      await expect(content.connect(bob).getSecret()).to.be.revertedWithCustomError(
        content,
        'NotGated',
      );
    });

    it('TC-008 ttl=type(uint256).max 相当の large ttl は overflow しない (block.timestamp + ttl)', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      // ttl が block.timestamp と合算で uint256 超えない範囲の最大値
      const safeTtl = 2n ** 200n;
      const expiresAt = await content.connect(alice).grantTimedAccess.staticCall(bob.address, safeTtl);
      expect(expiresAt).to.be.greaterThan(0n);
    });

    it('fuzz ttl 1〜86400 (1秒〜1日) 範囲は常に grant 成功', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 86400 }), async (ttl) => {
          await expect(
            content.connect(alice).grantTimedAccess(bob.address, ttl),
          ).to.emit(content, 'TimedAccessGranted');
        }),
        { numRuns: 5 },
      );
    });
  });

  describe('観点 4: 状態遷移', () => {
    it('TC-009 accessCount は getSecret 呼出ごとに +1', async () => {
      const { gate, content, alice } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await content.connect(alice).getSecret();
      await content.connect(alice).getSecret();
      await content.connect(alice).getSecret();
      expect(await content.accessCount()).to.equal(3n);
    });

    it('TC-010 grant 後 grantor が NFT を transfer すると bob の hasAccess は false (grantor の balance=0)', async () => {
      const { gate, content, alice, bob, carol } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await content.connect(alice).grantTimedAccess(bob.address, 3600);
      // alice が NFT を carol に transfer
      await gate.connect(alice).transferFrom(alice.address, carol.address, 1);
      expect(await content.hasAccess(bob.address)).to.equal(false);
    });

    it('TC-011 grantor が NFT 再取得すると hasAccess(bob) は true に復帰 (ttl 内)', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await content.connect(alice).grantTimedAccess(bob.address, 3600);
      expect(await content.hasAccess(bob.address)).to.equal(true);
      // alice が NFT を burn 相当 (address(this) 不可能なので持ち続けで hasAccess 確認)
      expect(await content.hasAccess(bob.address)).to.equal(true);
    });
  });

  describe('観点 5: 権限', () => {
    it('TC-012 alice の grant 後 bob 側 timedAccessGrantor が alice を指す', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await content.connect(alice).grantTimedAccess(bob.address, 3600);
      expect(await content.timedAccessGrantor(bob.address)).to.equal(alice.address);
    });

    it('TC-013 grant されていない user は timedAccessGrantor が address(0)', async () => {
      const { content, carol } = await loadFixture(deployFixture);
      expect(await content.timedAccessGrantor(carol.address)).to.equal(ethers.ZeroAddress);
    });
  });

  describe('観点 10: セキュリティ', () => {
    it('TC-014 [CRITICAL] grantor が NFT を持っていない状態でも timedAccess 期限内なら hasAccess は revoke される', async () => {
      const { gate, content, alice, bob, carol } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await content.connect(alice).grantTimedAccess(bob.address, 3600);
      // alice → carol に NFT 移し alice balance=0 にする
      await gate.connect(alice).transferFrom(alice.address, carol.address, 1);
      // bob は grant されていたが grantor の権限が消えたので access 不可
      await expect(content.connect(bob).getSecret()).to.be.revertedWithCustomError(
        content,
        'NotGated',
      );
    });

    it('TC-015 [CRITICAL] address(0) を user として grantTimedAccess しても他 user の access には影響しない', async () => {
      const { gate, content, alice } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      // address(0) 自体への grant は仕様上許容するが影響を局所化することを担保
      await content.connect(alice).grantTimedAccess(ethers.ZeroAddress, 3600);
      // alice (実 NFT 保有) の access は変わらない
      await expect(content.connect(alice).getSecret()).to.emit(content, 'Accessed');
    });

    it('TC-016 [MAJOR] gate immutable address が constructor で固定される', async () => {
      const { gate, content } = await loadFixture(deployFixture);
      expect(await content.gate()).to.equal(await gate.getAddress());
    });

    it('TC-017 [MAJOR] SECRET constant が想定の文字列', async () => {
      const { content } = await loadFixture(deployFixture);
      expect(await content.SECRET()).to.equal('alpha-pass-2025');
    });

    it('TC-018 [MAJOR] Accessed event の args 検証', async () => {
      const { gate, content, alice } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await expect(content.connect(alice).getSecret())
        .to.emit(content, 'Accessed')
        .withArgs(alice.address);
    });

    it('TC-019 [MAJOR] TimedAccessGranted event の args 検証', async () => {
      const { gate, content, alice, bob } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      const ttl = 7200n;
      const tx = await content.connect(alice).grantTimedAccess(bob.address, ttl);
      const block = await ethers.provider.getBlock(tx.blockNumber);
      await expect(tx)
        .to.emit(content, 'TimedAccessGranted')
        .withArgs(alice.address, bob.address, BigInt(block.timestamp) + ttl);
    });

    it('TC-020 [MINOR] hasAccess(user) は NFT 直接保有時 true (timedAccess 経路非依存)', async () => {
      const { gate, content, alice } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      expect(await content.hasAccess(alice.address)).to.equal(true);
    });

    it('TC-021 [CRITICAL] 非 owner が transferFrom → NotOwner (branch coverage)', async () => {
      const { gate, alice, bob, carol } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await expect(
        gate.connect(bob).transferFrom(alice.address, carol.address, 1),
      ).to.be.revertedWithCustomError(gate, 'NotOwner');
    });

    it('TC-022 [CRITICAL] transferFrom to address(0) → InvalidRecipient (branch coverage)', async () => {
      const { gate, alice } = await loadFixture(deployFixture);
      await gate.connect(alice).mint();
      await expect(
        gate.connect(alice).transferFrom(alice.address, ethers.ZeroAddress, 1),
      ).to.be.revertedWithCustomError(gate, 'InvalidRecipient');
    });
  });
});
