// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;
import "./SharedStructs.sol";

contract Main {
    mapping(uint256 => SharedStructs.Transaction) public Transactions;
    mapping(uint256 => SharedStructs.Comment) public Comments;
    mapping(bytes32 => SharedStructs.User) private googleIdToUser;
	mapping(address => SharedStructs.Transaction[]) private userTransactions;
    mapping(address => SharedStructs.Comment[]) private sentComments;
    mapping(address => SharedStructs.Comment[]) private receivedComments;
    mapping(address => uint256) private userTrustScores;
    mapping(uint256 => SharedStructs.Shipping) private transactionShippingDetails;
	uint256 public transactionCtr = 0;
	uint256 public userCtr = 0;
    uint256 public commentCtr = 0;

    function getUser(bytes32 googleIdHash) public view returns (SharedStructs.User memory){
        return googleIdToUser[googleIdHash];
    }

    function setUser(bytes32 googleIdHash, address ethAddress, string memory email, string memory username, string memory location, uint8 role, bool registered) public {
        userCtr++;
        googleIdToUser[googleIdHash] = SharedStructs.User(userCtr, ethAddress, email, username, location, role, registered);
        userTrustScores[ethAddress] = 5000000;
    }

    function getTransactions(address ethAddress) public view returns (SharedStructs.Transaction[] memory){
        return userTransactions[ethAddress];
    } 

    function addTransaction(SharedStructs.User memory from, SharedStructs.User memory to, uint256 timestamp, uint256 pricePerUnit, uint256 weightPerUnit, uint256 quantity, uint256 gasUsed, string memory description, bool status) public returns ( SharedStructs.Transaction memory) {
        transactionCtr++;
		Transactions[transactionCtr] = SharedStructs.Transaction(transactionCtr, from, to, timestamp, pricePerUnit, weightPerUnit,  quantity, gasUsed, description, status);
		userTransactions[from.ethAddress].push(Transactions[transactionCtr]);
        userTransactions[to.ethAddress].push(Transactions[transactionCtr]);
        return Transactions[transactionCtr];
    }

    function addShippingDetails(uint256 transactionId, string memory shippingPartner, uint256 partnerRating, uint256 estimatedTimeToDelivery, uint256 shippingCharges) public {
        transactionShippingDetails[transactionId] = SharedStructs.Shipping(Transactions[transactionId].pricePerUnit, Transactions[transactionId].weightPerUnit, Transactions[transactionId].quantity, Transactions[transactionId].pricePerUnit*Transactions[transactionId].quantity, Transactions[transactionId].weightPerUnit*Transactions[transactionId].quantity, shippingPartner, partnerRating, estimatedTimeToDelivery, shippingCharges);
    }

    function getShippingDetails(uint256 transactionId) public view returns (SharedStructs.Shipping memory) {
        return transactionShippingDetails[transactionId];
    }

    function addComment(SharedStructs.User memory from, SharedStructs.User memory to, string memory comment, uint256 rating) public returns (SharedStructs.Comment memory) {
        commentCtr++;
        Comments[commentCtr] = SharedStructs.Comment(commentCtr, block.timestamp, from, to, comment, rating);
        sentComments[from.ethAddress].push(Comments[commentCtr]);
        receivedComments[to.ethAddress].push(Comments[commentCtr]);
        return Comments[commentCtr];
    }

    function getComment(uint256 commentId) public view returns (SharedStructs.Comment memory){
        return Comments[commentId];
    }

    function getUserSentComments(address ethAddress) public view returns (SharedStructs.Comment[] memory){
        return sentComments[ethAddress];
    }

    function getUserReceivedComments(address ethAddress) public view returns (SharedStructs.Comment[] memory){
        return receivedComments[ethAddress];
    }

    function getUserTrustScore(address ethAddress) public view returns (uint256){
        return userTrustScores[ethAddress];
    }

    function setUserTrustScore(address ethAddress, uint256 newScore) public {
        userTrustScores[ethAddress] = newScore;
    }
}