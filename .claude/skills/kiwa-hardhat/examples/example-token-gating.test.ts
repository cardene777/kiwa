// example: nextjs-token-gating の GatedContent.sol + GateNFT.sol を題材にした
//          Layer 1 spec (test-spec-token-gating.md) → Hardhat .test.ts 変換サンプル
// 用途 — /kiwa-hardhat skill の出力サンプル、 TC-001 〜 TC-013 の 6 観点 grouping

import { expect } from 'chai';
import { ethers } from 'hardhat';
import { loadFixture, time } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import fc from 'fast-check';

describe('GatedContent + GateNFT (Layer 2 example)', () => {
  async function deployFixture() {
    const [owner, holder, grantee, otherUser, nonHolder] = await ethers.getSigners();

    // 本 example は import 例示のため deploy は実 skill 実行時に factory.deploy() に置換
    const GateNFT = await ethers.getContractFactory('GateNFT');
    const gateNft = await GateNFT.deploy();

    const GatedContent = await ethers.getContractFactory('GatedContent');
    const gatedContent = await GatedContent.deploy(await gateNft.getAddress());

    return { gateNft, gatedContent, owner, holder, grantee, otherUser, nonHolder };
  }

  // ==========================================
  // 観点 1: 正常系 (TC-001 〜 TC-003)
  // ==========================================
  describe('観点 1: 正常系', () => {
    it('TC-001 wallet connected で mint → balanceOf == 1', async () => {
      const { gateNft, holder } = await loadFixture(deployFixture);
      const tx = await gateNft.connect(holder).mint();
      await expect(tx).to.emit(gateNft, 'Transfer').withArgs(ethers.ZeroAddress, holder.address, 1);
      expect(await gateNft.balanceOf(holder.address)).to.equal(1n);
    });

    it('TC-002 NFT 保有者が grantTimedAccess → timedAccessExpiry が set', async () => {
      const { gateNft, gatedContent, holder, grantee } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();

      const tx = await gatedContent.connect(holder).grantTimedAccess(grantee.address, 3600);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      expect(await gatedContent.timedAccessExpiry(grantee.address))
        .to.equal(BigInt(block!.timestamp) + 3600n);
      await expect(tx).to.emit(gatedContent, 'TimedAccessGranted')
        .withArgs(holder.address, grantee.address, BigInt(block!.timestamp) + 3600n);
    });

    it('TC-003 grantee 視点で getSecret → accessCount +1', async () => {
      const { gateNft, gatedContent, holder, grantee } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();
      await gatedContent.connect(holder).grantTimedAccess(grantee.address, 3600);

      const countBefore = await gatedContent.accessCount();
      const tx = await gatedContent.connect(grantee).getSecret();
      await expect(tx).to.emit(gatedContent, 'Accessed').withArgs(grantee.address);

      expect(await gatedContent.accessCount()).to.equal(countBefore + 1n);
    });
  });

  // ==========================================
  // 観点 2: 異常系 (TC-004 〜 TC-005)
  // ==========================================
  describe('観点 2: 異常系', () => {
    it('TC-004 NFT 未保有者の grantTimedAccess → NotGated revert', async () => {
      const { gatedContent, nonHolder, grantee } = await loadFixture(deployFixture);
      await expect(gatedContent.connect(nonHolder).grantTimedAccess(grantee.address, 3600))
        .to.be.revertedWithCustomError(gatedContent, 'NotGated');

      expect(await gatedContent.timedAccessExpiry(grantee.address)).to.equal(0n);
    });

    it('TC-005 access 未付与者の getSecret → NotGated revert', async () => {
      const { gatedContent, nonHolder } = await loadFixture(deployFixture);
      await expect(gatedContent.connect(nonHolder).getSecret())
        .to.be.revertedWithCustomError(gatedContent, 'NotGated');
    });
  });

  // ==========================================
  // 観点 3: 境界値 (TC-006 〜 TC-008 + fuzz)
  // ==========================================
  describe('観点 3: 境界値', () => {
    it('TC-006 ttl = 0 → InvalidTtl revert', async () => {
      const { gateNft, gatedContent, holder, grantee } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();

      await expect(gatedContent.connect(holder).grantTimedAccess(grantee.address, 0))
        .to.be.revertedWithCustomError(gatedContent, 'InvalidTtl');
    });

    it('TC-007 期限直前 (expiresAt - 1) で getSecret → success', async () => {
      const { gateNft, gatedContent, holder, grantee } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();
      const expiresAt = await gatedContent.connect(holder).grantTimedAccess.staticCall(grantee.address, 1);
      await gatedContent.connect(holder).grantTimedAccess(grantee.address, 1);

      await time.increaseTo(Number(expiresAt) - 1);
      const tx = await gatedContent.connect(grantee).getSecret();
      await expect(tx).to.emit(gatedContent, 'Accessed');
    });

    it('TC-008 期限経過後 (expiresAt + 1) で getSecret → NotGated revert', async () => {
      const { gateNft, gatedContent, holder, grantee } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();
      const expiresAt = await gatedContent.connect(holder).grantTimedAccess.staticCall(grantee.address, 1);
      await gatedContent.connect(holder).grantTimedAccess(grantee.address, 1);

      await time.increaseTo(Number(expiresAt) + 1);
      await expect(gatedContent.connect(grantee).getSecret())
        .to.be.revertedWithCustomError(gatedContent, 'NotGated');
    });

    it('TC-NNN fuzz ttl boundary (1 〜 365 days)', async () => {
      const { gateNft, gatedContent, holder, grantee } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();

      await fc.assert(
        fc.asyncProperty(
          fc.bigUintN(32).filter((ttl) => ttl > 0n && ttl <= 365n * 24n * 60n * 60n),
          async (ttl) => {
            const expiresAt = await gatedContent.connect(holder).grantTimedAccess.staticCall(
              grantee.address,
              ttl
            );
            expect(expiresAt).to.be.greaterThan(0n);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  // ==========================================
  // 観点 4: 状態遷移 (TC-009)
  // ==========================================
  describe('観点 4: 状態遷移', () => {
    it('TC-009 grantor が NFT を transfer 後、 grantee の hasAccess が false', async () => {
      const { gateNft, gatedContent, holder, grantee, otherUser } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();
      await gatedContent.connect(holder).grantTimedAccess(grantee.address, 3600);

      expect(await gatedContent.hasAccess(grantee.address)).to.be.true;

      await gateNft.connect(holder).transferFrom(holder.address, otherUser.address, 1);

      expect(await gatedContent.hasAccess(grantee.address)).to.be.false;
    });
  });

  // ==========================================
  // 観点 5: 権限 (TC-010 〜 TC-011)
  // ==========================================
  describe('観点 5: 権限', () => {
    it('TC-010 NFT 保有者の grant は success + event grantedBy が msg.sender', async () => {
      const { gateNft, gatedContent, holder, grantee } = await loadFixture(deployFixture);
      await gateNft.connect(holder).mint();

      const tx = await gatedContent.connect(holder).grantTimedAccess(grantee.address, 3600);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx).to.emit(gatedContent, 'TimedAccessGranted')
        .withArgs(holder.address, grantee.address, BigInt(block!.timestamp) + 3600n);
    });

    it('TC-011 非保有者の grant 試行は NotGated revert', async () => {
      const { gatedContent, nonHolder, grantee } = await loadFixture(deployFixture);
      await expect(gatedContent.connect(nonHolder).grantTimedAccess(grantee.address, 3600))
        .to.be.revertedWithCustomError(gatedContent, 'NotGated');
    });
  });

  // ==========================================
  // 観点 10: セキュリティ (TC-012 〜 TC-013)
  // ==========================================
  describe('観点 10: セキュリティ', () => {
    it('TC-012 grantor の transfer で 2 grantee 同時に access 失効', async () => {
      const { gateNft, gatedContent, holder, otherUser } = await loadFixture(deployFixture);
      const [, , , , , granteeA, granteeB] = await ethers.getSigners();
      await gateNft.connect(holder).mint();
      await gatedContent.connect(holder).grantTimedAccess(granteeA.address, 3600);
      await gatedContent.connect(holder).grantTimedAccess(granteeB.address, 3600);

      expect(await gatedContent.hasAccess(granteeA.address)).to.be.true;
      expect(await gatedContent.hasAccess(granteeB.address)).to.be.true;

      await gateNft.connect(holder).transferFrom(holder.address, otherUser.address, 1);

      expect(await gatedContent.hasAccess(granteeA.address)).to.be.false;
      expect(await gatedContent.hasAccess(granteeB.address)).to.be.false;
    });

    it('TC-013 非保有者の self-grant 試行は NotGated revert (bypass 防御)', async () => {
      const { gatedContent, nonHolder } = await loadFixture(deployFixture);
      await expect(gatedContent.connect(nonHolder).grantTimedAccess(nonHolder.address, 3600))
        .to.be.revertedWithCustomError(gatedContent, 'NotGated');
    });
  });
});
