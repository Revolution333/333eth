pragma solidity ^0.4.23;

//solium-disable security/no-block-members


contract Accessibility {
  enum AccessRank { None, Payout, Paymode, Full }
  mapping(address => AccessRank) internal m_admins;
  modifier onlyAdmin(AccessRank  r) {
    require(
      m_admins[msg.sender] == r || m_admins[msg.sender] == AccessRank.Full,
      "access denied"
    );
    _;
  }
  event LogProvideAccess(address indexed whom, uint when,  AccessRank rank);

  constructor() public {
    m_admins[msg.sender] = AccessRank.Full;
    emit LogProvideAccess(msg.sender, now, AccessRank.Full);
  }
  
  function provideAccess(address addr, AccessRank rank) public onlyAdmin(AccessRank.Full) {
    require(rank <= AccessRank.Full, "invalid access rank");
    require(m_admins[addr] != AccessRank.Full, "cannot change full access rank");
    if (m_admins[addr] != rank) {
      m_admins[addr] = rank;
      emit LogProvideAccess(addr, now, rank);
    }
  }

  function access(address addr) public view returns(AccessRank rank) {
    rank = m_admins[addr];
  }
}