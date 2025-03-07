// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./SharedStructs.sol";
import "./Main.sol";
import "./Manufacturer.sol";
import "./RequestManagement.sol";

contract Consumer {
    Main main;
    Manufacturer manufacturer;
    RequestManagement RM;

    constructor(address mainAddress, address manufacturerAddress, address RMAddress) {
        main = Main(mainAddress);
        manufacturer = Manufacturer(manufacturerAddress);
        RM = RequestManagement(RMAddress);
    }

    mapping(address => uint256[]) private userBoughtProductIds;
	mapping(uint256 => SharedStructs.Comment[]) private ProductComments;
	mapping(uint256 => SharedStructs.Comment[]) private SoldProductComments;
	mapping(bytes32 => uint256) private manufacturerToConsumerComments;
	mapping(bytes32 => uint256) private consumerToManufacturerComments;
	event getTransactionId(uint256 transactionId);
	event getSoldProductId(uint256 soldProductId);

	function buyProduct(uint256 requestId) public {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 2, "User must be consumer to buy products.");
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require(bytes(ProductRequests[requestId].name).length > 0, "Request does not exist");
        SharedStructs.Request memory currRequest = RM.getRequest(requestId);
		// require(currRequest.quantity <= currRequest.product.quantity, "Insufficient product in stock");
		// require( main.getUser(googleIdHash).ethAddress == currRequest.requestingUser.ethAddress, "You are not authorized to buy this product");
		// require(currRequest.status == 1, "Product request not accepted");
		uint256 productId = currRequest.product.id;
		// require(manufacturer.getProductValidity(productId), "Product does not exist");

		manufacturer.decreaseProduct(productId, currRequest.quantity);
		if (manufacturer.getProduct(productId).quantity == 0) {
            manufacturer.removeUnsoldProduct(manufacturer.getProduct(productId).manufacturingUser.ethAddress, productId);
    	}
	}

	function markProductAsSold(uint256 requestId, bool transactionStatus, uint256 transactionTimestamp, uint256 gasUsed, bytes32 googleIdHash) public {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 2, "User must be consumer to buy products.");
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require(bytes(ProductRequests[requestId].name).length > 0, "Request does not exist");
        // SharedStructs.Request memory currRequest = RM.getRequest(requestId);
		// require(currRequest.quantity <= currRequest.product.quantity, "Insufficient product in stock");
		// require( main.getUser(googleIdHash).ethAddress == currRequest.requestingUser.ethAddress, "You are not authorized to buy this product");
		// require(currRequest.status == 1, "Product request not accepted");
		// require(transactionStatus == true, "Buying product failed");
		uint256 productId = RM.getRequest(requestId).product.id;
		// require(manufacturer.getProductValidity(productId), "Product does not exist");

		// SharedStructs.User memory buyingUser =  main.getUser(googleIdHash);
        // SharedStructs.Product memory currProduct = manufacturer.getProduct(productId);
        // uint256 quantityPurchased = currRequest.quantity;
        // SharedStructs.User memory manufacturingUser = currProduct.manufacturingUser;
        // uint256 pricePerUnit = currProduct.pricePerUnit;
		// uint256 totalPrice = pricePerUnit*quantityPurchased;
        SharedStructs.Transaction memory newTransaction = main.addTransaction(main.getUser(googleIdHash), manufacturer.getProduct(productId).manufacturingUser, transactionTimestamp, manufacturer.getProduct(productId).pricePerUnit, manufacturer.getProduct(productId).weightPerUnit, RM.getRequest(requestId).quantity, gasUsed, string(abi.encodePacked("Product ", SharedStructs.uint2str(productId), " bought")), transactionStatus);
        uint256 currSoldProductCtr = manufacturer.addSoldProduct(productId, RM.getRequest(requestId).quantity, main.getUser(googleIdHash), newTransaction, false);
		userBoughtProductIds[main.getUser(googleIdHash).ethAddress].push(currSoldProductCtr);
		RM.setRequestStatus(requestId, 3);
		if(manufacturer.getProduct(productId).quantity == 0){
            manufacturer.removeProduct(productId);
		}	
		emit getTransactionId(newTransaction.id);
		emit getSoldProductId(currSoldProductCtr);
	}

	function receiveProduct(uint256 soldProductId) public {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 2, "User must be consumer to receive product.");
		// require(manufacturer.getSoldProduct(soldProductId).buyingUser.ethAddress ==  main.getUser(googleIdHash).ethAddress, "You are not the buyer of this product");
		// require(manufacturer.getSoldProduct(soldProductId).received == false, "Product already received");
		manufacturer.setProductReceived(soldProductId);
	}

	function getUserBoughtProducts(address ethAddress) public view returns (SharedStructs.SoldProduct[] memory) {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 2, "User must be consumer to access bought products.");
		// SharedStructs.User memory user =  main.getUser(googleIdHash);
        uint256[] memory productIds = userBoughtProductIds[ethAddress];
        SharedStructs.SoldProduct[] memory products = new SharedStructs.SoldProduct[](productIds.length);
		uint256 index = 0;
        for (uint256 i = 0; i < productIds.length; i++) {
			if(manufacturer.getSoldProduct(productIds[i]).received == false){
				products[index] = manufacturer.getSoldProduct(productIds[i]);
				index++;
			}
        }
        assembly {mstore(products, index)}
		return products;
    }

	function getUserReceivedProducts(address ethAddress) public view returns (SharedStructs.SoldProduct[] memory) {
		// require( main.getUser(googleIdHash).registered, "User not registered");
		// require( main.getUser(googleIdHash).role == 2, "User must be consumer to access received products.");
		// SharedStructs.User memory user =  main.getUser(googleIdHash);
        uint256[] memory productIds = userBoughtProductIds[ethAddress];
        SharedStructs.SoldProduct[] memory products = new SharedStructs.SoldProduct[](productIds.length);
		uint256 index = 0;
        for (uint256 i = 0; i < productIds.length; i++) {
			if(manufacturer.getSoldProduct(productIds[i]).received == true){
				products[index] = manufacturer.getSoldProduct(productIds[i]);
				index++;
			}
        }
        assembly {mstore(products, index)}
		return products;
    }

	function addConsumerComment(SharedStructs.User memory from, SharedStructs.User memory to, string memory comment, uint256 rating, uint256 soldProductId) public {
        SharedStructs.Comment memory c = main.addComment(from, to, comment, rating);
        manufacturerToConsumerComments[keccak256(abi.encodePacked(from.ethAddress, soldProductId))] = c.id;
    }

	function getFromManufacturerCommentId(address ethAddress, uint256 soldProductId) public view returns (uint256){
		return manufacturerToConsumerComments[keccak256(abi.encodePacked(ethAddress, soldProductId))];
	}

	function addSoldProductComment(SharedStructs.SoldProduct memory soldProduct, string memory comment, uint256 rating) public {
        // require(main.getUser(googleIdHash).registered, "User not registered");
		// // require(main.getUser(googleIdHash).role == 2, "User must be consumer to add product comment.");
		// require(SoldProductStock[soldProductId].received == true, "Product does not exist");
		SharedStructs.Comment memory c = main.addComment(soldProduct.buyingUser, soldProduct.product.manufacturingUser, comment, rating);
        ProductComments[soldProduct.product.id].push(c);
		SoldProductComments[soldProduct.id].push(c);
		consumerToManufacturerComments[keccak256(abi.encodePacked(soldProduct.buyingUser.ethAddress, soldProduct.id))] = c.id;
    }

	function getToManufacturerComment(address ethAddress, uint256 soldProductId) public view returns (uint256){
		return consumerToManufacturerComments[keccak256(abi.encodePacked(ethAddress, soldProductId))];
	}

	function getSoldProductComments(uint256 soldProductId) public view returns (SharedStructs.Comment[] memory) {
		return SoldProductComments[soldProductId];
	}

    function getProductComments(uint256 productId) public view returns (SharedStructs.Comment[] memory) {
        return ProductComments[productId];
    }
}