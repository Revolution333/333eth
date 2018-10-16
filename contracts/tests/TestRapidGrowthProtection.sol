pragma solidity ^0.4.23;

import "../RapidGrowthProtection.sol";


contract TestRapidGrowthProtection {
  using RapidGrowthProtection for RapidGrowthProtection.rapidGrowthProtection;
  RapidGrowthProtection.rapidGrowthProtection public rpg;
  bool public testSaveInvestmentRes;

  function setStartTimestamp(uint timestamp) public {
    rpg.startTimestamp = timestamp;
  }

  function setMaxDailyTotalInvestment(uint maxDailyTotalInvestment) public {
    rpg.maxDailyTotalInvestment = maxDailyTotalInvestment;
  }

  function setActivityDays(uint8 activityDays) public {
    rpg.activityDays = activityDays;
  }

  function setDailyTotalInvestment(uint8 day, uint investment) public {
    rpg.dailyTotalInvestment[day] = investment;
  }

  function dailyTotalInvestment(uint8 day) public view returns(uint investment) {
    investment = rpg.dailyTotalInvestment[day];
  }

  function testMaxInvestmentAtNow() public view returns(uint) {
    return rpg.maxInvestmentAtNow();
  }

  function testIsActive() public view returns(bool) {
    return rpg.isActive();
  }

  function testSaveInvestment(uint investment) public {
    testSaveInvestmentRes = rpg.saveInvestment(investment);
  }

  function setTestSaveInvestmentRes(bool val) public {
    testSaveInvestmentRes = val;
  }

  function testStartAt(uint timestamp) public {
    rpg.startAt(timestamp);
  }

  function testCurrDay() public view returns(uint) {
    return rpg.currDay();
  }
}
