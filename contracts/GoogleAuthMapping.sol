// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract GoogleAuthMapping {
    struct User {
        address ethAddress;
        bool registered;
    }

    struct Product {
        uint256 id;
        string name;
        uint256 quantity;
    }

    mapping(bytes32 => User) private googleIdToUser;
    mapping(address => Product[]) private userProducts;
    uint256 private productCounter = 0;

    event UserRegistered(bytes32 indexed googleIdHash, address ethAddress);
    event UserValidated(bytes32 indexed googleIdHash);
    event ProductAdded(address indexed user, uint256 productId, string name, uint256 quantity);

    function registerUser(bytes32 googleIdHash, address ethAddress) public {
        require(!googleIdToUser[googleIdHash].registered, "User already registered");
        googleIdToUser[googleIdHash] = User(ethAddress, true);
        emit UserRegistered(googleIdHash, ethAddress);
    }

    function validateUser(bytes32 googleIdHash) public view returns (bool) {
        return googleIdToUser[googleIdHash].registered;
    }

    function getUserAddress(bytes32 googleIdHash) public view returns (address) {
        require(googleIdToUser[googleIdHash].registered, "User not registered");
        return googleIdToUser[googleIdHash].ethAddress;
    }

    function addProduct(string memory name, uint256 quantity) public {
        require(quantity > 0, "Quantity must be greater than 0");
        productCounter++;
        userProducts[msg.sender].push(Product(productCounter, name, quantity));
        emit ProductAdded(msg.sender, productCounter, name, quantity);
    }

    function getProducts() public view returns (Product[] memory) {
        return userProducts[msg.sender];
    }
}
