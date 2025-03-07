// SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;

// import "./SharedStructs.sol";
// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
// // import "@openzeppelin/contracts/access/Ownable.sol";

// contract ProductNFT is ERC721URIStorage
// // ,Ownable 
// {
//     uint256 private _tokenIdCounter;
//     SharedStructs.User emptyConsumer = SharedStructs.User(0, address(0), "", "", "", 5, false);
    
//     struct ProductToken {
//         uint256 tokenId;
//         SharedStructs.User manufacturer;
//         SharedStructs.User consumer;
//         string metadataURI;
//         bool isBought;
//     }

//     mapping(uint256 => ProductToken) public productTokens;
//     mapping(address => ProductToken[]) public ownedProducts;
//     mapping(uint256 => bool) public tokenExists;
//     mapping(uint256 => uint256) public productToToken;

//     constructor() ERC721("ProductNFT", "PNFT") 
//     //Ownable(msg.sender) 
//     {}

//     function manufactureProduct(string memory metadataURI, uint256 productId, SharedStructs.User memory manufacturer) public {
//         _tokenIdCounter++;
//         uint256 newTokenId = _tokenIdCounter;
//         _safeMint(manufacturer.ethAddress, newTokenId);
//         _setTokenURI(newTokenId, metadataURI);
//         productTokens[newTokenId] = ProductToken({
//             tokenId: newTokenId,
//             manufacturer: manufacturer,
//             consumer: emptyConsumer,
//             metadataURI: metadataURI,
//             isBought: false
//         });

//         ownedProducts[manufacturer.ethAddress].push(productTokens[newTokenId]);
//         tokenExists[newTokenId] = true;
//         productToToken[productId] = newTokenId;
//     }

//     function buyProduct(uint256 tokenId, SharedStructs.User memory consumer) public {
//         require(tokenExists[tokenId] == true, "Product does not exist");
//         require(productTokens[tokenId].isBought == false, "Product already bought");

//         address manufacturer = productTokens[tokenId].manufacturer.ethAddress;
//         for(uint256 i = 0; i < ownedProducts[manufacturer].length; i++){
//             if(ownedProducts[manufacturer][i].tokenId == tokenId){
//                 ownedProducts[manufacturer][i] = ownedProducts[manufacturer][ownedProducts[manufacturer].length - 1];
//                 ownedProducts[manufacturer].pop();
//                 break;
//             }
//         }
//         _transfer(manufacturer, consumer.ethAddress, tokenId);
// 		 productTokens[tokenId].consumer = consumer;
//         productTokens[tokenId].isBought = true;
//         ownedProducts[consumer.ethAddress].push(productTokens[tokenId]);
//     }

//     function getProductNFT(uint256 productId) public view returns (ProductToken memory){
//         return productTokens[productToToken[productId]];
//     }

//     function getUserNFTs(address ethAddress) public view returns (ProductToken[] memory){
//         return ownedProducts[ethAddress];
//     }
// }


pragma solidity ^0.8.20;

import "./SharedStructs.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

// import "@openzeppelin/contracts/access/Ownable.sol";

