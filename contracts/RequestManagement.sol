// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./SharedStructs.sol";
import "./Main.sol";
import "./Manufacturer.sol";

contract RequestManagement {
    Main main;
    Manufacturer manufacturer;
    constructor(address mainAddress, address manufacturerAddress) {
        main = Main(mainAddress);
        manufacturer = Manufacturer(manufacturerAddress);
    }

    uint256 public requestCtr = 0;
	mapping(uint256 => SharedStructs.Request) private ProductRequests;
	mapping(address => uint256[]) private manufacturerProductRequestIds;
	mapping(address => uint256[]) private consumerProductRequestIds;

	function requestProduct(uint256 productId, uint256 quantity, bytes32 googleIdHash) public {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 2, "User must be consumer to request products.");
		// // require(manufacturer.getProductValidity(productId), "Product does not exist");
		// require(manufacturer.getProduct(productId).manufactured == true, "Product has not been manufactured");
		// require(quantity > 0, "Quantity must be greater than 0");
		// require(quantity <= manufacturer.getProduct(productId).quantity, "Insufficient quantity in stock");
		requestCtr++;
		SharedStructs.Request memory newRequest = SharedStructs.Request(requestCtr, manufacturer.getProduct(productId),  main.getUser(googleIdHash), block.timestamp, quantity, 0);
		ProductRequests[requestCtr] = newRequest;
		manufacturerProductRequestIds[manufacturer.getProduct(productId).manufacturingUser.ethAddress].push(requestCtr);
		consumerProductRequestIds[ main.getUser(googleIdHash).ethAddress].push(requestCtr);
	}

	function rejectRequest(uint256 requestId) public {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 1, "User must be manufacturer to reject requests.");
		// // require(bytes(ProductRequests[requestId].name).length > 0, "Request does not exist");
		// require(ProductRequests[requestId].status == 0, "Request has already been addressed.");
		// require( main.getUser(googleIdHash).ethAddress == ProductRequests[requestId].product.manufacturingUser.ethAddress, "A different manufacturer made the product");
		ProductRequests[requestId].status = 2;
	}

	function acceptRequest(uint256 requestId) public {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 1, "User must be manufacturer to reject requests.");
		//require(bytes(ProductRequests[requestId].name).length > 0, "Request does not exist");
		// require(ProductRequests[requestId].status == 0, "Request has already been addressed.");
		// require( main.getUser(googleIdHash).ethAddress == ProductRequests[requestId].product.manufacturingUser.ethAddress, "A different manufacturer made the product");
		ProductRequests[requestId].status = 1;
	}

	function getManufacturerProductRequests(address ethAddress) public view returns (SharedStructs.Request[] memory) {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 1, "User must be manufacturer to access manufacturer product requests.");
		// SharedStructs.User memory user =  main.getUser(googleIdHash);
        uint256[] memory requestIds = manufacturerProductRequestIds[ethAddress];
        SharedStructs.Request[] memory requests = new SharedStructs.Request[](requestIds.length);
        for (uint256 i = 0; i < requestIds.length; i++) {
			requests[i] = ProductRequests[requestIds[i]];
        }
		return requests;
	}

	function getConsumerProductRequests(address ethAddress) public view returns (SharedStructs.Request[] memory) {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 2, "User must be consumer to access consumer product requests.");
		// SharedStructs.User memory user =  main.getUser(googleIdHash);
        uint256[] memory requestIds = consumerProductRequestIds[ethAddress];
        SharedStructs.Request[] memory requests = new SharedStructs.Request[](requestIds.length);
        for (uint256 i = 0; i < requestIds.length; i++) {
			requests[i] = ProductRequests[requestIds[i]];
        }
		return requests;
	}

    function getRequest(uint256 requestId) public view returns (SharedStructs.Request memory){
        return ProductRequests[requestId];
    }

	function setRequestStatus(uint256 requestId, uint8 status) public {
		ProductRequests[requestId].status = status;
	}
}