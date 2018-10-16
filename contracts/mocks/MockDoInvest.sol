pragma solidity ^0.4.23;

import "../Revolution2.sol";


contract MockDoInvest {
  function doInvest(address rev2Addr, address referrerAddr) public payable {
    Revolution2 rev2 = Revolution2(rev2Addr);
    rev2.doInvest.value(msg.value)(referrerAddr);
  }
}