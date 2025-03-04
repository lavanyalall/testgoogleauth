// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./SharedStructs.sol";
import "./Main.sol";
import "./RawMaterialSupplier.sol";

contract Manufacturer {
    Main main;
    RawMaterialSupplier RMS;

    constructor(address mainAddress, address rmsAddress) {
        main = Main(mainAddress);
        RMS = RawMaterialSupplier(rmsAddress);
    }

    mapping(address => uint256[]) private userUnsoldProductIds;
	mapping(address => uint256[]) private userSoldProductIds;
	mapping(address => uint256[]) private userBoughtRawMaterialIds;
	mapping(uint256 => uint256[]) private rawMaterialsUsed;
	mapping(uint256 => SharedStructs.Product) private ProductStock;
    mapping(uint256 => bool) private ProductStockValidity;
	mapping(uint256 => SharedStructs.SoldProduct) private SoldProductStock;
	uint256 private productCtr = 0;
    uint256 private soldProductCtr = 0;

	event getProductId(uint256 productId);

	// function buyRawMaterial(uint256 rawMaterialId, uint256 quantity) public {
	// 	// require(main.getUser(googleIdHash).registered, "User not registered");
	// 	// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to buy raw materials.");
	// 	// require(quantity > 0, "Quantity must be greater than 0.");
	// 	// require(RMS.getRawMaterial(rawMaterialId).quantity >= quantity, "Not enough raw material in stock");
	// 	// require(main.getUser(googleIdHash).ethAddress != RMS.getRawMaterial(rawMaterialId).registeringUser.ethAddress, "You cannot buy your own raw material");
	// 	RMS.decreaseRawMaterial(rawMaterialId, quantity);
	// 	if (RMS.getRawMaterial(rawMaterialId).quantity == 0) {
	// 		RMS.removeUnsoldRawMaterial(RMS.getRawMaterial(rawMaterialId).registeringUser.ethAddress, rawMaterialId);
    // 	}
	// }

	function addProduct(string memory name, uint256 quantity, string memory description, uint256 pricePerUnit, uint256 weightPerUnit, uint256[] memory rawMaterialIds, uint256[] memory rawMaterialQuantities, bool[] memory transactionStatuses, uint256[] memory gasUsed, uint256[] memory transactionTimestamps, bytes32 googleIdHash) public {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to add products.");
		// require(quantity > 0, "Quantity must be greater than 0");
		// require(pricePerUnit > 0, "Price must be greater than 0");
		// require(rawMaterialIds.length == rawMaterialQuantities.length, "Mismatch in raw material IDs and quantities");
		// require(rawMaterialIds.length == transactionStatuses.length, "Mismatch in raw material IDs and transaction statuses");
		// require(rawMaterialIds.length == transactionTimestamps.length, "Mismatch in raw material IDs and transaction timestamps");
		// require(rawMaterialIds.length == gasUsed.length, "Mismatch in raw material IDs and length of gas used array");

		productCtr++;
		userUnsoldProductIds[main.getUser(googleIdHash).ethAddress].push(productCtr);

		for (uint256 i = 0; i < rawMaterialIds.length; i++) {
			// require(transactionStatuses[i] == true, "Raw material transaction failed");
            uint256 id = rawMaterialIds[i];
            uint256 quantityPurchased = rawMaterialQuantities[i];
            uint256 currGasUsed = gasUsed[i];
            bool transactionStatus = transactionStatuses[i];
            SharedStructs.RawMaterial memory rawMaterial = RMS.getRawMaterial(id);
			string memory status = string(abi.encodePacked("Raw Material ", SharedStructs.uint2str(id), " bought"));
            SharedStructs.Transaction memory newTransaction = main.addTransaction(main.getUser(googleIdHash), rawMaterial.registeringUser, transactionTimestamps[i], rawMaterial.pricePerUnit, rawMaterial.weightPerUnit, quantityPurchased, currGasUsed, status, transactionStatus);
			uint256 currSoldRawMaterialCtr = RMS.addSoldRawMaterial(id, quantityPurchased,  main.getUser(googleIdHash), newTransaction, false);
			userBoughtRawMaterialIds[main.getUser(googleIdHash).ethAddress].push(currSoldRawMaterialCtr);
			RMS.setRawMaterialProduct(currSoldRawMaterialCtr, productCtr);
			if(rawMaterial.quantity == 0){
                RMS.removeRawMaterial(id);
			}
			
			rawMaterialsUsed[productCtr].push(currSoldRawMaterialCtr);
		}
		ProductStock[productCtr] = SharedStructs.Product(productCtr, block.timestamp, name, quantity, description, pricePerUnit, weightPerUnit, main.getUser(googleIdHash), 0, false);
        ProductStockValidity[productCtr] = true;	
		emit getProductId(productCtr);	
	}

	function getAllManufacturedProducts() public view returns (SharedStructs.Product[] memory) {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 2, "User must be consumer to access all products.");
		SharedStructs.Product[] memory products = new  SharedStructs.Product[](productCtr);
		uint256 index = 0;
		for (uint256 i = 1; i <= productCtr; i++) {
			if (ProductStockValidity[i] == true) {
				if(ProductStock[i].manufactured == true){
					products[index] = ProductStock[i];
					index++;
				}
        	}
		}
		assembly {mstore(products, index)}
		return products;
    }

    function getProductRawMaterials(uint256 productId) public view returns (SharedStructs.SoldRawMaterial[] memory){
        SharedStructs.SoldRawMaterial[] memory rawMaterials = new  SharedStructs.SoldRawMaterial[](rawMaterialsUsed[productId].length);
        for (uint256 i = 0; i < rawMaterialsUsed[productId].length; i++) {
				rawMaterials[i] = RMS.getSoldRawMaterial(rawMaterialsUsed[productId][i]);
        }
		return rawMaterials;
    }

	function getUserBoughtRawMaterials(address ethAddress) public view returns (SharedStructs.SoldRawMaterial[] memory) {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to access bought raw materials.")
        SharedStructs.SoldRawMaterial[] memory rawMaterials = new SharedStructs.SoldRawMaterial[](userBoughtRawMaterialIds[ethAddress].length);
        for (uint256 i = 0; i < userBoughtRawMaterialIds[ethAddress].length; i++) {
				rawMaterials[i] = RMS.getSoldRawMaterial(userBoughtRawMaterialIds[ethAddress][i]);
        }
		return rawMaterials;
    }

	// function getUserReceivedRawMaterials(bytes32 googleIdHash) public view returns (SharedStructs.SoldRawMaterial[] memory) {
	// 	require(main.getUser(googleIdHash).registered, "User not registered");
	// 	require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to access received raw materials.");
	// 	 SharedStructs.User memory user = main.getUser(googleIdHash);
    //     uint256[] memory rawMaterialIds = userBoughtRawMaterialIds[user.ethAddress];
    //      SharedStructs.SoldRawMaterial[] memory rawMaterials = new  SharedStructs.SoldRawMaterial[](rawMaterialIds.length);
	// 	uint256 index = 0;
    //     for (uint256 i = 0; i < rawMaterialIds.length; i++) {
	// 		if(RMS.getSoldRawMaterial(rawMaterialIds[i]).received == true){
	// 			rawMaterials[index] = RMS.getSoldRawMaterial(rawMaterialIds[i]);
	// 			index++;
	// 		}
    //     }
    //     assembly {mstore(rawMaterials, index)}
	// 	return rawMaterials;
    // }

	// function getUserUnmanufacturedProducts(bytes32 googleIdHash) public view returns (SharedStructs.Product[] memory) {
	// 	require(main.getUser(googleIdHash).registered, "User not registered");
	// 	require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to access unmanufactured products.");
	// 	 SharedStructs.User memory user = main.getUser(googleIdHash);
    //     uint256[] memory productIds = userUnsoldProductIds[user.ethAddress];
    //      SharedStructs.Product[] memory products = new  SharedStructs.Product[](productIds.length);
	// 	uint256 index = 0;
    //     for (uint256 i = 0; i < productIds.length; i++) {
	// 		if(ProductStock[productIds[i]].manufactured == false){
	// 			products[index] = ProductStock[productIds[i]];
	// 			index++;
	// 		}
    //     }
    //     assembly {mstore(products, index)}
	// 	return products;
    // }

	function getUserUnsoldProducts(address ethAddress) public view returns (SharedStructs.Product[] memory) {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to access manufactured products.")
        SharedStructs.Product[] memory products = new  SharedStructs.Product[](userUnsoldProductIds[ethAddress].length);
        for (uint256 i = 0; i < userUnsoldProductIds[ethAddress].length; i++) {
			products[i] = ProductStock[userUnsoldProductIds[ethAddress][i]];
        }
		return products;
    }

	// function getUserPendingProducts(bytes32 googleIdHash) public view returns (SharedStructs.SoldProduct[] memory) {
	// 	require(main.getUser(googleIdHash).registered, "User not registered");
	// 	require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to access pending products.");
	// 	 SharedStructs.User memory user = main.getUser(googleIdHash);
    //     uint256[] memory productIds = userSoldProductIds[user.ethAddress];
    //      SharedStructs.SoldProduct[] memory products = new  SharedStructs.SoldProduct[](productIds.length);
	// 	uint256 index = 0;
    //     for (uint256 i = 0; i < productIds.length; i++) {
	// 		if(SoldProductStock[productIds[i]].received == false){
	// 			products[index] = SoldProductStock[productIds[i]];
	// 			index++;
	// 		}
    //     }
    //     assembly {mstore(products, index)}
	// 	return products;
    // }

	function getUserSoldProducts(address ethAddress) public view returns (SharedStructs.SoldProduct[] memory) {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to access sold products.");
        SharedStructs.SoldProduct[] memory products = new  SharedStructs.SoldProduct[](userSoldProductIds[ethAddress].length);
        for (uint256 i = 0; i < userSoldProductIds[ethAddress].length; i++) {
				products[i] = SoldProductStock[userSoldProductIds[ethAddress][i]];
        }
		return products;
    }

	function receiveRawMaterial(uint256 soldRawMaterialId) public {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to receive raw materials.");
		// require(RMS.getSoldRawMaterial(soldRawMaterialId).buyingUser.ethAddress == main.getUser(googleIdHash).ethAddress, "You are not the buyer of this raw material");
		// require(RMS.getSoldRawMaterial(soldRawMaterialId).received == false, "Raw material already received");
		RMS.setRawMaterialReceived(soldRawMaterialId);
	}

	function manufactureProduct(uint256 productId) public {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to manufacture products.");
		// require(ProductStockValidity[productId], "Product does not exist");
		// require(ProductStock[productId].manufacturingUser.ethAddress == main.getUser(googleIdHash).ethAddress, "You are not the manufacturer of this product");
		// require(ProductStock[productId].manufactured == false, "Product already manufactured");
		ProductStock[productId].manufactured = true;
		ProductStock[productId].manufacturedTimestamp = block.timestamp;
	}

    function getProduct(uint256 productId) public view returns (SharedStructs.Product memory){
        // require(ProductStockValidity[productId] == true, "Product does not exist");
        return ProductStock[productId];
    }

    function getSoldProduct(uint256 soldProductId) public view returns (SharedStructs.SoldProduct memory){
        return SoldProductStock[soldProductId];
    }

    // function getProductValidity(uint256 productId) public view returns (bool){
    //     return ProductStockValidity[productId];
    // }

    function decreaseProduct(uint256 productId, uint256 quantity) public {
        // require(ProductStockValidity[productId] == true, "Product does not exist");
        ProductStock[productId].quantity -= quantity;
    }

    function removeUnsoldProduct(address ethAddress, uint256 productId) public {
        uint256[] storage userProductIds = userUnsoldProductIds[ethAddress];
        for (uint256 i = 0; i < userProductIds.length; i++) {
            if (userProductIds[i] == productId) {
                userProductIds[i] = userProductIds[userProductIds.length - 1];
                userProductIds.pop();
                break;
            }
        }
    }

    function addSoldProduct(uint256 productId, uint256 quantity, SharedStructs.User memory buyingUser, SharedStructs.Transaction memory newTransaction, bool received) public returns (uint256) {
        soldProductCtr++;
		SharedStructs.SoldProduct memory newSoldProduct =  SharedStructs.SoldProduct(soldProductCtr, ProductStock[productId], buyingUser, newTransaction, 0, received);
		newSoldProduct.product.quantity = quantity;
		SoldProductStock[soldProductCtr] = newSoldProduct;
        userSoldProductIds[ProductStock[productId].manufacturingUser.ethAddress].push(soldProductCtr);
        return soldProductCtr;
    }

    function removeProduct(uint256 productId) public {
        // delete ProductStock[productId];
        ProductStockValidity[productId] = false;
    }

     function setProductReceived(uint256 soldProductId) public {
        SoldProductStock[soldProductId].received = true;
		SoldProductStock[soldProductId].receivedTimestamp = block.timestamp;
    }
}