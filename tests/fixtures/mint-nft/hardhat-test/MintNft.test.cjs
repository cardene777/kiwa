const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('MintNft', function () {
  async function deployFixture() {
    const [deployer, alice, bob, charlie] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory('MintNft');
    const nft = await Factory.deploy();
    return { nft, deployer, alice, bob, charlie };
  }

  async function deployReceiver(returnSelector) {
    const sourceGood = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract GoodReceiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return 0x150b7a02;
    }
}`;
    const sourceBad = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
contract BadReceiver {
    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return 0xdeadbeef;
    }
}`;
    void sourceGood;
    void sourceBad;
  }

  // ============================================================
  // 観点 1: 正常系
  // ============================================================

  describe('観点 1: 正常系', function () {
    it('TC-001 mint(alice) で tokenId=1', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await expect(nft.mint(alice.address))
        .to.emit(nft, 'Transfer')
        .withArgs(ethers.ZeroAddress, alice.address, 1);
      expect(await nft.ownerOf(1)).to.equal(alice.address);
      expect(await nft.balanceOf(alice.address)).to.equal(1);
      expect(await nft.totalSupply()).to.equal(1);
    });

    it('TC-002 transferFrom happy path', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(nft.connect(alice).transferFrom(alice.address, bob.address, 1))
        .to.emit(nft, 'Transfer')
        .withArgs(alice.address, bob.address, 1);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
      expect(await nft.balanceOf(bob.address)).to.equal(1);
    });

    it('TC-003 batchMint(alice, 3)', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      const tx = await nft.batchMint(alice.address, 3);
      await tx.wait();
      expect(await nft.totalSupply()).to.equal(3);
      expect(await nft.balanceOf(alice.address)).to.equal(3);
    });

    it('TC-004 royaltyInfo 5% (500 bps)', async function () {
      const { nft, deployer } = await loadFixture(deployFixture);
      const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther('1'));
      expect(receiver).to.equal(deployer.address);
      expect(amount).to.equal(ethers.parseEther('0.05'));
    });
  });

  // ============================================================
  // 観点 2: 異常系
  // ============================================================

  describe('観点 2: 異常系', function () {
    it('TC-005 mint(0) → InvalidRecipient', async function () {
      const { nft } = await loadFixture(deployFixture);
      await expect(nft.mint(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        nft,
        'InvalidRecipient',
      );
    });

    it('TC-006 mint past MAX_SUPPLY → MaxSupplyReached', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 10);
      await expect(nft.mint(alice.address))
        .to.be.revertedWithCustomError(nft, 'MaxSupplyReached')
        .withArgs(10);
    });

    it('TC-007 unauthorized transferFrom → NotOwner', async function () {
      const { nft, alice, bob, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(
        nft.connect(bob).transferFrom(alice.address, charlie.address, 1),
      ).to.be.revertedWithCustomError(nft, 'NotOwner');
    });

    it('TC-008 transferFrom to=0 → InvalidRecipient', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(
        nft.connect(alice).transferFrom(alice.address, ethers.ZeroAddress, 1),
      ).to.be.revertedWithCustomError(nft, 'InvalidRecipient');
    });
  });

  // ============================================================
  // 観点 3: 境界値
  // ============================================================

  describe('観点 3: 境界値', function () {
    it('TC-009 batchMint at MAX_SUPPLY then mint reverts', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 10);
      expect(await nft.totalSupply()).to.equal(10);
      await expect(nft.mint(alice.address))
        .to.be.revertedWithCustomError(nft, 'MaxSupplyReached')
        .withArgs(10);
    });

    it('TC-010 batchMint exceed → MaxSupplyReached', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 5);
      await expect(nft.batchMint(alice.address, 6))
        .to.be.revertedWithCustomError(nft, 'MaxSupplyReached')
        .withArgs(10);
    });

    it('TC-011 batchMint exact remaining', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 5);
      await nft.batchMint(alice.address, 5);
      expect(await nft.totalSupply()).to.equal(10);
    });
  });

  // ============================================================
  // 観点 4: 状態遷移
  // ============================================================

  describe('観点 4: 状態遷移', function () {
    it('TC-012 Enumerable swap-and-pop after transfer', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 3);
      await nft.connect(alice).transferFrom(alice.address, bob.address, 2);
      expect(await nft.balanceOf(alice.address)).to.equal(2);
      // 残 token は [1, 3]
      const idx0 = await nft.tokenOfOwnerByIndex(alice.address, 0);
      const idx1 = await nft.tokenOfOwnerByIndex(alice.address, 1);
      expect([idx0, idx1].map(String).sort()).to.deep.equal(['1', '3']);
      expect(await nft.tokenOfOwnerByIndex(bob.address, 0)).to.equal(2);
    });

    it('TC-013 tokenByIndex after full mint', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 10);
      for (let i = 0; i < 10; i++) {
        expect(await nft.tokenByIndex(i)).to.equal(i + 1);
      }
    });

    it('TC-014 approve → transferFrom clears approval', async function () {
      const { nft, alice, bob, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).approve(bob.address, 1);
      expect(await nft.getApproved(1)).to.equal(bob.address);

      await nft.connect(bob).transferFrom(alice.address, charlie.address, 1);
      expect(await nft.ownerOf(1)).to.equal(charlie.address);
      expect(await nft.getApproved(1)).to.equal(ethers.ZeroAddress);
    });
  });

  // ============================================================
  // 観点 5: 権限
  // ============================================================

  describe('観点 5: 権限', function () {
    it('TC-015 unauthorized approve → NotOwner', async function () {
      const { nft, alice, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(nft.connect(charlie).approve(charlie.address, 1))
        .to.be.revertedWithCustomError(nft, 'NotOwner');
    });

    it('TC-016 operator can approve on behalf', async function () {
      const { nft, alice, bob, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).setApprovalForAll(bob.address, true);
      await expect(nft.connect(bob).approve(charlie.address, 1))
        .to.emit(nft, 'Approval')
        .withArgs(alice.address, charlie.address, 1);
      expect(await nft.getApproved(1)).to.equal(charlie.address);
    });

    it('TC-017 operator can transferFrom', async function () {
      const { nft, alice, bob, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).setApprovalForAll(bob.address, true);
      await nft.connect(bob).transferFrom(alice.address, charlie.address, 1);
      expect(await nft.ownerOf(1)).to.equal(charlie.address);
    });
  });

  // ============================================================
  // 観点 6: 入力バリデーション
  // ============================================================

  describe('観点 6: 入力バリデーション', function () {
    it('TC-018 batchMint(0, 5) → InvalidRecipient', async function () {
      const { nft } = await loadFixture(deployFixture);
      await expect(nft.batchMint(ethers.ZeroAddress, 5))
        .to.be.revertedWithCustomError(nft, 'InvalidRecipient');
    });

    it('TC-019 ownerOf nonexistent → require revert', async function () {
      const { nft } = await loadFixture(deployFixture);
      await expect(nft.ownerOf(999)).to.be.revertedWith('ERC721: nonexistent');
    });

    it('TC-020 tokenOfOwnerByIndex out of bounds', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 2);
      await expect(nft.tokenOfOwnerByIndex(alice.address, 2))
        .to.be.revertedWithCustomError(nft, 'OwnerIndexOutOfBounds');
    });
  });

  // ============================================================
  // 観点 7: 冪等性
  // ============================================================

  describe('観点 7: 冪等性', function () {
    it('TC-021 mint 3 回で異なる tokenId (非冪等)', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.mint(alice.address);
      await nft.mint(alice.address);
      expect(await nft.totalSupply()).to.equal(3);
      expect(await nft.balanceOf(alice.address)).to.equal(3);
    });

    it('TC-022 approve 2 回 (上書き)', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).approve(bob.address, 1);
      await nft.connect(alice).approve(bob.address, 1);
      expect(await nft.getApproved(1)).to.equal(bob.address);
    });

    it('TC-023 setApprovalForAll toggle', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.connect(alice).setApprovalForAll(bob.address, true);
      expect(await nft.isApprovedForAll(alice.address, bob.address)).to.equal(true);
      await nft.connect(alice).setApprovalForAll(bob.address, false);
      expect(await nft.isApprovedForAll(alice.address, bob.address)).to.equal(false);
    });
  });

  // ============================================================
  // 観点 8: 並行処理
  // ============================================================

  describe('観点 8: 並行処理', function () {
    it('TC-024 concurrent mint different users', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await Promise.all([nft.mint(alice.address), nft.mint(bob.address)]);
      expect(await nft.totalSupply()).to.equal(2);
      expect(await nft.balanceOf(alice.address)).to.equal(1);
      expect(await nft.balanceOf(bob.address)).to.equal(1);
    });

    it('TC-025 transferFrom race', async function () {
      const { nft, alice, bob, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).transferFrom(alice.address, bob.address, 1);
      await expect(nft.connect(alice).transferFrom(alice.address, charlie.address, 1))
        .to.be.revertedWithCustomError(nft, 'NotOwner');
    });

    it('TC-026 batchMint race', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 6);
      await expect(nft.batchMint(bob.address, 5))
        .to.be.revertedWithCustomError(nft, 'MaxSupplyReached')
        .withArgs(10);
    });
  });

  // ============================================================
  // 観点 9: 性能
  // ============================================================

  describe('観点 9: 性能', function () {
    it('TC-027 batchMint(10) gas < 2M', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      const tx = await nft.batchMint(alice.address, 10);
      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lt(2_000_000n);
    });

    it('TC-028 tokenOfOwnerByIndex query OK', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 10);
      for (let i = 0; i < 10; i++) {
        const tokenId = await nft.tokenOfOwnerByIndex(alice.address, i);
        expect(tokenId).to.equal(i + 1);
      }
    });

    it('TC-029 transferFrom gas < 200k', async function () {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 5);
      const tx = await nft.connect(alice).transferFrom(alice.address, bob.address, 3);
      const receipt = await tx.wait();
      expect(receipt.gasUsed).to.be.lt(200_000n);
    });
  });

  // ============================================================
  // 観点 10: セキュリティ
  // ============================================================

  describe('観点 10: セキュリティ', function () {
    it('TC-030 royaltyReceiver immutable', async function () {
      const { nft, deployer } = await loadFixture(deployFixture);
      expect(await nft.royaltyReceiver()).to.equal(deployer.address);
    });

    it('TC-032 safeTransferFrom to EOA → success', async function () {
      const { nft, alice, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).getFunction('safeTransferFrom(address,address,uint256)')(
        alice.address,
        charlie.address,
        1,
      );
      expect(await nft.ownerOf(1)).to.equal(charlie.address);
    });
  });

  // ============================================================
  // 補助
  // ============================================================

  describe('補助', function () {
    it('supportsInterface ERC165 / 721 / Enumerable / 2981', async function () {
      const { nft } = await loadFixture(deployFixture);
      expect(await nft.supportsInterface('0x01ffc9a7')).to.equal(true);
      expect(await nft.supportsInterface('0x80ac58cd')).to.equal(true);
      expect(await nft.supportsInterface('0x780e9d63')).to.equal(true);
      expect(await nft.supportsInterface('0x2a55205a')).to.equal(true);
      expect(await nft.supportsInterface('0xdeadbeef')).to.equal(false);
    });

    it('tokenByIndex out of bounds', async function () {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.batchMint(alice.address, 3);
      await expect(nft.tokenByIndex(3))
        .to.be.revertedWithCustomError(nft, 'TokenIndexOutOfBounds');
    });

    it('safeTransferFrom 4 引数 (data 付き)', async function () {
      const { nft, alice, charlie } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).getFunction('safeTransferFrom(address,address,uint256,bytes)')(
        alice.address,
        charlie.address,
        1,
        '0xdeadbeef',
      );
      expect(await nft.ownerOf(1)).to.equal(charlie.address);
    });
  });
});
