pragma solidity ^0.4.23;

import "../PaymentSystem.sol";


contract TestPaymentSystem is PaymentSystem {
  function latestTime() public view returns(uint) {
    return m_paysys.latestTime;
  }

  function latestKeyIndex() public view returns(uint) {
    return m_paysys.latestKeyIndex;
  }

  function atPaymodePush() public view atPaymode(Paymode.Push) {}
  function atPaymodePull() public view atPaymode(Paymode.Pull) {}
  function setLatestTime(uint t) public {
    m_paysys.latestTime = t;
  }

  function setMode(Paymode mode) public {
    m_paysys.mode = mode;
  }

  function changePaymodeTest(Paymode mode) public {
    changePaymode(mode);
  }
}