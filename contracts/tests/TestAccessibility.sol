pragma solidity ^0.4.23;

import "../Accessibility.sol";


contract TestAccessibility is Accessibility {
  function accessOnlyOwner() public view onlyOwner {}
  function doDisown() public {
    disown();
  }
}