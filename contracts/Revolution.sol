pragma solidity ^0.4.23;

// solium-disable security/no-block-members



import "./InvestorsStorage.sol";
import "./SafeMath.sol";
import "./Percent.sol";
import "./Accessibility.sol";
import "./PaymentSystem.sol";
import "./Zero.sol";
import "./ToAddress.sol";


contract Revolution is Accessibility, PaymentSystem {
  using Percent for Percent.percent;
  using SafeMath for uint;
  using Zero for *;
  using ToAddress for *;

  // investors storage - iterable map;
  InvestorsStorage private m_investors;
  mapping(address => bool) private m_referrals;
  bool private m_nextWave;

  // automatically generates getters
  address public adminAddr;
  address public payerAddr;
  uint public waveStartup;
  uint public investmentsNum;
  uint public constant minInvesment = 10 finney; // 0.01 eth
  uint public constant maxBalance = 333e5 ether; // 33,300,000 eth
  uint public constant pauseOnNextWave = 168 hours; 

  // percents 
  Percent.percent private m_dividendsPercent = Percent.percent(333, 10000); // 333/10000*100% = 3.33%
  Percent.percent private m_adminPercent = Percent.percent(1, 10); // 1/10*100% = 10%
  Percent.percent private m_payerPercent = Percent.percent(7, 100); // 7/100*100% = 7%
  Percent.percent private m_refPercent = Percent.percent(3, 100); // 3/100*100% = 3%

  // more events for easy read from blockchain
  event LogNewInvestor(address indexed addr, uint when, uint value);
  event LogNewInvesment(address indexed addr, uint when, uint value);
  event LogNewReferral(address indexed addr, uint when, uint value);
  event LogPayDividends(address indexed addr, uint when, uint value);
  event LogPayReferrerBonus(address indexed addr, uint when, uint value);
  event LogBalanceChanged(uint when, uint balance);
  event LogAdminAddrChanged(address indexed addr, uint when);
  event LogPayerAddrChanged(address indexed addr, uint when);
  event LogNextWave(uint when);

  modifier balanceChanged {
    _;
    emit LogBalanceChanged(now, address(this).balance);
  }

  modifier notOnPause() {
    require(waveStartup+pauseOnNextWave <= now, "pause on next wave not expired");
    _;
  }

  constructor() public {
    adminAddr = msg.sender;
    emit LogAdminAddrChanged(msg.sender, now);

    payerAddr = msg.sender;
    emit LogPayerAddrChanged(msg.sender, now);

    nextWave();
    waveStartup = waveStartup.sub(pauseOnNextWave);
  }

  function() public payable {
    // investor get him dividends
    if (msg.value == 0) {
      getMyDividends();
      return;
    }

    // sender do invest
    address a = msg.data.toAddr();
    address[3] memory refs;
    if (a.notZero()) {
      refs[0] = a;
      doInvest(refs); 
    } else {
      doInvest(refs);
    }
  }

  function investorsNumber() public view returns(uint) {
    return m_investors.size()-1;
    // -1 because see InvestorsStorage constructor where keys.length++ 
  }

  function balanceETH() public view returns(uint) {
    return address(this).balance;
  }

  function payerPercent() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_payerPercent.num, m_payerPercent.den);
  }

  function dividendsPercent() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_dividendsPercent.num, m_dividendsPercent.den);
  }

  function adminPercent() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_adminPercent.num, m_adminPercent.den);
  }

  function referrerPercent() public view returns(uint numerator, uint denominator) {
    (numerator, denominator) = (m_refPercent.num, m_refPercent.den);
  }

  function investorInfo(address addr) public view returns(uint value, uint paymentTime, uint refBonus, bool isReferral) {
    (value, paymentTime, refBonus) = m_investors.investorBaseInfo(addr);
    isReferral = m_referrals[addr];
  }

  function latestPayout() public view returns(uint timestamp) {
    return m_paysys.latestTime;
  }

  function getMyDividends() public notOnPause atPaymode(Paymode.Pull) balanceChanged {
    // check investor info
    InvestorsStorage.investor memory investor = getMemInvestor(msg.sender);
    require(investor.keyIndex > 0, "sender is not investor"); 
    if (investor.paymentTime < m_paysys.latestTime) {
      assert(m_investors.setPaymentTime(msg.sender, m_paysys.latestTime));
      investor.paymentTime = m_paysys.latestTime;
    }

    // calculate days after latest payment
    uint256 daysAfter = now.sub(investor.paymentTime).div(24 hours);
    require(daysAfter > 0, "the latest payment was earlier than 24 hours");
    assert(m_investors.setPaymentTime(msg.sender, now));

    // check enough eth 
    uint value = m_dividendsPercent.mul(investor.value) * daysAfter;
    if (address(this).balance < value + investor.refBonus) {
      nextWave();
      return;
    }

    // send dividends and ref bonus
    if (investor.refBonus > 0) {
      assert(m_investors.setRefBonus(msg.sender, 0));
      sendDividendsWithRefBonus(msg.sender, value, investor.refBonus);
    } else {
      sendDividends(msg.sender, value);
    }
  }

  function doInvest(address[3] refs) public payable notOnPause balanceChanged {
    require(msg.value >= minInvesment, "msg.value must be >= minInvesment");
    require(address(this).balance <= maxBalance, "the contract eth balance limit");

    uint value = msg.value;
    // ref system works only once for sender-referral
    if (!m_referrals[msg.sender]) {
      // level 1
      if (notZeroNotSender(refs[0]) && m_investors.contains(refs[0])) {
        uint reward = m_refPercent.mul(value);
        assert(m_investors.addRefBonus(refs[0], reward)); // referrer 1 bonus
        m_referrals[msg.sender] = true;
        value = m_dividendsPercent.add(value); // referral bonus
        emit LogNewReferral(msg.sender, now, value);
        // level 2
        if (notZeroNotSender(refs[1]) && m_investors.contains(refs[1]) && refs[0] != refs[1]) { 
          assert(m_investors.addRefBonus(refs[1], reward)); // referrer 2 bonus
          // level 3
          if (notZeroNotSender(refs[2]) && m_investors.contains(refs[2]) && refs[0] != refs[2] && refs[1] != refs[2]) { 
            assert(m_investors.addRefBonus(refs[2], reward)); // referrer 3 bonus
          }
        }
      }
    }

    // commission
    adminAddr.transfer(m_adminPercent.mul(msg.value));
    payerAddr.transfer(m_payerPercent.mul(msg.value));    
    
    // write to investors storage
    if (m_investors.contains(msg.sender)) {
      assert(m_investors.addValue(msg.sender, value));
    } else {
      assert(m_investors.insert(msg.sender, value));
      emit LogNewInvestor(msg.sender, now, value); 
    }
    
    if (m_paysys.mode == Paymode.Pull)
      assert(m_investors.setPaymentTime(msg.sender, now));

    emit LogNewInvesment(msg.sender, now, value);   
    investmentsNum++;
  }

  function payout() public notOnPause onlyAdmin(AccessRank.Payout) atPaymode(Paymode.Push) balanceChanged {
    if (m_nextWave) {
      nextWave(); 
      return;
    }
   
    // if m_paysys.latestKeyIndex == m_investors.iterStart() then payout NOT in process and we must check latest time of payment.
    if (m_paysys.latestKeyIndex == m_investors.iterStart()) {
      require(now>m_paysys.latestTime+12 hours, "the latest payment was earlier than 12 hours");
      m_paysys.latestTime = now;
    }

    uint i = m_paysys.latestKeyIndex;
    uint value;
    uint refBonus;
    uint size = m_investors.size();
    address investorAddr;
    
    // gasleft and latest key index  - prevent gas block limit 
    for (i; i < size && gasleft() > 50000; i++) {
      investorAddr = m_investors.keyFromIndex(i);
      (value, refBonus) = m_investors.investorShortInfo(investorAddr);
      value = m_dividendsPercent.mul(value);

      if (address(this).balance < value + refBonus) {
        m_nextWave = true;
        break;
      }

      if (refBonus > 0) {
        require(m_investors.setRefBonus(investorAddr, 0), "internal error");
        sendDividendsWithRefBonus(investorAddr, value, refBonus);
        continue;
      }

      sendDividends(investorAddr, value);
    }

    if (i == size) 
      m_paysys.latestKeyIndex = m_investors.iterStart();
    else 
      m_paysys.latestKeyIndex = i;
  }

  function setAdminAddr(address addr) public onlyAdmin(AccessRank.Full) {
    addr.requireNotZero();
    if (adminAddr != addr) {
      adminAddr = addr;
      emit LogAdminAddrChanged(addr, now);
    }    
  }

  function setPayerAddr(address addr) public onlyAdmin(AccessRank.Full) {
    addr.requireNotZero();
    if (payerAddr != addr) {
      payerAddr = addr;
      emit LogPayerAddrChanged(addr, now);
    }  
  }

  function setPullPaymode() public onlyAdmin(AccessRank.Paymode) atPaymode(Paymode.Push) {
    changePaymode(Paymode.Pull);
  }

  function getMemInvestor(address addr) internal view returns(InvestorsStorage.investor) {
    (uint a, uint b, uint c, uint d) = m_investors.investorFullInfo(addr);
    return InvestorsStorage.investor(a, b, c, d);
  }

  function notZeroNotSender(address addr) internal view returns(bool) {
    return addr.notZero() && addr != msg.sender;
  }

  function sendDividends(address addr, uint value) private {
    // solium-disable security/no-send 
    // solium-disable-next-line lbrace
    if (addr.send(value)) emit LogPayDividends(addr, now, value); 
  }

  function sendDividendsWithRefBonus(address addr, uint value,  uint refBonus) private {
    // solium-disable security/no-send  
    if (addr.send(value+refBonus)) {
      emit LogPayDividends(addr, now, value);
      emit LogPayReferrerBonus(addr, now, refBonus);
    }
  }

  function nextWave() private {
    m_investors = new InvestorsStorage();
    changePaymode(Paymode.Push);
    m_paysys.latestKeyIndex = m_investors.iterStart();
    investmentsNum = 0;
    waveStartup = now;
    m_nextWave = false;
    emit LogNextWave(now);
  }
}