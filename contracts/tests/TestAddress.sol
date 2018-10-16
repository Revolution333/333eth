pragma solidity ^0.4.23;

import "../Address.sol";


contract TestAddress {
  using Address for *;

  function bytesToAddr(bytes source) public pure returns(address addr) {
    return source.toAddress();
  }

  function isNotContract(address addr) public view returns(bool) {
    return addr.isNotContract();
  }
}