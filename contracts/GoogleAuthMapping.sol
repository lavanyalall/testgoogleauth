// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
pragma experimental ABIEncoderV2;

contract GoogleAuthMapping {
    struct User {
        address ethAddress;
		string email;
        string username;
        string location;
        uint8 role; // 0: Raw Material Supplier, 1: Manufacturer, 2: Distributor, 3: Retailer
        bool registered;
    }

    struct Product {
        uint256 id;
        string name;
        uint256 quantity;
        string registeredByEmail;
		string description; //about product
        uint256 RMSid; //id of the Raw Material supplier for this particular product
        uint256 MANid; //id of the Manufacturer for this particular product
        uint256 DISid; //id of the distributor for this particular product
        uint256 RETid; //id of the retailer for this particular product
        STAGE stage; //current product stage
    }

	//To store information about raw material supplier
    struct rawMaterialSupplier {
        address addr;
        uint256 id; //supplier id
        string name; //Name of the raw material supplier
        string place; //Place the raw material supplier is based in
    }

    //To store all the raw material suppliers on the blockchain
    mapping(uint256 => rawMaterialSupplier) public RMS;

    //To store information about manufacturer
    struct manufacturer {
        address addr;
        uint256 id; //manufacturer id
        string name; //Name of the manufacturer
        string place; //Place the manufacturer is based in
    }

    //To store all the manufacturers on the blockchain
    mapping(uint256 => manufacturer) public MAN;

    //To store information about distributor
    struct distributor {
        address addr;
        uint256 id; //distributor id
        string name; //Name of the distributor
        string place; //Place the distributor is based in
    }

    //To store all the distributors on the blockchain
    mapping(uint256 => distributor) public DIS;

    //To store information about retailer
    struct retailer {
        address addr;
        uint256 id; //retailer id
        string name; //Name of the retailer
        string place; //Place the retailer is based in
    }

    //To store all the retailers on the blockchain
    mapping(uint256 => retailer) public RET;

	//stages of supply chain
    enum STAGE {
        Init,
        RawMaterialSupply,
        Manufacture,
        Distribution,
        Retail,
        sold
    }

    mapping(bytes32 => User) private googleIdToUser;
    Product[] private products;
    mapping(address => uint256[]) private userProductIds;

	//To store all the products on the blockchain
	mapping(uint256 => Product) public ProductStock;

	//Product count
    uint256 public productCtr = 0;
    //Raw material supplier count
    uint256 public rmsCtr = 0;
    //Manufacturer count
    uint256 public manCtr = 0;
    //distributor count
    uint256 public disCtr = 0;
    //retailer count
    uint256 public retCtr = 0;

    event UserRegistered(bytes32 indexed googleIdHash, address ethAddress, string email, string username, string location, uint8 role);
    event ProductAdded(uint256 productId, string name, uint256 quantity, string registeredByEmail);

	 //To add raw material suppliers. Only contract owner can add a new raw material supplier
    function addRMS(
        address _address,
        string memory _name,
        string memory _place
    ) public {
        rmsCtr++;
        RMS[rmsCtr] = rawMaterialSupplier(_address, rmsCtr, _name, _place);
    }

    //To add manufacturer. Only contract owner can add a new manufacturer
    function addManufacturer(
        address _address,
        string memory _name,
        string memory _place
    ) public {
        manCtr++;
        MAN[manCtr] = manufacturer(_address, manCtr, _name, _place);
    }

    //To add distributor. Only contract owner can add a new distributor
    function addDistributor(
        address _address,
        string memory _name,
        string memory _place
    ) public {
        disCtr++;
        DIS[disCtr] = distributor(_address, disCtr, _name, _place);
    }

    //To add retailer. Only contract owner can add a new retailer
    function addRetailer(
        address _address,
        string memory _name,
        string memory _place
    ) public {
        retCtr++;
        RET[retCtr] = retailer(_address, retCtr, _name, _place);
    }

    function registerUser(
        bytes32 googleIdHash,
		string memory email,
        address ethAddress,
        string memory username,
        string memory location,
        uint8 role
    ) public {
        require(!googleIdToUser[googleIdHash].registered, "User already registered");
        googleIdToUser[googleIdHash] = User(ethAddress, email, username, location, role, true);
		if(role == 0){
			addRMS(ethAddress, username, location);
		}
		else if(role == 1){
			addManufacturer(ethAddress, username, location);
		}
		else if(role == 2){
			addDistributor(ethAddress, username, location);
		}
		else if(role == 3){
			addRetailer(ethAddress, username, location);
		}
        emit UserRegistered(googleIdHash, ethAddress, email, username, location, role);
    }

    function validateUser(bytes32 googleIdHash) public view returns (bool) {
        return googleIdToUser[googleIdHash].registered;
    }

    function getUserAddress(bytes32 googleIdHash) public view returns (address) {
        require(googleIdToUser[googleIdHash].registered, "User not registered");
        return googleIdToUser[googleIdHash].ethAddress;
    }

    function getUsername(bytes32 googleIdHash) public view returns (string memory) {
        require(googleIdToUser[googleIdHash].registered, "User not registered");
        return googleIdToUser[googleIdHash].username;
    }

	function getRole(bytes32 googleIdHash) public view returns (uint8) {
    require(googleIdToUser[googleIdHash].registered, "User not registered");
    return googleIdToUser[googleIdHash].role;
	}

    function addProduct(string memory name, uint256 quantity, string memory registeredByEmail, string memory description) public {
        require(quantity > 0, "Quantity must be greater than 0");
        productCtr++;
		Product memory p = Product(productCtr, name, quantity, registeredByEmail, description, 0,
            0,
            0,
            0,
            STAGE.Init);
		ProductStock[productCtr] = p;
        products.push(p);
        userProductIds[msg.sender].push(productCtr);
        emit ProductAdded(productCtr, name, quantity, registeredByEmail);
    }

    function getAllProducts() public view returns (Product[] memory) {
        return products;
    }

    function getUserProducts(address user) public view returns (Product[] memory) {
        uint256[] memory productIds = userProductIds[user];
        Product[] memory userProducts = new Product[](productIds.length);

        for (uint256 i = 0; i < productIds.length; i++) {
            userProducts[i] = products[productIds[i] - 1];
        }
        return userProducts;
    }

	//To supply raw materials from RMS supplier to the manufacturer
    function RMSsupply(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findRMS(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.Init);
        ProductStock[_productID].RMSid = _id;
        ProductStock[_productID].stage = STAGE.RawMaterialSupply;
    }

    //To check if RMS is available in the blockchain
    function findRMS(address _address) private view returns (uint256) {
        require(rmsCtr > 0);
        for (uint256 i = 1; i <= rmsCtr; i++) {
            if (RMS[i].addr == _address) return RMS[i].id;
        }
        return 0;
    }

    //To manufacture product
    function Manufacturing(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findMAN(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.RawMaterialSupply);
        ProductStock[_productID].MANid = _id;
        ProductStock[_productID].stage = STAGE.Manufacture;
    }

    //To check if Manufacturer is available in the blockchain
    function findMAN(address _address) private view returns (uint256) {
        require(manCtr > 0);
        for (uint256 i = 1; i <= manCtr; i++) {
            if (MAN[i].addr == _address) return MAN[i].id;
        }
        return 0;
    }

    //To supply products from Manufacturer to distributor
    function Distribute(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findDIS(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.Manufacture);
        ProductStock[_productID].DISid = _id;
        ProductStock[_productID].stage = STAGE.Distribution;
    }

    //To check if distributor is available in the blockchain
    function findDIS(address _address) private view returns (uint256) {
        require(disCtr > 0);
        for (uint256 i = 1; i <= disCtr; i++) {
            if (DIS[i].addr == _address) return DIS[i].id;
        }
        return 0;
    }

    //To supply products from distributor to retailer
    function Retail(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(ProductStock[_productID].stage == STAGE.Distribution);
        ProductStock[_productID].RETid = _id;
        ProductStock[_productID].stage = STAGE.Retail;
    }

    //To check if retailer is available in the blockchain
    function findRET(address _address) private view returns (uint256) {
        require(retCtr > 0);
        for (uint256 i = 1; i <= retCtr; i++) {
            if (RET[i].addr == _address) return RET[i].id;
        }
        return 0;
    }

    //To sell products from retailer to consumer
    function sold(uint256 _productID) public {
        require(_productID > 0 && _productID <= productCtr);
        uint256 _id = findRET(msg.sender);
        require(_id > 0);
        require(_id == ProductStock[_productID].RETid); //Only correct retailer can mark product as sold
        require(ProductStock[_productID].stage == STAGE.Retail);
        ProductStock[_productID].stage = STAGE.sold;
    }

    //To show status to client applications
    function showStage(uint256 _productID)
        public
        view
        returns (string memory)
    {
        require(productCtr > 0);
        if (ProductStock[_productID].stage == STAGE.Init)
            return "Product Ordered";
        else if (ProductStock[_productID].stage == STAGE.RawMaterialSupply)
            return "Raw Material Supply Stage";
        else if (ProductStock[_productID].stage == STAGE.Manufacture)
            return "Manufacturing Stage";
        else if (ProductStock[_productID].stage == STAGE.Distribution)
            return "Distribution Stage";
        else if (ProductStock[_productID].stage == STAGE.Retail)
            return "Retail Stage";
        else if (ProductStock[_productID].stage == STAGE.sold)
            return "Product Sold";
    }

}
