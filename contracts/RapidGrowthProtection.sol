pragma solidity ^0.4.23;

// solium-disable security/no-block-members
// solium-disable camelcase

import "./Accessibility.sol";




library RapidGrowthProtection {
  using RapidGrowthProtection for rapidGrowthProtection;
  
  struct rapidGrowthProtection {
    uint startTimestamp;
    uint maxDailyTotalInvestment;
    uint8 activityDays;
    mapping(uint8 => uint) dailyTotalInvestment;
  }

  function maxInvestmentAtNow(rapidGrowthProtection storage rgp) internal view returns(uint) {
    uint day = rgp.currDay();
    if (day == 0 || day > rgp.activityDays) {
      return 0;
    }
    if (rgp.dailyTotalInvestment[uint8(day)] >= rgp.maxDailyTotalInvestment) {
      return 0;
    }
    return rgp.maxDailyTotalInvestment - rgp.dailyTotalInvestment[uint8(day)];
  }

  function isActive(rapidGrowthProtection storage rgp) internal view returns(bool) {
    uint day = rgp.currDay();
    return day != 0 && day <= rgp.activityDays;
  }

  function saveInvestment(rapidGrowthProtection storage rgp, uint investment) internal returns(bool) {
    uint day = rgp.currDay();
    if (day == 0 || day > rgp.activityDays) {
      return false;
    }
    if (rgp.dailyTotalInvestment[uint8(day)] + investment > rgp.maxDailyTotalInvestment) {
      return false;
    }
    rgp.dailyTotalInvestment[uint8(day)] += investment;
    return true;
  }

  function startAt(rapidGrowthProtection storage rgp, uint timestamp) internal { 
    rgp.startTimestamp = timestamp;

    // restart
    for (uint8 i = 1; i <= rgp.activityDays; i++) {
      if (rgp.dailyTotalInvestment[i] != 0) {
        delete rgp.dailyTotalInvestment[i];
      }
    }
  }

  function currDay(rapidGrowthProtection storage rgp) internal view returns(uint day) {
    if (rgp.startTimestamp > now) {
      return 0;
    }
    day = (now - rgp.startTimestamp) / 24 hours + 1; // +1 for skip zero day
  }
}