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
    mapping(address => ProductToken[]) public ownedProducts;
    mapping(uint256 => bool) public tokenExists;
    mapping(uint256 => uint256[]) public productToToken;

    constructor()
        ERC721("ProductNFT", "PNFT") //Ownable(msg.sender)
    {}

    function manufactureProduct(
        string memory metadataURI,
        uint256 productId,
        uint256 quantity,
        SharedStructs.User memory manufacturer
    ) public {
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
            ownedProducts[manufacturer.ethAddress].push(
                productTokens[newTokenId]
            );
            tokenExists[newTokenId] = true;
            productToToken[productId].push(newTokenId);
        }
    }

    function buyProduct(
        uint256 productId,
        uint256 quantity,
        address manufacturerAddress,
        SharedStructs.User memory consumer
    ) public {
        for (uint256 i = 0; i < quantity; i++) {
            uint256 tokenId = productToToken[productId][i];
            for (
                uint256 j = 0;
                j < ownedProducts[manufacturerAddress].length;
                j++
            ) {
                require(tokenExists[tokenId] == true, "Product does not exist");
                require(
                    productTokens[tokenId].isBought == false,
                    "Product already bought"
                );
                if (ownedProducts[manufacturerAddress][j].tokenId == tokenId) {
                    ownedProducts[manufacturerAddress][j] = ownedProducts[
                        manufacturerAddress
                    ][ownedProducts[manufacturerAddress].length - 1];
                    ownedProducts[manufacturerAddress].pop();
                    break;
                }
            }
            _transfer(manufacturerAddress, consumer.ethAddress, tokenId);
            productTokens[tokenId].consumer = consumer;
            productTokens[tokenId].isBought = true;
            ownedProducts[consumer.ethAddress].push(productTokens[tokenId]);
            productToToken[productId][i] = productToToken[productId][productToToken[productId].length - 1];
            productToToken[productId].pop();
        }
    }

    function getProductNFT(uint256 productId)
        public
        view
        returns (ProductToken[] memory)
    {
        ProductToken[] memory p = new ProductToken[](productToToken[productId].length);
        for(uint256 i = 0; i < productToToken[productId].length; i++){
            p[i] = productTokens[productToToken[productId][i]];
        }
        return p;
    }

    function getUserNFTs(address ethAddress)
        public
        view
        returns (ProductToken[] memory)
    {
        return ownedProducts[ethAddress];
    }
}
