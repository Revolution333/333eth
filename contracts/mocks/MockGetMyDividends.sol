pragma solidity ^0.4.23;

import "../Revolution2.sol";


contract MockGetMyDividends {
  function() public payable {}
  
  function getMyDividends(address rev2Addr) public {
    Revolution2 rev2 = Revolution2(rev2Addr);
    rev2.getMyDividends();
  }
}