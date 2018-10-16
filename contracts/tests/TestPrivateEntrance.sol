pragma solidity ^0.4.23;

import "../PrivateEntrance.sol";


contract TestPrivateEntrance {
  using PrivateEntrance for PrivateEntrance.privateEntrance;
  PrivateEntrance.privateEntrance public pe;

  function setRev1Storage(address rev1StorageAddr) public {
    pe.rev1Storage = Rev1Storage(rev1StorageAddr);
  }

  function setRev2Storage(address rev2StorageAddr) public {
    pe.rev2Storage = Rev2Storage(rev2StorageAddr);
  }

  function setInvestorMaxInvestment(uint investorMaxInvestment) public {
    pe.investorMaxInvestment = investorMaxInvestment;
  }

  function setEndTimestamp(uint endTimestamp) public {
    pe.endTimestamp = endTimestamp;
  }

  function setHasAccess(address addr, bool access) public {
    pe.hasAccess[addr] = access;
  }

  function hasAccess(address addr) public view returns(bool access) {
    access = pe.hasAccess[addr];
  }

  function testIsActive() public view returns(bool) {
    return pe.isActive();
  }

  function testMaxInvestmentFor(address addr) public view returns(uint) {
    return pe.maxInvestmentFor(addr);
  }
  
  function testProvideAccessFor(address[] addrs) public {
    return pe.provideAccessFor(addrs);
  }
}
