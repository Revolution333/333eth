pragma solidity ^0.4.23;

import "../Zero.sol";


contract TestZero {
  using Zero for *;
  
  function requireNotZeroUint(uint a) public pure {
    a.requireNotZero();
  }

  function requireNotZeroAddr(address addr) public pure {
    addr.requireNotZero();
  }

  function notZero(address addr) public pure returns(bool) {
    return addr.notZero();
  }

  function isZero(address addr) public pure returns(bool) {
    return addr.isZero();
  }
}