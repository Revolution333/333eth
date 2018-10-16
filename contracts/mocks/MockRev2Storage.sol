pragma solidity ^0.4.23;

import "../InvestorsStorage.sol";
import "../PrivateEntrance.sol";


contract MockRev2Storage is Rev2Storage {
  mapping(address => InvestorsStorage.Investor) public investors;
  
  function investorInfo(address addr) public view returns(uint investment, uint paymentTime) {
    investment = investors[addr].investment;
    paymentTime = investors[addr].paymentTime;
  }

  function setInvestor(address addr, uint investment, uint paymentTime ) public {
    investors[addr] = InvestorsStorage.Investor(investment, paymentTime);
  }
}

