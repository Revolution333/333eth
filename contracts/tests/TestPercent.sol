pragma solidity ^0.4.23;

import "../Percent.sol";


contract TestPercent {
  using Percent for Percent.percent;
  Percent.percent p;
  uint public res;
  uint public snum;
  uint public sden;

  // storage
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

  // memory
  function mmul(uint num, uint den, uint a) public pure returns(uint) {
    Percent.percent memory mp = Percent.percent(num, den);
    return mp.mmul(a);
  }

  function mdiv(uint num, uint den, uint a) public pure returns(uint) {
    Percent.percent memory mp = Percent.percent(num, den);
    return mp.mdiv(a);
  }

  function msub(uint num, uint den, uint a) public pure returns(uint) {
    Percent.percent memory mp = Percent.percent(num, den);
    return mp.msub(a);
  }

  function madd(uint num, uint den, uint a) public  pure returns(uint) {
    Percent.percent memory mp = Percent.percent(num, den);
    return mp.madd(a);
  }

  function toMemory(uint num, uint den) public {
    setPercent(num, den);
    Percent.percent memory mp = p.toMemory();
    (snum, sden) = (mp.num, mp.den);
  }

  function setPercent(uint num, uint den) internal {
    p = Percent.percent(num,den);
  }
}