// /kiwa-hardhat 出力 (Layer 1 spec test-spec-nft-marketplace.md 由来)
// 用途: examples/nft-marketplace/SimpleMarketplace の Hardhat 経路 test (list / buy / cancel / offer / acceptOffer / royalty)
// 観点 grouping: 1 正常系 / 2 異常系 / 3 境界値 / 4 状態遷移 / 5 権限 / 10 セキュリティ

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture, time } = require('@nomicfoundation/hardhat-toolbox/network-helpers');

const PRICE = ethers.parseEther('1');
const OFFER_AMOUNT = ethers.parseEther('0.5');

describe('SimpleMarketplace (Layer 2 Hardhat example)', () => {
  async function deployFixture() {
    const [deployer, alice, bob, carol, royalty] = await ethers.getSigners();
    const MarketNft = await ethers.getContractFactory('MarketNft');
    const nft = await MarketNft.deploy(royalty.address);

    const SimpleMarketplace = await ethers.getContractFactory('SimpleMarketplace');
    const market = await SimpleMarketplace.deploy(await nft.getAddress());

    await nft.mint(alice.address);
    await nft.connect(alice).approve(await market.getAddress(), 1);

    return { nft, market, deployer, alice, bob, carol, royalty };
  }

  describe('観点 1: 正常系', () => {
    it('TC-001 list(1, price) → Listed event + listings[1].active=true', async () => {
      const { market, alice } = await loadFixture(deployFixture);
      await expect(market.connect(alice).list(1, PRICE))
        .to.emit(market, 'Listed')
        .withArgs(1, alice.address, PRICE);
      const listing = await market.listings(1);
      expect(listing.active).to.equal(true);
      expect(listing.seller).to.equal(alice.address);
      expect(listing.price).to.equal(PRICE);
    });

    it('TC-002 buy(1) で nft が bob に transfer + Bought event + seller proceeds (95%) + royalty (5%)', async () => {
      const { nft, market, alice, bob, royalty } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      const aliceBefore = await ethers.provider.getBalance(alice.address);
      const royaltyBefore = await ethers.provider.getBalance(royalty.address);
      await expect(market.connect(bob).buy(1, { value: PRICE }))
        .to.emit(market, 'Bought')
        .withArgs(1, bob.address, PRICE);
      expect(await nft.ownerOf(1)).to.equal(bob.address);
      expect((await ethers.provider.getBalance(alice.address)) - aliceBefore).to.equal(
        ethers.parseEther('0.95'),
      );
      expect((await ethers.provider.getBalance(royalty.address)) - royaltyBefore).to.equal(
        ethers.parseEther('0.05'),
      );
    });

    it('TC-003 cancel(1) → listings[1] が delete + Cancelled event', async () => {
      const { market, alice } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      await expect(market.connect(alice).cancel(1))
        .to.emit(market, 'Cancelled')
        .withArgs(1);
      const listing = await market.listings(1);
      expect(listing.active).to.equal(false);
    });

    it('TC-004 makeOffer(1, amount) → OfferMade event + offers[1].active=true', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      const tx = await market.connect(bob)['makeOffer(uint256,uint256)'](1, OFFER_AMOUNT, {
        value: OFFER_AMOUNT,
      });
      await expect(tx).to.emit(market, 'OfferMade');
      const offer = await market.offers(1);
      expect(offer.active).to.equal(true);
      expect(offer.buyer).to.equal(bob.address);
      expect(offer.amount).to.equal(OFFER_AMOUNT);
    });

    it('TC-005 acceptOffer(1) → nft transfer + seller proceeds + royalty 支払い', async () => {
      const { nft, market, alice, bob, royalty } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      const aliceBefore = await ethers.provider.getBalance(alice.address);
      const royaltyBefore = await ethers.provider.getBalance(royalty.address);
      const tx = await market.connect(alice).acceptOffer(1);
      await expect(tx).to.emit(market, 'OfferAccepted').withArgs(1, 1, bob.address);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      expect(await nft.ownerOf(1)).to.equal(bob.address);
      // alice の受取 = 0.5 ether * 95% (royalty 5% 控除) - gas
      expect(
        (await ethers.provider.getBalance(alice.address)) - aliceBefore + gasCost,
      ).to.equal(ethers.parseEther('0.475'));
      expect((await ethers.provider.getBalance(royalty.address)) - royaltyBefore).to.equal(
        ethers.parseEther('0.025'),
      );
    });
  });

  describe('観点 2: 異常系', () => {
    it('TC-006 非 owner が list → NotOwner', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      await expect(market.connect(bob).list(1, PRICE)).to.be.revertedWithCustomError(
        market,
        'NotOwner',
      );
    });

    it('TC-007 approve なしで list → NotApproved', async () => {
      const { nft, market, alice } = await loadFixture(deployFixture);
      // alice の approve を別 address に変える
      await nft.connect(alice).approve(alice.address, 1);
      await expect(market.connect(alice).list(1, PRICE)).to.be.revertedWithCustomError(
        market,
        'NotApproved',
      );
    });

    it('TC-008 重複 list → AlreadyListed', async () => {
      const { market, alice } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      await expect(market.connect(alice).list(1, PRICE)).to.be.revertedWithCustomError(
        market,
        'AlreadyListed',
      );
    });

    it('TC-009 listing 無しで buy → NotActive', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      await expect(
        market.connect(bob).buy(1, { value: PRICE }),
      ).to.be.revertedWithCustomError(market, 'NotActive');
    });

    it('TC-010 buy で payment 不足 → InsufficientPayment', async () => {
      const { market, alice, bob } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      await expect(
        market.connect(bob).buy(1, { value: ethers.parseEther('0.5') }),
      ).to.be.revertedWithCustomError(market, 'InsufficientPayment');
    });

    it('TC-011 listing 無しで cancel → NotActive', async () => {
      const { market, alice } = await loadFixture(deployFixture);
      await expect(market.connect(alice).cancel(1)).to.be.revertedWithCustomError(
        market,
        'NotActive',
      );
    });

    it('TC-012 別 seller が cancel → NotOwner', async () => {
      const { market, alice, bob } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      await expect(market.connect(bob).cancel(1)).to.be.revertedWithCustomError(
        market,
        'NotOwner',
      );
    });

    it('TC-013 makeOffer amount=0 → InvalidOfferAmount', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      await expect(
        market.connect(bob)['makeOffer(uint256,uint256)'](1, 0, { value: 0 }),
      ).to.be.revertedWithCustomError(market, 'InvalidOfferAmount');
    });

    it('TC-014 makeOffer payment != amount → OfferPaymentMismatch', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      await expect(
        market.connect(bob)['makeOffer(uint256,uint256)'](1, OFFER_AMOUNT, {
          value: ethers.parseEther('0.4'),
        }),
      ).to.be.revertedWithCustomError(market, 'OfferPaymentMismatch');
    });

    it('TC-015 makeOffer deadline 過去 → InvalidDeadline', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      const past = (await time.latest()) - 10;
      await expect(
        market
          .connect(bob)
          ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, past, { value: OFFER_AMOUNT }),
      ).to.be.revertedWithCustomError(market, 'InvalidDeadline');
    });
  });

  describe('観点 3: 境界値', () => {
    it('TC-016 buy で payment == price ちょうど → refund なしで成功', async () => {
      const { market, alice, bob } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      const tx = await market.connect(bob).buy(1, { value: PRICE });
      await expect(tx).to.emit(market, 'Bought').withArgs(1, bob.address, PRICE);
    });

    it('TC-017 buy で payment > price → 差額 refund', async () => {
      const { market, alice, bob } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      const bobBefore = await ethers.provider.getBalance(bob.address);
      const tx = await market.connect(bob).buy(1, { value: ethers.parseEther('1.5') });
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const bobAfter = await ethers.provider.getBalance(bob.address);
      // bob の支払い実額は PRICE (1 ether) + gas のはず
      expect(bobBefore - bobAfter - gasCost).to.equal(PRICE);
    });

    it('TC-018 makeOffer (uint256,uint256) overload (deadline=type(uint256).max 相当)', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      await expect(
        market.connect(bob)['makeOffer(uint256,uint256)'](1, OFFER_AMOUNT, {
          value: OFFER_AMOUNT,
        }),
      ).to.emit(market, 'OfferMade');
    });
  });

  describe('観点 4: 状態遷移', () => {
    it('TC-019 buy 後 listings は delete (再 buy で NotActive)', async () => {
      const { market, alice, bob, carol } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      await market.connect(bob).buy(1, { value: PRICE });
      await expect(
        market.connect(carol).buy(1, { value: PRICE }),
      ).to.be.revertedWithCustomError(market, 'NotActive');
    });

    it('TC-020 buy 後 同 tokenId の既存 offer は invalidate + buyer に返金', async () => {
      const { market, alice, bob, carol } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(carol)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      const carolBefore = await ethers.provider.getBalance(carol.address);
      await market.connect(bob).buy(1, { value: PRICE });
      // carol への返金が市場 buy 経由で行われる
      expect((await ethers.provider.getBalance(carol.address)) - carolBefore).to.equal(
        OFFER_AMOUNT,
      );
      const offer = await market.offers(1);
      expect(offer.active).to.equal(false);
    });

    it('TC-021 cancelOffer で offer delete + buyer に返金', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      const bobBefore = await ethers.provider.getBalance(bob.address);
      const tx = await market.connect(bob).cancelOffer(1);
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const bobAfter = await ethers.provider.getBalance(bob.address);
      // bob に OFFER_AMOUNT 返金 (gas 控除)
      expect(bobAfter - bobBefore + gasCost).to.equal(OFFER_AMOUNT);
      await expect(tx).to.emit(market, 'OfferCancelled').withArgs(1);
    });
  });

  describe('観点 5: 権限', () => {
    it('TC-022 別 user が cancelOffer → NotOwner', async () => {
      const { market, bob, carol } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      await expect(market.connect(carol).cancelOffer(1)).to.be.revertedWithCustomError(
        market,
        'NotOwner',
      );
    });

    it('TC-023 非 nft owner が acceptOffer → NotOwner', async () => {
      const { market, bob, carol } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      await expect(market.connect(carol).acceptOffer(1)).to.be.revertedWithCustomError(
        market,
        'NotOwner',
      );
    });

    it('TC-024 approve 無しで acceptOffer → NotApproved', async () => {
      const { nft, market, alice, bob } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      await nft.connect(alice).approve(alice.address, 1); // 承認解除相当
      await expect(market.connect(alice).acceptOffer(1)).to.be.revertedWithCustomError(
        market,
        'NotApproved',
      );
    });
  });

  describe('観点 10: セキュリティ', () => {
    it('TC-025 [CRITICAL] cancelOffer で既に delete された offer → OfferNotActive', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      await market.connect(bob).cancelOffer(1);
      await expect(market.connect(bob).cancelOffer(1)).to.be.revertedWithCustomError(
        market,
        'OfferNotActive',
      );
    });

    it('TC-026 [CRITICAL] acceptOffer で deadline 経過した offer → OfferExpired', async () => {
      const { market, bob, alice } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 100;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      await time.increase(200);
      await expect(market.connect(alice).acceptOffer(1)).to.be.revertedWithCustomError(
        market,
        'OfferExpired',
      );
    });

    it('TC-027 [MAJOR] isOfferActive で deadline 内 active offer は true', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 3600;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      expect(await market.isOfferActive(1)).to.equal(true);
    });

    it('TC-028 [MAJOR] isOfferActive で deadline 過ぎは false', async () => {
      const { market, bob } = await loadFixture(deployFixture);
      const deadline = (await time.latest()) + 100;
      await market
        .connect(bob)
        ['makeOffer(uint256,uint256,uint256)'](1, OFFER_AMOUNT, deadline, { value: OFFER_AMOUNT });
      await time.increase(200);
      expect(await market.isOfferActive(1)).to.equal(false);
    });

    it('TC-029 [MAJOR] buyNft alias で buy と同等挙動', async () => {
      const { nft, market, alice, bob } = await loadFixture(deployFixture);
      await market.connect(alice).list(1, PRICE);
      await market.connect(bob).buyNft(1, { value: PRICE });
      expect(await nft.ownerOf(1)).to.equal(bob.address);
    });

    it('TC-030 [MINOR] nft immutable address が constructor で固定', async () => {
      const { nft, market } = await loadFixture(deployFixture);
      expect(await market.nft()).to.equal(await nft.getAddress());
    });
  });
});
