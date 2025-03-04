// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./SharedStructs.sol";
import "./Main.sol";

contract UserManagement {
    Main main;
    constructor(address mainAddress) {
        main = Main(mainAddress);
    }
    mapping(address => string) private userToPassword;

	function registerUser(bytes32 googleIdHash, string memory email, address ethAddress, string memory password, string memory username, string memory location,uint8 role) public {
        // require(!main.getUser(googleIdHash).registered, "User already registered");
        main.setUser(googleIdHash, ethAddress, email, username, location, role, true);
		userToPassword[ethAddress] = password;
    }

    function validateUser(bytes32 googleIdHash) public view returns (bool) {
        return main.getUser(googleIdHash).registered;
    }

	function getUserAddress(bytes32 googleIdHash) public view returns (address) {
        // require(main.getUser(googleIdHash).registered, "User not registered");
        return main.getUser(googleIdHash).ethAddress;
    }

    function getUsername(bytes32 googleIdHash) public view returns (string memory) {
        // require(main.getUser(googleIdHash).registered, "User not registered");
        return main.getUser(googleIdHash).username;
    }

	function getUserRole(bytes32 googleIdHash) public view returns (uint8) {
		// require(main.getUser(googleIdHash).registered, "User not registered"); 
		return main.getUser(googleIdHash).role;
	}

	function getUserPassword(address ethAddress) public view returns (string memory) {
		return userToPassword[ethAddress];
	}
}