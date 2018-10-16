pragma solidity ^0.4.23;

// solium-disable security/no-block-members


import "./Math.sol";
import "./Zero.sol";
import "./Percent.sol";
import "./Address.sol";
import "./SafeMath.sol";
import "./Accessibility.sol";
import "./PrivateEntrance.sol";
import "./InvestorsStorage.sol";
import "./RapidGrowthProtection.sol";


contract Revolution2 is Accessibility {
  using RapidGrowthProtection for RapidGrowthProtection.rapidGrowthProtection;
  using PrivateEntrance for PrivateEntrance.privateEntrance;
  using Percent for Percent.percent;
  using SafeMath for uint;
  using Math for uint;

  // easy read for investors
  using Address for *;
  using Zero for *; 
  
  RapidGrowthProtection.rapidGrowthProtection private m_rgp;
  PrivateEntrance.privateEntrance private m_privEnter;
  mapping(address => bool) private m_referrals;
  InvestorsStorage private m_investors;

  // automatically generates getters
  uint public constant minInvesment = 10 finney; //       0.01 eth
  uint public constant maxBalance = 333e5 ether; // 33 300 000 eth
  address public advertisingAddress;
  address public adminsAddress;
  uint public investmentsNumber;
  uint public waveStartup;

  // percents 
  Percent.percent private m_1_percent = Percent.percent(1, 100);           //   1/100  *100% = 1%
  Percent.percent private m_2_percent = Percent.percent(2, 100);           //   2/100  *100% = 2%
  Percent.percent private m_3_33_percent = Percent.percent(333, 10000);    // 333/10000*100% = 3.33%
  Percent.percent private m_adminsPercent = Percent.percent(5, 100);       //   5/100  *100% = 5%
  Percent.percent private m_advertisingPercent = Percent.percent(75, 1000);// 75/1000  *100% = 7.5%

  // more events for easy read from blockchain
  event LogPEInit(uint when, address rev1Storage, address rev2Storage, uint investorMaxInvestment, uint endTimestamp);
  event LogSendExcessOfEther(address indexed addr, uint when, uint value, uint investment, uint excess);
  event LogNewReferral(address indexed addr, address indexed referrerAddr, uint when, uint refBonus);
  event LogRGPInit(uint when, uint startTimestamp, uint maxDailyTotalInvestment, uint activityDays);
  event LogRGPInvestment(address indexed addr, uint when, uint investment, uint indexed day);
  event LogNewInvesment(address indexed addr, uint when, uint investment, uint value);
  event LogAutomaticReinvest(address indexed addr, uint when, uint investment);
  event LogPayDividends(address indexed addr, uint when, uint dividends);
  event LogNewInvestor(address indexed addr, uint when);
  event LogBalanceChanged(uint when, uint balance);
  event LogNextWave(uint when);
  event LogDisown(uint when);


  modifier balanceChanged {
    _;
    emit LogBalanceChanged(now, address(this).balance);
  }

  modifier notFromContract() {
    require(msg.sender.isNotContract(), "only externally accounts");
    _;
  }

  constructor() public {
    adminsAddress = msg.sender;
    advertisingAddress = msg.sender;
    nextWave();
  }

  function() public payable {
    // investor get him dividends
    if (msg.value.isZero()) {
      getMyDividends();
      return;
    }

    // sender do invest
    doInvest(msg.data.toAddress());
  }

  function doDisown() public onlyOwner {
    disown();
    emit LogDisown(now);
  }

  function init(address rev1StorageAddr, uint timestamp) public onlyOwner {
    // init Rapid Growth Protection
    m_rgp.startTimestamp = timestamp + 1;
    m_rgp.maxDailyTotalInvestment = 500 ether;
    m_rgp.activityDays = 21;
    emit LogRGPInit(
      now, 
      m_rgp.startTimestamp,
      m_rgp.maxDailyTotalInvestment,
      m_rgp.activityDays
    );


    // init Private Entrance
    m_privEnter.rev1Storage = Rev1Storage(rev1StorageAddr);
    m_privEnter.rev2Storage = Rev2Storage(address(m_investors));
    m_privEnter.investorMaxInvestment = 50 ether;
    m_privEnter.endTimestamp = timestamp;
    emit LogPEInit(
      now, 
      address(m_privEnter.rev1Storage), 
      address(m_privEnter.rev2Storage), 
      m_privEnter.investorMaxInvestment, 
      m_privEnter.endTimestamp
    );
  }

  function setAdvertisingAddress(address addr) public onlyOwner {
    addr.requireNotZero();
    advertisingAddress = addr;
  }

  function setAdminsAddress(address addr) public onlyOwner {
    addr.requireNotZero();
    adminsAddress = addr;
  }

  function privateEntranceProvideAccessFor(address[] addrs) public onlyOwner {
    m_privEnter.provideAccessFor(addrs);
  }

  function rapidGrowthProtectionmMaxInvestmentAtNow() public view returns(uint investment) {
    investment = m_rgp.maxInvestmentAtNow();
  }

  function investorsNumber() public view returns(uint) {
    return m_investors.size();
  }

  function balanceETH() public view returns(uint) {
    return address(this).balance;
  }

  function percent1() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_1_percent.num, m_1_percent.den);
  }

  function percent2() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_2_percent.num, m_2_percent.den);
  }

  function percent3_33() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_3_33_percent.num, m_3_33_percent.den);
  }

  function advertisingPercent() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_advertisingPercent.num, m_advertisingPercent.den);
  }

  function adminsPercent() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_adminsPercent.num, m_adminsPercent.den);
  }

  function investorInfo(address investorAddr) public view returns(uint investment, uint paymentTime, bool isReferral) {
    (investment, paymentTime) = m_investors.investorInfo(investorAddr);
    isReferral = m_referrals[investorAddr];
  }

  function investorDividendsAtNow(address investorAddr) public view returns(uint dividends) {
    dividends = calcDividends(investorAddr);
  }

  function dailyPercentAtNow() public view returns(uint numerator, uint denominator) {
    Percent.percent memory p = dailyPercent();
    (numerator, denominator) = (p.num, p.den);
  }

  function refBonusPercentAtNow() public view returns(uint numerator, uint denominator) {
    Percent.percent memory p = refBonusPercent();
    (numerator, denominator) = (p.num, p.den);
  }

  function getMyDividends() public notFromContract balanceChanged {
    // calculate dividends
    uint dividends = calcDividends(msg.sender);
    require (dividends.notZero(), "cannot to pay zero dividends");

    // update investor payment timestamp
    assert(m_investors.setPaymentTime(msg.sender, now));

    // check enough eth - goto next wave if needed
    if (address(this).balance <= dividends) {
      nextWave();
      dividends = address(this).balance;
    } 

    // transfer dividends to investor
    msg.sender.transfer(dividends);
    emit LogPayDividends(msg.sender, now, dividends);
  }

  function doInvest(address referrerAddr) public payable notFromContract balanceChanged {
    uint investment = msg.value;
    uint receivedEther = msg.value;
    require(investment >= minInvesment, "investment must be >= minInvesment");
    require(address(this).balance <= maxBalance, "the contract eth balance limit");

    if (m_rgp.isActive()) { 
      // use Rapid Growth Protection if needed
      uint rpgMaxInvest = m_rgp.maxInvestmentAtNow();
      rpgMaxInvest.requireNotZero();
      investment = Math.min(investment, rpgMaxInvest);
      assert(m_rgp.saveInvestment(investment));
      emit LogRGPInvestment(msg.sender, now, investment, m_rgp.currDay());
      
    } else if (m_privEnter.isActive()) {
      // use Private Entrance if needed
      uint peMaxInvest = m_privEnter.maxInvestmentFor(msg.sender);
      peMaxInvest.requireNotZero();
      investment = Math.min(investment, peMaxInvest);
    }

    // send excess of ether if needed
    if (receivedEther > investment) {
      uint excess = receivedEther - investment;
      msg.sender.transfer(excess);
      receivedEther = investment;
      emit LogSendExcessOfEther(msg.sender, now, msg.value, investment, excess);
    }

    // commission
    advertisingAddress.send(m_advertisingPercent.mul(receivedEther));
    adminsAddress.send(m_adminsPercent.mul(receivedEther));

    bool senderIsInvestor = m_investors.isInvestor(msg.sender);

    // ref system works only once and only on first invest
    // solium-disable-next-line operator-whitespace
    if (referrerAddr.notZero() && !senderIsInvestor && !m_referrals[msg.sender] &&
      referrerAddr != msg.sender && m_investors.isInvestor(referrerAddr)) {
      
      m_referrals[msg.sender] = true;
      // add referral bonus to investor`s and referral`s investments
      uint refBonus = refBonusPercent().mmul(investment);
      assert(m_investors.addInvestment(referrerAddr, refBonus)); // add referrer bonus
      investment += refBonus;                                    // add referral bonus
      emit LogNewReferral(msg.sender, referrerAddr, now, refBonus);
    }

    // automatic reinvest - prevent burning dividends
    uint dividends = calcDividends(msg.sender);
    if (senderIsInvestor && dividends.notZero()) {
      investment += dividends;
      emit LogAutomaticReinvest(msg.sender, now, dividends);
    }

    if (senderIsInvestor) {
      // update existing investor
      assert(m_investors.addInvestment(msg.sender, investment));
      assert(m_investors.setPaymentTime(msg.sender, now));
    } else {
      // create new investor
      assert(m_investors.newInvestor(msg.sender, investment, now));
      emit LogNewInvestor(msg.sender, now);
    }

    investmentsNumber++;
    emit LogNewInvesment(msg.sender, now, investment, receivedEther);
  }

  function getMemInvestor(address investorAddr) internal view returns(InvestorsStorage.Investor memory) {
    (uint investment, uint paymentTime) = m_investors.investorInfo(investorAddr);
    return InvestorsStorage.Investor(investment, paymentTime);
  }

  function calcDividends(address investorAddr) internal view returns(uint dividends) {
    InvestorsStorage.Investor memory investor = getMemInvestor(investorAddr);

    // safe gas if dividends will be 0
    if (investor.investment.isZero() || now.sub(investor.paymentTime) < 10 minutes) {
      return 0;
    }
    
    // for prevent burning daily dividends if 24h did not pass - calculate it per 10 min interval
    // if daily percent is X, then 10min percent = X / (24h / 10 min) = X / 144

    // and we must to get numbers of 10 min interval after investor got payment:
    // (now - investor.paymentTime) / 10min 

    // finaly calculate dividends = ((now - investor.paymentTime) / 10min) * (X * investor.investment)  / 144) 

    Percent.percent memory p = dailyPercent();
    dividends = (now.sub(investor.paymentTime) / 10 minutes) * p.mmul(investor.investment) / 144;
  }

  function dailyPercent() internal view returns(Percent.percent memory p) {
    uint balance = address(this).balance;

    // (3) 3.33% if balance < 1 000 ETH
    // (2) 2% if 1 000 ETH <= balance <= 33 333 ETH
    // (1) 1% if 33 333 ETH < balance

    if (balance < 1000 ether) { 
      p = m_3_33_percent.toMemory(); // (3)
    } else if ( 1000 ether <= balance && balance <= 33333 ether) {
      p = m_2_percent.toMemory();    // (2)
    } else {
      p = m_1_percent.toMemory();    // (1)
    }
  }

  function refBonusPercent() internal view returns(Percent.percent memory p) {
    uint balance = address(this).balance;

    // (1) 1% if 100 000 ETH < balance
    // (2) 2% if 10 000 ETH <= balance <= 100 000 ETH
    // (3) 3.33% if balance < 10 000 ETH   
    
    if (balance < 10000 ether) { 
      p = m_3_33_percent.toMemory(); // (3)
    } else if ( 10000 ether <= balance && balance <= 100000 ether) {
      p = m_2_percent.toMemory();    // (2)
    } else {
      p = m_1_percent.toMemory();    // (1)
    }          
  }

  function nextWave() private {
    m_investors = new InvestorsStorage();
    investmentsNumber = 0;
    waveStartup = now;
    m_rgp.startAt(now);
    emit LogRGPInit(now, m_rgp.startTimestamp, m_rgp.maxDailyTotalInvestment, m_rgp.activityDays);
    emit LogNextWave(now);
  }
}