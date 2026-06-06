// /kiwa-hardhat 出力 (Layer 1 spec test-spec-nft-marketplace.md 由来)
// 用途: examples/nft-marketplace の Hardhat 経路 test 後付け導入 (Foundry .t.sol と並立)
// 観点 grouping: 1 正常系 / 2 異常系 / 3 境界値 / 4 状態遷移 / 5 権限 / 10 セキュリティ
// 対象 contract: MarketNft (ERC721 + ERC2981)

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');

describe('MarketNft (Layer 2 Hardhat example)', () => {
  async function deployFixture() {
    const [deployer, alice, bob, carol, royalty] = await ethers.getSigners();
    const MarketNft = await ethers.getContractFactory('MarketNft');
    const nft = await MarketNft.deploy(royalty.address);
    return { nft, deployer, alice, bob, carol, royalty };
  }

  describe('観点 1: 正常系', () => {
    it('TC-001 mint(alice) → tokenId=1 + Transfer event', async () => {
      const { nft, alice } = await loadFixture(deployFixture);
      await expect(nft.mint(alice.address))
        .to.emit(nft, 'Transfer')
        .withArgs(ethers.ZeroAddress, alice.address, 1);
      expect(await nft.ownerOf(1)).to.equal(alice.address);
      expect(await nft.balanceOf(alice.address)).to.equal(1n);
      expect(await nft.totalSupply()).to.equal(1n);
    });

    it('TC-002 approve(bob, 1) → getApproved == bob + Approval event', async () => {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(nft.connect(alice).approve(bob.address, 1))
        .to.emit(nft, 'Approval')
        .withArgs(alice.address, bob.address, 1);
      expect(await nft.getApproved(1)).to.equal(bob.address);
    });

    it('TC-003 setApprovalForAll(carol, true) → operator として transferFrom 可能', async () => {
      const { nft, alice, bob, carol } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(nft.connect(alice).setApprovalForAll(carol.address, true))
        .to.emit(nft, 'ApprovalForAll')
        .withArgs(alice.address, carol.address, true);
      await nft.connect(carol).transferFrom(alice.address, bob.address, 1);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    });
  });

  describe('観点 2: 異常系', () => {
    it('TC-004 mint(address(0)) → InvalidRecipient', async () => {
      const { nft } = await loadFixture(deployFixture);
      await expect(nft.mint(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        nft,
        'InvalidRecipient',
      );
    });

    it('TC-005 非 owner かつ非 operator が approve → NotOwnerOrApproved', async () => {
      const { nft, alice, bob, carol } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(
        nft.connect(bob).approve(carol.address, 1),
      ).to.be.revertedWithCustomError(nft, 'NotOwnerOrApproved');
    });

    it('TC-006 非 owner かつ非 approved が transferFrom → NotOwnerOrApproved', async () => {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(
        nft.connect(bob).transferFrom(alice.address, bob.address, 1),
      ).to.be.revertedWithCustomError(nft, 'NotOwnerOrApproved');
    });

    it('TC-007 transferFrom to address(0) → InvalidRecipient', async () => {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(
        nft.connect(alice).transferFrom(alice.address, ethers.ZeroAddress, 1),
      ).to.be.revertedWithCustomError(nft, 'InvalidRecipient');
    });

    it('TC-008 from 引数が実 owner と不一致 → NotOwnerOrApproved', async () => {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await expect(
        nft.connect(alice).transferFrom(bob.address, alice.address, 1),
      ).to.be.revertedWithCustomError(nft, 'NotOwnerOrApproved');
    });
  });

  describe('観点 3: 境界値', () => {
    it('TC-009 royaltyInfo(_, 1 ether) で 0.05 ether 返却 (500 bps)', async () => {
      const { nft, royalty } = await loadFixture(deployFixture);
      const [receiver, amount] = await nft.royaltyInfo(1, ethers.parseEther('1'));
      expect(receiver).to.equal(royalty.address);
      expect(amount).to.equal(ethers.parseEther('0.05'));
    });

    it('TC-010 royaltyInfo(_, 0) → 0 額', async () => {
      const { nft, royalty } = await loadFixture(deployFixture);
      const [receiver, amount] = await nft.royaltyInfo(1, 0);
      expect(receiver).to.equal(royalty.address);
      expect(amount).to.equal(0n);
    });

    it('TC-011 constructor royaltyReceiver=address(0) → InvalidRecipient', async () => {
      const MarketNft = await ethers.getContractFactory('MarketNft');
      await expect(MarketNft.deploy(ethers.ZeroAddress)).to.be.revertedWithCustomError(
        await MarketNft.deploy((await ethers.getSigners())[0].address),
        'InvalidRecipient',
      );
    });
  });

  describe('観点 4: 状態遷移', () => {
    it('TC-012 transferFrom 後 getApproved が delete される', async () => {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).approve(bob.address, 1);
      await nft.connect(alice).transferFrom(alice.address, bob.address, 1);
      expect(await nft.getApproved(1)).to.equal(ethers.ZeroAddress);
    });

    it('TC-013 transferFrom 後 balanceOf が +1 / -1 反映', async () => {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.mint(alice.address);
      await nft.connect(alice).transferFrom(alice.address, bob.address, 1);
      expect(await nft.balanceOf(alice.address)).to.equal(1n);
      expect(await nft.balanceOf(bob.address)).to.equal(1n);
    });
  });

  describe('観点 5: 権限', () => {
    it('TC-014 operator が approve 代行可能', async () => {
      const { nft, alice, bob, carol } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).setApprovalForAll(carol.address, true);
      await nft.connect(carol).approve(bob.address, 1);
      expect(await nft.getApproved(1)).to.equal(bob.address);
    });

    it('TC-015 個別 approve された address が transferFrom 可能', async () => {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft.connect(alice).approve(bob.address, 1);
      await nft.connect(bob).transferFrom(alice.address, bob.address, 1);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    });
  });

  describe('観点 10: セキュリティ', () => {
    it('TC-016 [CRITICAL] supportsInterface で ERC165 / ERC721 / ERC721Metadata / ERC2981 を確認', async () => {
      const { nft } = await loadFixture(deployFixture);
      expect(await nft.supportsInterface('0x01ffc9a7')).to.be.true; // ERC165
      expect(await nft.supportsInterface('0x80ac58cd')).to.be.true; // ERC721
      expect(await nft.supportsInterface('0x5b5e139f')).to.be.true; // ERC721Metadata
      expect(await nft.supportsInterface('0x2a55205a')).to.be.true; // ERC2981
      expect(await nft.supportsInterface('0xffffffff')).to.be.false;
    });

    it('TC-017 [CRITICAL] safeTransferFrom to EOA → 成功 (callback 不要)', async () => {
      const { nft, alice, bob } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      await nft
        .connect(alice)
        ['safeTransferFrom(address,address,uint256)'](alice.address, bob.address, 1);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    });

    it('TC-018 [MAJOR] tokenURI で存在しない tokenId → revert', async () => {
      const { nft } = await loadFixture(deployFixture);
      await expect(nft.tokenURI(999)).to.be.revertedWith('ERC721: nonexistent');
    });

    it('TC-019 [MAJOR] mint 後 tokenURI(1) → 空文字 (実装上の placeholder)', async () => {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      expect(await nft.tokenURI(1)).to.equal('');
    });

    it('TC-020 [MAJOR] royaltyReceiver immutable address が constructor で固定', async () => {
      const { nft, royalty } = await loadFixture(deployFixture);
      expect(await nft.royaltyReceiver()).to.equal(royalty.address);
    });

    it('TC-021 [CRITICAL] safeTransferFrom to non-receiver contract → UnsafeRecipient (callback 経路 coverage)', async () => {
      const { nft, alice } = await loadFixture(deployFixture);
      await nft.mint(alice.address);
      // SimpleMarketplace は IERC721Receiver を実装していないので catch 側経路で UnsafeRecipient
      const SimpleMarketplace = await ethers.getContractFactory('SimpleMarketplace');
      const dummyReceiver = await SimpleMarketplace.deploy(await nft.getAddress());
      await expect(
        nft
          .connect(alice)
          ['safeTransferFrom(address,address,uint256)'](alice.address, await dummyReceiver.getAddress(), 1),
      ).to.be.revertedWithCustomError(nft, 'UnsafeRecipient');
    });
  });
});
