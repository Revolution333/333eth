pragma solidity ^0.4.23;

import "../PrivateEntrance.sol";


contract MockRev1Storage is Rev1Storage {
  struct Investor {
    uint value;
    uint refBonus;
  }
  mapping(address => Investor) public investors;

  function investorShortInfo(address addr) public view returns(uint value, uint refBonus) {
    value = investors[addr].value;
    refBonus = investors[addr].refBonus;
  }

  function setInvestor(address addr, uint value, uint refBonus ) public {
    investors[addr] = Investor(value, refBonus);
  }
}

