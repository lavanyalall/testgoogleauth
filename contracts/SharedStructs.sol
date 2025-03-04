// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

library SharedStructs {
    struct User {
        uint256 id;
        address ethAddress;
		string email;
        string username;
        string location;
        uint8 role; // 0: Raw Material Supplier, 1: Manufacturer, 2: Consumer
        bool registered;
    }
	
	struct Shipping{
		uint256 pricePerUnit;
		uint256 weightPerUnit;
		uint256 quantity;
		uint256 totalPrice;
		uint256 totalWeight;
		string shippingPartner;
		uint256 partnerRating;
		uint256 estimatedTimeToDelivery;
		uint256 shippingCharges;
	}
	
    struct Transaction{
		uint256 id;
		User from;
		User to;
		uint256 timestamp;
		uint256 pricePerUnit;
		uint256 weightPerUnit;
		uint256 quantity;
		uint256 gasUsed;
		string description;
		bool status;
	}

    struct RawMaterial{
		uint256 id;
		uint256 timestamp;
		string name;
		uint256 quantity;
		string description;
		uint256 pricePerUnit;
		uint256 weightPerUnit;
		User registeringUser;
	}

	struct SoldRawMaterial{
		uint256 id;
		RawMaterial rawMaterial;
		User buyingUser;
		Transaction transaction;
		uint256 receivedTimestamp;
		bool received;
	}

    struct Product {
		uint256 id;
		uint256 timestamp;
        string name;
		uint256 quantity;
		string description;
		uint256 pricePerUnit;
		uint256 weightPerUnit;
		User manufacturingUser;
		uint256 manufacturedTimestamp;
		bool manufactured;
    }

	struct SoldProduct{
		uint256 id;
		Product product;
		User buyingUser;
		Transaction transaction;
		uint256 receivedTimestamp;
		bool received;
	}

    struct Request{
		uint256 id;
		Product product;
		User requestingUser;
		uint256 timestamp;
		uint256 quantity;
		uint8 status; // 0: pending, 1: accepted, 2: rejected 3: fulfilled
	}

	struct Comment{
		uint256 id;
		uint256 timestamp;
		User from;
		User to;
		string comment;
		uint256 rating;
	}

	function uint2str(uint _i) internal pure returns (string memory _uintAsString) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k-1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
}