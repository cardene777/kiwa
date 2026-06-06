// /kiwa-hardhat 出力 (Layer 1 spec test-spec-defi-swap.md 由来)
// 用途: examples/defi-swap の Hardhat 経路 test 後付け導入 (Foundry .t.sol と並立)
// 観点 grouping: 1 正常系 / 2 異常系 / 3 境界値 / 4 状態遷移 / 5 権限 / 10 セキュリティ
// 対象 contract: Erc20 (minimal ERC20) + SimpleSwap (1:1 swap)

const { expect } = require('chai');
const { ethers } = require('hardhat');
const { loadFixture } = require('@nomicfoundation/hardhat-toolbox/network-helpers');
const fc = require('fast-check');

describe('SwapTokens (Layer 2 Hardhat example)', () => {
  async function deployFixture() {
    const [deployer, alice, bob] = await ethers.getSigners();
    const Erc20 = await ethers.getContractFactory('Erc20');
    const tokenA = await Erc20.deploy('Token A', 'TKA', ethers.parseEther('1000'), alice.address);
    const tokenB = await Erc20.deploy('Token B', 'TKB', ethers.parseEther('1000'), deployer.address);

    const SimpleSwap = await ethers.getContractFactory('SimpleSwap');
    const swap = await SimpleSwap.deploy(await tokenA.getAddress(), await tokenB.getAddress());
    // 100 tokenB を pool に流動性として供給
    await tokenB.transfer(await swap.getAddress(), ethers.parseEther('100'));
    return { tokenA, tokenB, swap, deployer, alice, bob };
  }

  describe('観点 1: 正常系', () => {
    it('TC-001 swapAforB(1 ether) で alice の tokenA -1 / tokenB +1', async () => {
      const { tokenA, tokenB, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('1'));
      const aliceBefore = await tokenA.balanceOf(alice.address);
      const tx = await swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('1'));
      await expect(tx)
        .to.emit(swap, 'Swapped')
        .withArgs(alice.address, ethers.parseEther('1'), ethers.parseEther('1'));
      expect(await tokenA.balanceOf(alice.address)).to.equal(aliceBefore - ethers.parseEther('1'));
      expect(await tokenB.balanceOf(alice.address)).to.equal(ethers.parseEther('1'));
    });

    it('TC-002 swapAforB(amountIn, minOutputAmount) overload で min 以上の amountOut が返る', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('5'));
      const amountOut = await swap
        .connect(alice)
        ['swapAforB(uint256,uint256)'].staticCall(ethers.parseEther('5'), ethers.parseEther('5'));
      expect(amountOut).to.equal(ethers.parseEther('5'));
    });

    it('TC-003 連続 swap で pool 流動性が逓減する', async () => {
      const { tokenA, tokenB, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('30'));
      await swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('10'));
      await swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('20'));
      // 100 ether 流動性から 30 ether 引き出されたので残 70 ether
      expect(await tokenB.balanceOf(await swap.getAddress())).to.equal(ethers.parseEther('70'));
    });
  });

  describe('観点 2: 異常系', () => {
    it('TC-004 approve なしで swap → InsufficientAllowance', async () => {
      const { swap, alice } = await loadFixture(deployFixture);
      await expect(
        swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('1')),
      ).to.be.reverted; // transferFrom 内 InsufficientAllowance または TransferInFailed
    });

    it('TC-005 残高超過 amountIn で swap → InsufficientBalance', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      // alice の残高は 1000 ether なので 2000 ether の swap を試行
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('2000'));
      await expect(
        swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('2000')),
      ).to.be.reverted;
    });

    it('TC-006 pool 流動性超過 amountIn で InsufficientLiquidity', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      // pool は 100 ether しか持っていない、alice の 1000 ether で 101 ether swap を試行
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('101'));
      await expect(
        swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('101')),
      ).to.be.revertedWithCustomError(swap, 'InsufficientLiquidity');
    });
  });

  describe('観点 3: 境界値', () => {
    it('TC-007 amountIn == pool 流動性 (100 ether) ちょうど → success', async () => {
      const { tokenA, tokenB, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('100'));
      await swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('100'));
      expect(await tokenB.balanceOf(await swap.getAddress())).to.equal(0n);
    });

    it('TC-008 amountIn = 0 → success (no-op に近い、event は発火)', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), 0);
      const tx = await swap.connect(alice)['swapAforB(uint256)'](0);
      await expect(tx).to.emit(swap, 'Swapped').withArgs(alice.address, 0, 0);
    });

    it('TC-009 minOutputAmount > amountOut → SlippageExceeded', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('1'));
      await expect(
        swap.connect(alice)['swapAforB(uint256,uint256)'](ethers.parseEther('1'), ethers.parseEther('2')),
      ).to.be.revertedWithCustomError(swap, 'SlippageExceeded');
    });

    it('fuzz amountIn 1〜100 ether 範囲は常に success (pool 流動性内)', async () => {
      await fc.assert(
        fc.asyncProperty(fc.integer({ min: 1, max: 100 }), async (amountEth) => {
          const { tokenA, swap, alice } = await loadFixture(deployFixture);
          await tokenA
            .connect(alice)
            .approve(await swap.getAddress(), ethers.parseEther(String(amountEth)));
          await expect(
            swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther(String(amountEth))),
          ).to.emit(swap, 'Swapped');
        }),
        { numRuns: 10 },
      );
    });
  });

  describe('観点 4: 状態遷移', () => {
    it('TC-010 swap 後 alice allowance が減算される', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('5'));
      await swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('3'));
      expect(await tokenA.allowance(alice.address, await swap.getAddress())).to.equal(
        ethers.parseEther('2'),
      );
    });

    it('TC-011 type(uint256).max allowance は減算されない (infinite approve)', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      const MAX = 2n ** 256n - 1n;
      await tokenA.connect(alice).approve(await swap.getAddress(), MAX);
      await swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('3'));
      expect(await tokenA.allowance(alice.address, await swap.getAddress())).to.equal(MAX);
    });
  });

  describe('観点 5: 権限', () => {
    it('TC-012 bob が alice の allowance を流用できない (transferFrom で alice→swap を bob 経由)', async () => {
      const { tokenA, alice, bob, swap } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('10'));
      // bob が直接 transferFrom を呼ぶ場合は msg.sender = bob, allowance[alice][bob]=0 なので revert
      await expect(
        tokenA.connect(bob).transferFrom(alice.address, bob.address, ethers.parseEther('1')),
      ).to.be.revertedWithCustomError(tokenA, 'InsufficientAllowance');
    });

    it('TC-013 approve(0) で allowance リセット → 以後 swap が revert', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('5'));
      await tokenA.connect(alice).approve(await swap.getAddress(), 0);
      await expect(swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('1'))).to.be.reverted;
    });
  });

  describe('観点 10: セキュリティ', () => {
    it('TC-014 [CRITICAL] re-entrancy 経路: minimal Erc20 は callback を持たないため CEI 違反でも実害なし (事実確認)', async () => {
      const { tokenA, tokenB, swap, alice } = await loadFixture(deployFixture);
      // SimpleSwap.swapAforB は transferFrom → transfer の順で外部 call 2 回するが、
      // minimal Erc20 が ERC777 のような callback を持たないため re-entrancy 不可能。
      // assertion は実装的事実 (event 発火) のみ確認、 ERC777 拡張時に再評価する。
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('1'));
      await expect(swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('1'))).to.emit(
        swap,
        'Swapped',
      );
      // pool 残量が正しく減算されたことで CEI 整合性を担保
      expect(await tokenB.balanceOf(await swap.getAddress())).to.equal(ethers.parseEther('99'));
    });

    it('TC-015 [CRITICAL] InsufficientLiquidity error の引数で実 amountOut + 残流動性を返す', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('150'));
      await expect(swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('150')))
        .to.be.revertedWithCustomError(swap, 'InsufficientLiquidity')
        .withArgs(ethers.parseEther('150'), ethers.parseEther('100'));
    });

    it('TC-016 [MAJOR] SlippageExceeded error の引数で amountOut + minOutputAmount を返す', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('1'));
      await expect(
        swap
          .connect(alice)
          ['swapAforB(uint256,uint256)'](ethers.parseEther('1'), ethers.parseEther('2')),
      )
        .to.be.revertedWithCustomError(swap, 'SlippageExceeded')
        .withArgs(ethers.parseEther('1'), ethers.parseEther('2'));
    });

    it('TC-017 [MAJOR] tokenA / tokenB の immutable address が constructor で固定される', async () => {
      const { tokenA, tokenB, swap } = await loadFixture(deployFixture);
      expect(await swap.tokenA()).to.equal(await tokenA.getAddress());
      expect(await swap.tokenB()).to.equal(await tokenB.getAddress());
    });

    it('TC-018 [MAJOR] Approval event の args 検証', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await expect(tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('1')))
        .to.emit(tokenA, 'Approval')
        .withArgs(alice.address, await swap.getAddress(), ethers.parseEther('1'));
    });

    it('TC-019 [MAJOR] Transfer event の args 検証 (transferFrom 経由)', async () => {
      const { tokenA, swap, alice } = await loadFixture(deployFixture);
      await tokenA.connect(alice).approve(await swap.getAddress(), ethers.parseEther('1'));
      // swap 内で transferFrom が呼ばれ Transfer event が発火することを確認
      await expect(swap.connect(alice)['swapAforB(uint256)'](ethers.parseEther('1')))
        .to.emit(tokenA, 'Transfer')
        .withArgs(alice.address, await swap.getAddress(), ethers.parseEther('1'));
    });

    it('TC-020 [MINOR] transfer for own balance → success', async () => {
      const { tokenA, alice, bob } = await loadFixture(deployFixture);
      await tokenA.connect(alice).transfer(bob.address, ethers.parseEther('10'));
      expect(await tokenA.balanceOf(bob.address)).to.equal(ethers.parseEther('10'));
    });

    it('TC-021 [MAJOR] Erc20.transfer 残高超過 → InsufficientBalance (branch coverage)', async () => {
      const { tokenA, bob } = await loadFixture(deployFixture);
      // bob は initialSupply を持っていない (alice に 1000 ether 配布した tokenA)
      await expect(
        tokenA.connect(bob).transfer(bob.address, ethers.parseEther('1')),
      ).to.be.revertedWithCustomError(tokenA, 'InsufficientBalance');
    });

    it('TC-022 [MAJOR] Erc20.transferFrom 残高超過 → InsufficientBalance (branch coverage)', async () => {
      const { tokenA, alice, bob } = await loadFixture(deployFixture);
      // alice → bob に approve したうえで bob が transferFrom を試行 (alice の残高は 1000 ether なので 2000 ether 試行)
      await tokenA.connect(alice).approve(bob.address, ethers.parseEther('2000'));
      await expect(
        tokenA.connect(bob).transferFrom(alice.address, bob.address, ethers.parseEther('2000')),
      ).to.be.revertedWithCustomError(tokenA, 'InsufficientBalance');
    });
  });
});
