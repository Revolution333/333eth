pragma solidity ^0.4.23;

import "../Accessibility.sol";


contract TestAccessibility is Accessibility {
  function accessRankNone() public view onlyAdmin(AccessRank.None) {}
  function accessRankPayout() public view onlyAdmin(AccessRank.Payout) {}
  function accessRankPaymode() public view onlyAdmin(AccessRank.Paymode) {}
  function accessRankFull() public view onlyAdmin(AccessRank.Full) {}
}