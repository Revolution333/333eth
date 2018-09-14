pragma solidity ^0.4.23;


contract PaymentSystem {
  // https://consensys.github.io/smart-contract-best-practices/recommendations/#favor-pull-over-push-for-external-calls
  enum Paymode { Push, Pull }
  struct PaySys {
    uint latestTime;
    uint latestKeyIndex;
    Paymode mode; 
  }
  PaySys internal m_paysys;

  modifier atPaymode(Paymode mode) {
    require(m_paysys.mode == mode, "pay mode does not the same");
    _;
  }
  event LogPaymodeChanged(uint when, Paymode indexed mode);
  
  function paymode() public view returns(Paymode mode) {
    mode = m_paysys.mode;
  }

  function changePaymode(Paymode mode) internal {
    // solium-disable lbrace
    // solium-disable security/no-block-members
    require(mode <= Paymode.Pull, "invalid pay mode");
    if (mode == m_paysys.mode ) return; 
    if (mode == Paymode.Pull) require(m_paysys.latestTime != 0, "cannot set pull pay mode if latest time is 0");
    if (mode == Paymode.Push) m_paysys.latestTime = 0;
    m_paysys.mode = mode;
    emit LogPaymodeChanged(now, m_paysys.mode);
  }
}