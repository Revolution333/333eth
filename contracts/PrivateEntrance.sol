pragma solidity ^0.4.23;

// solium-disable security/no-block-members
// solium-disable camelcase

import "./Math.sol";


contract Rev1Storage {
  function investorShortInfo(address addr) public view returns(uint value, uint refBonus); 
}


contract Rev2Storage {
  function investorInfo(address addr) public view returns(uint investment, uint paymentTime); 
}




library PrivateEntrance {
  using PrivateEntrance for privateEntrance;
  using Math for uint;
  struct privateEntrance {
    Rev1Storage rev1Storage;
    Rev2Storage rev2Storage;
    uint investorMaxInvestment;
    uint endTimestamp;
    mapping(address=>bool) hasAccess;
  }

  function isActive(privateEntrance storage pe) internal view returns(bool) {
    return pe.endTimestamp > now;
  }

  function maxInvestmentFor(privateEntrance storage pe, address investorAddr) internal view returns(uint) {
    // check if investorAddr has access
    if (!pe.hasAccess[investorAddr]) {
      return 0;
    }

    // get investor max investment = investment from revolution 1
    (uint maxInvestment, ) = pe.rev1Storage.investorShortInfo(investorAddr);
    if (maxInvestment == 0) {
      return 0;
    }
    maxInvestment = Math.min(maxInvestment, pe.investorMaxInvestment);

    // get current investment from revolution 2
    (uint currInvestment, ) = pe.rev2Storage.investorInfo(investorAddr);
    
    if (currInvestment >= maxInvestment) {
      return 0;
    }

    return maxInvestment-currInvestment;
  }

  function provideAccessFor(privateEntrance storage pe, address[] addrs) internal {
    for (uint16 i; i < addrs.length; i++) {
      pe.hasAccess[addrs[i]] = true;
    }
  }
}