pragma solidity ^0.4.23;


library Address {
  function toAddress(bytes source) internal pure returns(address addr) {
    // solium-disable security/no-inline-assembly
    assembly { addr := mload(add(source,0x14)) }
    return addr;
  }

  function isNotContract(address addr) internal view returns(bool) {
    // solium-disable security/no-inline-assembly
    uint length;
    assembly { length := extcodesize(addr) }
    return length == 0;
  }
}