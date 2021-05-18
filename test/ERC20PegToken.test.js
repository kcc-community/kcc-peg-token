const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, constants, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {ZERO_ADDRESS} = constants;
const web3 = require('web3');

const {expect} = require('chai');

const ERC20PegToken = contract.fromArtifact('ERC20PegToken');

describe('ERC20PegToken', function () {
    const [deployer, minter, pauser, blacklister, other] = accounts;

    const name = 'ERC20PegToken';
    const symbol = 'EPT';

    const amount = new BN('5000');
    const decimals = 18;

    const DEFAULT_ADMIN_ROLE = '0x00';
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
    const PAUSER_ROLE = web3.utils.soliditySha3('PAUSER_ROLE');
    const BLACKLISTER_ROLE = web3.utils.soliditySha3('BLACKLISTER_ROLE');

    beforeEach(async function () {
        this.token = await ERC20PegToken.new(name, symbol, decimals, minter, pauser, blacklister, {from: deployer});
    });

    it('has 18 decimals', async function () {
        expect(await this.token.decimals()).to.be.bignumber.equal('18');
    });

    it('deployer has the default admin role', async function () {
        expect(await this.token.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.be.bignumber.equal('1');
        expect(await this.token.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(deployer);
    });

    it('minter has the minter role', async function () {
        expect(await this.token.getRoleMemberCount(MINTER_ROLE)).to.be.bignumber.equal('1');
        expect(await this.token.getRoleMember(MINTER_ROLE, 0)).to.equal(minter);
    });

    it('pauser has the pauser role', async function () {
        expect(await this.token.getRoleMemberCount(PAUSER_ROLE)).to.be.bignumber.equal('1');
        expect(await this.token.getRoleMember(PAUSER_ROLE, 0)).to.equal(pauser);
    });

    it('blacklister has the blacklister role', async function () {
        expect(await this.token.getRoleMemberCount(BLACKLISTER_ROLE)).to.be.bignumber.equal('1');
        expect(await this.token.getRoleMember(BLACKLISTER_ROLE, 0)).to.equal(blacklister);
    });

    describe('minting', function () {
        it('minter can mint tokens', async function () {
            const receipt = await this.token.mint(other, amount, {from: minter});
            expectEvent(receipt, 'Transfer', {from: ZERO_ADDRESS, to: other, value: amount});

            expect(await this.token.balanceOf(other)).to.be.bignumber.equal(amount);
        });

        it('other accounts cannot mint tokens', async function () {
            await expectRevert(
                this.token.mint(other, amount, {from: other}),
                'ERC20PegToken: must have minter role to mint',
            );
        });
    });

    describe('pausing', function () {
        it('pauser can pause', async function () {
            const receipt = await this.token.pause({from: pauser});
            expectEvent(receipt, 'Paused', {account: pauser});

            expect(await this.token.paused()).to.equal(true);
        });

        it('pauser can unpause', async function () {
            await this.token.pause({from: pauser});

            const receipt = await this.token.unpause({from: pauser});
            expectEvent(receipt, 'Unpaused', {account: pauser});

            expect(await this.token.paused()).to.equal(false);
        });

        it('cannot mint while paused', async function () {
            await this.token.pause({from: pauser});

            await expectRevert(
                this.token.mint(other, amount, {from: minter}),
                'ERC20Pausable: token transfer while paused',
            );
        });

        it('other accounts cannot pause', async function () {
            await expectRevert(
                this.token.pause({from: other}),
                'ERC20PegToken: must have pauser role to pause',
            );
        });

        it('other accounts cannot unpause', async function () {
            await this.token.pause({from: pauser});

            await expectRevert(
                this.token.unpause({from: other}),
                'ERC20PegToken: must have pauser role to unpause',
            );
        });
    });

    describe('burning', function () {
        it('holders can burn their tokens', async function () {
            await this.token.mint(other, amount, {from: minter});

            const receipt = await this.token.burn(amount.subn(1), {from: other});
            expectEvent(receipt, 'Transfer', {from: other, to: ZERO_ADDRESS, value: amount.subn(1)});

            expect(await this.token.balanceOf(other)).to.be.bignumber.equal('1');
        });
    });

    describe('blacklisting', function () {
        it('blacklister can set the blacklist', async function () {
            const receipt = await this.token.setBlackList(other, {from: blacklister});
            expectEvent(receipt, 'BlackListed', {_account: other});

            expect(await this.token.isBlackListed(other)).to.equal(true);
        });

        it('blacklister can unset the blacklist', async function () {
            await this.token.setBlackList(other, {from: blacklister});

            const receipt = await this.token.unsetBlackList(other, {from: blacklister});
            expectEvent(receipt, 'unBlackListed', {_account: other});

            expect(await this.token.isBlackListed(other)).to.equal(false);
        });

        it('cannot send while be in blacklist', async function () {
            await this.token.setBlackList(other, {from: blacklister});

            await expectRevert(
                this.token.transfer(pauser, amount, {from: other}),
                'ERC20PegToken: invalid sender',
            );
        });

        it('cannot receive while be in blacklist', async function () {
            await this.token.setBlackList(other, {from: blacklister});

            await expectRevert(
                this.token.transfer(other, amount, {from: pauser}),
                'ERC20PegToken: invalid recipient',
            );
        });

        it('other accounts cannot set the blacklist', async function () {
            await expectRevert(
                this.token.setBlackList(other, {from: other}),
                'ERC20PegToken: must have blacklister role to set the blacklist',
            );
        });

        it('other accounts cannot unset the blacklist', async function () {
            await this.token.setBlackList(other, {from: blacklister});

            await expectRevert(
                this.token.unsetBlackList(other, {from: other}),
                'ERC20PegToken: must have blacklister role to unset the blacklist',
            );
        });
    });
});