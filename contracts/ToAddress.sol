pragma solidity ^0.4.23;


library ToAddress {
  function toAddr(uint source) internal pure returns(address) {
    return address(source);
  }

  function toAddr(bytes source) internal pure returns(address addr) {
    // solium-disable security/no-inline-assembly
    assembly { addr := mload(add(source,0x14)) }
    return addr;
  }
}