pragma solidity ^0.4.23;



contract InvestorsStorage {
  struct investor {
    uint keyIndex;
    uint value;
    uint paymentTime;
    uint refBonus;
  }
  struct itmap {
    mapping(address => investor) data;
    address[] keys;
  }
  itmap private s;
  address private owner;

  modifier onlyOwner() {
    require(msg.sender == owner, "access denied");
    _;
  }

  constructor() public {
    owner = msg.sender;
    s.keys.length++;
  }

  function insert(address addr, uint value) public onlyOwner returns (bool) {
    uint keyIndex = s.data[addr].keyIndex;
    if (keyIndex != 0) return false; // solium-disable-line lbrace
    s.data[addr].value = value;
    keyIndex = s.keys.length++;
    s.data[addr].keyIndex = keyIndex;
    s.keys[keyIndex] = addr;
    return true;
  }

  function investorFullInfo(address addr) public view returns(uint, uint, uint, uint) {
    return (
      s.data[addr].keyIndex,
      s.data[addr].value,
      s.data[addr].paymentTime,
      s.data[addr].refBonus
    );
  }

  function investorBaseInfo(address addr) public view returns(uint, uint, uint) {
    return (
      s.data[addr].value,
      s.data[addr].paymentTime,
      s.data[addr].refBonus
    );
  }

  function investorShortInfo(address addr) public view returns(uint, uint) {
    return (
      s.data[addr].value,
      s.data[addr].refBonus
    );
  }

  function addRefBonus(address addr, uint refBonus) public onlyOwner returns (bool) {
    // solium-disable-next-line lbrace
    if (s.data[addr].keyIndex == 0) return false;
    s.data[addr].refBonus += refBonus;
    return true;
  }

  function addValue(address addr, uint value) public onlyOwner returns (bool) {
    // solium-disable-next-line lbrace
    if (s.data[addr].keyIndex == 0) return false;
    s.data[addr].value += value;
    return true;
  }

  function setPaymentTime(address addr, uint paymentTime) public onlyOwner returns (bool) {
    // solium-disable-next-line lbrace
    if (s.data[addr].keyIndex == 0) return false;
    s.data[addr].paymentTime = paymentTime;
    return true;
  }

  function setRefBonus(address addr, uint refBonus) public onlyOwner returns (bool) {
    // solium-disable-next-line lbrace
    if (s.data[addr].keyIndex == 0) return false;
    s.data[addr].refBonus = refBonus;
    return true;
  }

  function keyFromIndex(uint i) public view returns (address) {
    return s.keys[i];
  }

  function contains(address addr) public view returns (bool) {
    return s.data[addr].keyIndex > 0;
  }

  function size() public view returns (uint) {
    return s.keys.length;
  }

  function iterStart() public pure returns (uint) {
    return 1;
  }
}