contract ProductNFT is
    ERC721URIStorage
    // ,Ownable
{
    uint256 private _tokenIdCounter;
    SharedStructs.User emptyConsumer =
    SharedStructs.User(0, address(0), "", "", "", 5, false);

    struct ProductToken {
        uint256 tokenId;
        SharedStructs.User manufacturer;
        SharedStructs.User consumer;
        string metadataURI;
        bool isBought;
    }

    mapping(uint256 => ProductToken) public productTokens;
    mapping(address => uint256[]) public ownedProducts;
    mapping(uint256 => bool) public tokenExists;
    mapping(uint256 => uint256[]) public unsoldProductToToken;
    mapping(uint256 => uint256[]) public soldProductToToken;
    mapping(uint256 => uint256[]) public fulfilledRequestToToken;
    mapping(uint256 => uint256[]) public soldRawMaterialToToken;

    constructor()
        ERC721("ProductNFT", "PNFT") //Ownable(msg.sender)
    {}

    function manufactureProduct(string memory metadataURI, uint256 productId, uint256 quantity, uint256[] memory soldRawMaterialIds, SharedStructs.User memory manufacturer) public {
        for (uint256 i = 0; i < quantity; i++) {
            _tokenIdCounter++;
            uint256 newTokenId = _tokenIdCounter;
            _safeMint(manufacturer.ethAddress, newTokenId);
            _setTokenURI(newTokenId, metadataURI);
            productTokens[newTokenId] = ProductToken({
                tokenId: newTokenId,
                manufacturer: manufacturer,
                consumer: emptyConsumer,
                metadataURI: metadataURI,
                isBought: false
            });
            ownedProducts[manufacturer.ethAddress].push(newTokenId);
            tokenExists[newTokenId] = true;
            unsoldProductToToken[productId].push(newTokenId);
            for(uint256 j = 0; j < soldRawMaterialIds.length; j++){
                soldRawMaterialToToken[soldRawMaterialIds[j]].push(newTokenId);
            }
        }
    }

    function buyProduct(uint256 productId, uint256 soldProductId, uint256 requestId, uint256 quantity, address manufacturerAddress, SharedStructs.User memory consumer) public {
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = unsoldProductToToken[productId][i];
            for (uint256 j = 0; j < ownedProducts[manufacturerAddress].length; j++) {
                require(tokenExists[tokenId] == true, "Product does not exist");
                require(productTokens[tokenId].isBought == false, "Product already bought");
                if (ownedProducts[manufacturerAddress][j] == tokenId) {
                    ownedProducts[manufacturerAddress][j] = ownedProducts[manufacturerAddress][ownedProducts[manufacturerAddress].length - 1];
                    ownedProducts[manufacturerAddress].pop();
                    break;
                }
            }
            _transfer(manufacturerAddress, consumer.ethAddress, tokenId);
            productTokens[tokenId].consumer = consumer;
            productTokens[tokenId].isBought = true;
            ownedProducts[consumer.ethAddress].push(tokenId);
            soldProductToToken[soldProductId].push(tokenId);
            fulfilledRequestToToken[requestId].push(tokenId);
            unsoldProductToToken[productId][i] = unsoldProductToToken[productId][unsoldProductToToken[productId].length - 1];
            unsoldProductToToken[productId].pop();
        }
    }

    function getUnsoldProductNFT(uint256 productId) public view returns (ProductToken[] memory) {
        ProductToken[] memory p = new ProductToken[](unsoldProductToToken[productId].length);
        for(uint256 i = 0; i < unsoldProductToToken[productId].length; i++){
            p[i] = productTokens[unsoldProductToToken[productId][i]];
        }
        return p;
    }

     function getSoldProductNFT(uint256 soldProductId) public view returns (ProductToken[] memory) {
        ProductToken[] memory p = new ProductToken[](soldProductToToken[soldProductId].length);
        for(uint256 i = 0; i < soldProductToToken[soldProductId].length; i++){
            p[i] = productTokens[soldProductToToken[soldProductId][i]];
        }
        return p;
    }

     function getSoldRawMaterialProductNFT(uint256 soldRawMaterialId) public view returns (ProductToken[] memory) {
        ProductToken[] memory p = new ProductToken[](soldRawMaterialToToken[soldRawMaterialId].length);
        for(uint256 i = 0; i < soldRawMaterialToToken[soldRawMaterialId].length; i++){
            p[i] = productTokens[soldRawMaterialToToken[soldRawMaterialId][i]];
        }
        return p;
    }

     function getFulfilledRequestProductNFT(uint256 requestId) public view returns (ProductToken[] memory) {
        ProductToken[] memory p = new ProductToken[](fulfilledRequestToToken[requestId].length);
        for(uint256 i = 0; i < fulfilledRequestToToken[requestId].length; i++){
            p[i] = productTokens[fulfilledRequestToToken[requestId][i]];
        }
        return p;
    }

    function getUserNFTs(address ethAddress) public view returns (ProductToken[] memory) {
        ProductToken[] memory p = new ProductToken[](ownedProducts[ethAddress].length);
        for(uint256 i = 0; i < ownedProducts[ethAddress].length; i++){
            p[i] = productTokens[ownedProducts[ethAddress][i]];
        }
        return p;
    }
}