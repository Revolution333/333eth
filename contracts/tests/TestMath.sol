pragma solidity ^0.4.23;

import "../Math.sol";


contract TestMath {
  function testMin(uint a, uint b) public pure returns(uint) {
    return Math.min(a, b);
  }
}