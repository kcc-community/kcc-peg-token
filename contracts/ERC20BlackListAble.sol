// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Context.sol";

abstract contract ERC20BlackListAble is Context, AccessControl {

    bytes32 public constant BLACKLISTER_ROLE = keccak256("BLACKLISTER_ROLE");

    mapping(address => bool) internal BlackList;

    event BlackListed(address indexed _account);
    event unBlackListed(address indexed _account);

    function isBlackListed(address _account) public view returns (bool) {
        return BlackList[_account];
    }

    function setBlackList(address _account) public virtual {
        require(hasRole(BLACKLISTER_ROLE, _msgSender()), "ERC20PegToken: must have blacklister role to set the blacklist");

        BlackList[_account] = true;
        emit BlackListed(_account);
    }

    function unsetBlackList(address _account) public virtual {
        require(hasRole(BLACKLISTER_ROLE, _msgSender()), "ERC20PegToken: must have blacklister role to unset the blacklist");

        BlackList[_account] = false;
        emit unBlackListed(_account);
    }
}