pragma solidity ^0.4.23;

import "../Zero.sol";


contract TestZero {
  using Zero for *;
  
  function requireNotZeroAddr(address addr) public pure {
    addr.requireNotZero();
  }

  function requireNotZeroUint(uint val) public pure {
    val.requireNotZero();
  }

  function addrNotZero(address addr) public pure returns(bool) {
    return addr.notZero();
  }

  function addrIsZero(address addr) public pure returns(bool) {
    return addr.isZero();
  }

  function uintIsZero(uint a) public pure returns(bool) {
    return a.isZero();
  }

  function uintNotZero(uint a) public pure returns(bool) {
    return a.notZero();
  }
}