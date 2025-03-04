// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./SharedStructs.sol";
import "./Main.sol";

contract RawMaterialSupplier {
    Main main;
    constructor(address mainAddress) {
        main = Main(mainAddress);
    }
    mapping(address => uint256[]) private userUnsoldRawMaterialIds;
	mapping(address => uint256[]) private userSoldRawMaterialIds;
	mapping(uint256 => SharedStructs.RawMaterial) private RawMaterialStock;
    mapping(uint256 => bool) private RawMaterialStockValidity;
	mapping(uint256 => SharedStructs.Comment[]) private RawMaterialComments;
	mapping(uint256 => SharedStructs.SoldRawMaterial) private SoldRawMaterialStock;
    mapping(uint256 => SharedStructs.Comment[]) private SoldRawMaterialComments;
    mapping(uint256 => uint256) private rawMaterialToProduct;
    mapping(bytes32 => uint256) private rmsToManufacturerComments;
    mapping(bytes32 => uint256) private manufacturerToRMSComments;
	uint256 private  rawMaterialCtr = 0;
	uint256 private soldRawMaterialCtr = 0;

	function addRawMaterial(string memory name, uint256 quantity, string memory description, uint256 pricePerUnit, uint256 weightPerUnit, bytes32 googleIdHash) public {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 0, "User must be raw material supplier to add raw materials.");
        // require(quantity > 0, "Quantity must be greater than 0");
		// require(pricePerUnit > 0, "Price must be greater than 0");
		rawMaterialCtr++;
		RawMaterialStock[rawMaterialCtr] = SharedStructs.RawMaterial(rawMaterialCtr, block.timestamp, name, quantity, description, pricePerUnit, weightPerUnit, main.getUser(googleIdHash));
        RawMaterialStockValidity[rawMaterialCtr] = true;
		userUnsoldRawMaterialIds[main.getUser(googleIdHash).ethAddress].push(rawMaterialCtr);
    }

    function getAllRawMaterials() public view returns (SharedStructs.RawMaterial[] memory) {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to access all the raw materials.");
		SharedStructs.RawMaterial[] memory rawMaterials = new SharedStructs.RawMaterial[](rawMaterialCtr);
		uint256 index = 0;
		for (uint256 i = 1; i <= rawMaterialCtr; i++) {
			if (RawMaterialStockValidity[i] == true) {
				rawMaterials[index] = RawMaterialStock[i];
				index++;
        	}
		}
		assembly {mstore(rawMaterials, index)}
		return rawMaterials;
    }

    function getUserUnsoldRawMaterials(address ethAddress) public view returns (SharedStructs.RawMaterial[] memory) {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 0, "User must be raw material supplier to access unsold raw materials.");
		// SharedStructs.User memory user = main.getUser(googleIdHash);
        SharedStructs.RawMaterial[] memory rawMaterials = new SharedStructs.RawMaterial[]( userUnsoldRawMaterialIds[ethAddress].length);
        for (uint256 i = 0; i <  userUnsoldRawMaterialIds[ethAddress].length; i++) {
            rawMaterials[i] = RawMaterialStock[ userUnsoldRawMaterialIds[ethAddress][i]];
        }
        return rawMaterials;
    }

	// function getUserPendingRawMaterials(bytes32 googleIdHash) public view returns (SharedStructs.SoldRawMaterial[] memory) {
	// 	require(main.getUser(googleIdHash).registered, "User not registered");
	// 	require(main.getUser(googleIdHash).role == 0, "User must be raw material supplier to access pending raw materials.");
	// 	SharedStructs.User memory user = main.getUser(googleIdHash);
	// 	uint256[] memory rawMaterialIds = userSoldRawMaterialIds[user.ethAddress];
    //     SharedStructs.SoldRawMaterial[] memory rawMaterials = new SharedStructs.SoldRawMaterial[](rawMaterialIds.length);
	// 	uint256 index = 0;
    //     for (uint256 i = 0; i < rawMaterialIds.length; i++) {
	// 		if(SoldRawMaterialStock[rawMaterialIds[i]].received == false){
	// 			rawMaterials[index] = SoldRawMaterialStock[rawMaterialIds[i]];
	// 			index++;
	// 		}
    //     }
    //     assembly {mstore(rawMaterials, index)}
	// 	return rawMaterials;
	// }

	function getUserSoldRawMaterials(address ethAddress) public view returns (SharedStructs.SoldRawMaterial[] memory) {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// // require(main.getUser(googleIdHash).role == 0, "User must be raw material supplier to access sold raw materials.");
		// SharedStructs.User memory user = main.getUser(googleIdHash);
        SharedStructs.SoldRawMaterial[] memory rawMaterials = new SharedStructs.SoldRawMaterial[](userSoldRawMaterialIds[ethAddress].length);
		// uint256 index = 0;
        for (uint256 i = 0; i < userSoldRawMaterialIds[ethAddress].length; i++) {
			// if(SoldRawMaterialStock[rawMaterialIds[i]].received == true){
				rawMaterials[i] = SoldRawMaterialStock[userSoldRawMaterialIds[ethAddress][i]];
				// index++;
			// }
        }
        // assembly {mstore(rawMaterials, index)}
		return rawMaterials;
	}

    function getRawMaterial(uint256 rawMaterialId) public view returns (SharedStructs.RawMaterial memory){
        // require(RawMaterialStockValidity[rawMaterialId] == true, "Raw Material does not exist");
        return RawMaterialStock[rawMaterialId];
    }

    function getSoldRawMaterial(uint256 soldRawMaterialId) public view returns (SharedStructs.SoldRawMaterial memory){
        return SoldRawMaterialStock[soldRawMaterialId];
    }

    function decreaseRawMaterial(uint256 rawMaterialId, uint256 quantity) public {
        // require(RawMaterialStockValidity[rawMaterialId] == true, "Raw Material does not exist");
        RawMaterialStock[rawMaterialId].quantity -= quantity;
    }

    function getUserUnsoldRawMaterialIds(address ethAddress) public view returns (uint256[] memory) {
        return userUnsoldRawMaterialIds[ethAddress];
    }

    function getUserSoldRawMaterialIds(address ethAddress) public view returns (uint256[] memory) {
        return userSoldRawMaterialIds[ethAddress];
    }

    function removeUnsoldRawMaterial(address ethAddress, uint256 rawMaterialId) public {
        uint256[] storage userRawMaterialIds = userUnsoldRawMaterialIds[ethAddress];
        for (uint256 i = 0; i < userRawMaterialIds.length; i++) {
            if (userRawMaterialIds[i] == rawMaterialId) {
                userRawMaterialIds[i] = userRawMaterialIds[userRawMaterialIds.length - 1];
                userRawMaterialIds.pop();
                break;
            }
		}
    }

    function addSoldRawMaterial(uint256 rawMaterialId, uint256 quantity,  SharedStructs.User memory manufacturingUser, SharedStructs.Transaction memory newTransaction, bool received) public returns (uint256) {
        soldRawMaterialCtr++;
		SharedStructs.SoldRawMaterial memory newSoldRawMaterial =  SharedStructs.SoldRawMaterial(soldRawMaterialCtr, RawMaterialStock[rawMaterialId], manufacturingUser, newTransaction, 0, received);
		newSoldRawMaterial.rawMaterial.quantity = quantity;
		SoldRawMaterialStock[soldRawMaterialCtr] = newSoldRawMaterial;
        userSoldRawMaterialIds[RawMaterialStock[rawMaterialId].registeringUser.ethAddress].push(soldRawMaterialCtr);
        return soldRawMaterialCtr;
    }

    function setRawMaterialProduct(uint256 soldRawMaterialId, uint256 productId) public {
        rawMaterialToProduct[soldRawMaterialId] = productId;
    }

    function getRawMaterialProduct(uint256 soldRawMaterialId) public view returns (uint256) {
        return rawMaterialToProduct[soldRawMaterialId];
    }

    function removeRawMaterial(uint256 rawMaterialId) public {
        delete RawMaterialStock[rawMaterialId];
        RawMaterialStockValidity[rawMaterialId] = false;
    }

    function setRawMaterialReceived(uint256 soldRawMaterialId) public {
        SoldRawMaterialStock[soldRawMaterialId].received = true;
        SoldRawMaterialStock[soldRawMaterialId].receivedTimestamp = block.timestamp;
    }

    function addSoldRawMaterialComment(uint256 soldRawMaterialId, string memory comment, uint256 rating) public {
        // require(main.getUser(googleIdHash).registered, "User not registered");
		// // require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to add raw material comment.");
		// require(SoldRawMaterialStock[soldRawMaterialId].received == true, "Raw Material does not exist");
        SharedStructs.Comment memory c = main.addComment(SoldRawMaterialStock[soldRawMaterialId].buyingUser, SoldRawMaterialStock[soldRawMaterialId].rawMaterial.registeringUser, comment, rating);
        SoldRawMaterialComments[soldRawMaterialId].push(c);
        RawMaterialComments[SoldRawMaterialStock[soldRawMaterialId].rawMaterial.id].push(c);
        manufacturerToRMSComments[keccak256(abi.encodePacked(SoldRawMaterialStock[soldRawMaterialId].buyingUser.ethAddress, soldRawMaterialId))] = c.id;
    }

    function getSoldRawMaterialComments(uint256 soldRawMaterialId) public view returns (SharedStructs.Comment[] memory) {
        return SoldRawMaterialComments[soldRawMaterialId];
    }

	function getRawMaterialComments(uint256 rawMaterialId) public view returns (SharedStructs.Comment[] memory){
        return RawMaterialComments[rawMaterialId];
    }

	function buyRawMaterial(uint256 rawMaterialId, uint256 quantity) public {
		// require(main.getUser(googleIdHash).registered, "User not registered");
		// require(main.getUser(googleIdHash).role == 1, "User must be manufacturer to buy raw materials.");
		// require(quantity > 0, "Quantity must be greater than 0.");
		// require(RMS.getRawMaterial(rawMaterialId).quantity >= quantity, "Not enough raw material in stock");
		// require(main.getUser(googleIdHash).ethAddress != RMS.getRawMaterial(rawMaterialId).registeringUser.ethAddress, "You cannot buy your own raw material");
		RawMaterialStock[rawMaterialId].quantity -= quantity;
		if (RawMaterialStock[rawMaterialId].quantity == 0) {
			removeUnsoldRawMaterial(RawMaterialStock[rawMaterialId].registeringUser.ethAddress, rawMaterialId);
    	}
	}

    function addManufacturerComment(SharedStructs.User memory from, SharedStructs.User memory to, string memory comment, uint256 rating, uint256 soldRawMaterialId) public {
        SharedStructs.Comment memory c = main.addComment(from, to, comment, rating);
        rmsToManufacturerComments[keccak256(abi.encodePacked(from.ethAddress, soldRawMaterialId))] = c.id;
    }

    function getToManufacturerCommentId(address ethAddress, uint256 soldRawMaterialId) public view returns (uint256) {
        return rmsToManufacturerComments[keccak256(abi.encodePacked(ethAddress, soldRawMaterialId))];
    }

    function getFromManufacturerCommentId(address ethAddress, uint256 soldRawMaterialId) public view returns (uint256){
        return manufacturerToRMSComments[keccak256(abi.encodePacked(ethAddress, soldRawMaterialId))];
    }
}