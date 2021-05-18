const {accounts, contract} = require('@openzeppelin/test-environment');
const {BN, constants, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {ZERO_ADDRESS} = constants;
const web3 = require('web3');

const {expect} = require('chai');

const ERC20Factory = contract.fromArtifact('ERC20Factory');

describe('ERC20Factory', function () {
    const [deployer, minter, pauser, blacklister, new_root, new_miner, new_pauser, new_blacklister, other] = accounts;

    const name = 'ERC20PegToken';
    const symbol = 'EPT';

    const decimals = 18;

    const DEFAULT_ADMIN_ROLE = '0x00';
    const MINTER_ROLE = web3.utils.soliditySha3('MINTER_ROLE');
    const PAUSER_ROLE = web3.utils.soliditySha3('PAUSER_ROLE');
    const BLACKLISTER_ROLE = web3.utils.soliditySha3('BLACKLISTER_ROLE');

    before(async function () {
        this.factory = await ERC20Factory.new({from: deployer});
    });

    describe('factory', function () {

        it('create token', async function () {
            const receipt = await this.factory.createToken(name, symbol, decimals, minter, pauser, blacklister, {from: deployer});

            expectEvent(receipt, "ERC20PegTokenCreated", {symbol: symbol});

            this.tokenAddress = receipt.logs[0].args.token_address;
            this.tokenID = receipt.logs[0].args.id;

            this.token = contract.fromArtifact('ERC20PegToken', this.tokenAddress);
        });

        it('tokens length', async function () {
            expect(await this.factory.tokensLength()).to.be.bignumber.equal(this.tokenID);
        });

        it('check token admin role', async function () {
            expect(await this.token.getRoleMemberCount(DEFAULT_ADMIN_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(DEFAULT_ADMIN_ROLE, 0)).to.equal(this.factory.address);
        });

        it('check token minter role', async function () {
            expect(await this.token.getRoleMemberCount(MINTER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(MINTER_ROLE, 0)).to.equal(minter);
        });

        it('check token pauser role', async function () {
            expect(await this.token.getRoleMemberCount(PAUSER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(PAUSER_ROLE, 0)).to.equal(pauser);
        });

        it('check token blacklister role', async function () {
            expect(await this.token.getRoleMemberCount(BLACKLISTER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(BLACKLISTER_ROLE, 0)).to.equal(blacklister);
        });

        it('other can not change token user', async function () {
            await expectRevert(
                this.factory.changeTokenRole(this.tokenAddress, new_miner, new_pauser, new_blacklister, {from: other}),
                'ERC20Factory: only root is allowed',
            );
        });

        it('deployer can change token user', async function () {
            const receipt = await this.factory.changeTokenRole(this.tokenAddress, new_miner, new_pauser, new_blacklister, {from: deployer});

            expectEvent(receipt, 'ERC20PegTokenRoleChanged', {
                token_address: this.tokenAddress,
                new_minter: new_miner,
                new_pauser: new_pauser,
                new_blacklister: new_blacklister
            });
        });

        it('check new token minter role', async function () {
            expect(await this.token.getRoleMemberCount(MINTER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(MINTER_ROLE, 0)).to.equal(new_miner);
        });

        it('check new token pauser role', async function () {
            expect(await this.token.getRoleMemberCount(PAUSER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(PAUSER_ROLE, 0)).to.equal(new_pauser);
        });

        it('check new token blacklister role', async function () {
            expect(await this.token.getRoleMemberCount(BLACKLISTER_ROLE)).to.be.bignumber.equal('1');
            expect(await this.token.getRoleMember(BLACKLISTER_ROLE, 0)).to.equal(new_blacklister);
        });

        it('other can not change factory root', async function () {
            await expectRevert(
                this.factory.changeRoot(new_root, {from: other}),
                'ERC20Factory: only root is allowed',
            );
        });

        it('deployer can change factory root', async function () {
            const receipt = await this.factory.changeRoot(new_root, {from: deployer});

            expectEvent(receipt, 'ERC20FactoryRootChanged', {new_root: new_root});
        });

        it('check factory root', async function () {
            expect(await this.factory.root()).to.equal(new_root);
        });
    });
});