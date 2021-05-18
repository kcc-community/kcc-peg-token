// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "./ERC20PegToken.sol";

contract ERC20Factory {
    event ERC20PegTokenCreated(address token_address, string symbol, uint id);
    event ERC20PegTokenRoleChanged(address token_address, address new_minter, address new_pauser, address new_blacklister);
    event ERC20FactoryRootChanged(address new_root);

    address[] public tokens;
    address public root;

    constructor() public {
        root = msg.sender;
    }

    modifier onlyRoot(){
        require(root == msg.sender, "ERC20Factory: only root is allowed");
        _;
    }

    function createToken(
        string memory name,
        string memory symbol,
        uint8 decimals,
        address minter,
        address pauser,
        address blacklister
    ) onlyRoot public returns (address token_address) {
        bytes32 salt = keccak256(abi.encodePacked(name, symbol, decimals));
        ERC20PegToken token = new ERC20PegToken{salt : salt}(name, symbol, decimals, minter, pauser, blacklister);
        token_address = address(token);
        tokens.push(token_address);
        emit ERC20PegTokenCreated(token_address, symbol, tokens.length);

        return token_address;
    }

    function tokensLength() external view returns (uint){
        return tokens.length;
    }

    function changeTokenRole(address token_address, address new_minter, address new_pauser, address new_blacklister) onlyRoot public {
        ERC20PegToken token = ERC20PegToken(token_address);

        token.revokeRole(token.MINTER_ROLE(), token.getRoleMember(token.MINTER_ROLE(), 0));
        token.revokeRole(token.PAUSER_ROLE(), token.getRoleMember(token.PAUSER_ROLE(), 0));
        token.revokeRole(token.BLACKLISTER_ROLE(), token.getRoleMember(token.BLACKLISTER_ROLE(), 0));

        token.grantRole(token.MINTER_ROLE(), new_minter);
        token.grantRole(token.PAUSER_ROLE(), new_pauser);
        token.grantRole(token.BLACKLISTER_ROLE(), new_blacklister);

        emit ERC20PegTokenRoleChanged(token_address, new_minter, new_pauser, new_blacklister);
    }

    function changeRoot(address new_root) onlyRoot public {
        root = new_root;

        emit ERC20FactoryRootChanged(new_root);
    }
}