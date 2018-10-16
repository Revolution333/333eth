pragma solidity ^0.4.23;

import "../Revolution2.sol";


contract TestRevolution2 is Revolution2 {
  function receiveEther() public payable {}

  function testGetMemInvestor(address investorAddr) public view returns(uint, uint) {
    InvestorsStorage.Investor memory inv = getMemInvestor(investorAddr);
    return (inv.investment, inv.paymentTime);
  }
}