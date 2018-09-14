pragma solidity ^0.4.23;

import "../ToAddress.sol";


contract TestToAddress {
  using ToAddress for *;
  
  function toAddr(uint source) public pure returns(address) {
    return source.toAddr();
  }

  function bytesToAddr(bytes source) public pure returns(address addr) {
    return source.toAddr();
  }
}