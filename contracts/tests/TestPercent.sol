pragma solidity ^0.4.23;

import "../Percent.sol";


contract TestPercent {
  using Percent for Percent.percent;
  Percent.percent p;
  uint public res;

  function mul(uint num, uint den, uint a) public {
    setPercent(num, den);
    res = p.mul(a);
  }

  function div(uint num, uint den, uint a) public {
    setPercent(num, den);
    res = p.div(a);
  }

  function sub(uint num, uint den, uint a) public {
    setPercent(num, den);
    res = p.sub(a);
  }

  function add(uint num, uint den, uint a) public {
    setPercent(num, den);
    res = p.add(a);
  }

  function setPercent(uint num, uint den) internal {
    p = Percent.percent(num,den);
  }
}