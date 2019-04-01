pragma solidity ^0.5.0;

contract Adoption {
  address[16] public adopters;

  // Adopting a Pet
  function adopt(uint petId) public returns (uint) {
    // require ( petId >=0 && petId < adopters.length );
    require ( petId >=0 && petId < 16 );
    adopters[petId] = msg.sender;
    return petId;
  }

  // Retrieving the adopters (ALL 16, vs. just one)
  function getAdopters() public view returns (address[16] memory) {
    return adopters;
  }
}

