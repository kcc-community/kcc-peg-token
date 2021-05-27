const {table}       = require("table");
const ERC20Factory  = artifacts.require("ERC20Factory");
const ERC20PegToken = artifacts.require("ERC20PegToken");
const tokens        = require("../config/testnet.json");
const prefix        = "KCC-Peg ";
const faucet        = "0xdee135b633d4cc342b2d59584e25fa8c4c88bcdc";
const result        = [["name", "symbol", "decimals", "address"]];

module.exports = async function (deployer, network, accounts) {
    const [root, minter, pauser, blacklister] = accounts;

    console.log(`Step1 depoying factory module`);
    await deployer.deploy(ERC20Factory, {from: root});
    const factory = await ERC20Factory.deployed();

    console.log(`Step2 depoying erc20 module`);
    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index];
        console.log(`Step2.${index + 1} depoying ${token.symbol} module`);
        const params = [prefix + token.name, token.symbol, 18];

        await factory.createToken(...params, minter, pauser, blacklister);

        const address = await factory.tokens(index);
        const erc20   = await ERC20PegToken.at(address);
        await erc20.mint(faucet, "1000000000000000000000000", {from: minter});

        params.push(address);
        result.push(params);
    }

    console.log(factory.address);
    console.log(table(result));
};
