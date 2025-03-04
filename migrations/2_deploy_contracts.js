const Main = artifacts.require("Main");
const RawMaterialSupplier = artifacts.require("RawMaterialSupplier");
const Manufacturer = artifacts.require("Manufacturer");
const SharedStructs = artifacts.require("SharedStructs");
const RequestManagement = artifacts.require("RequestManagement");
const UserManagement = artifacts.require("UserManagement");
const Consumer = artifacts.require("Consumer");
const ProductNFT = artifacts.require("ProductNFT");

module.exports = async function (deployer) {
	await deployer.deploy(SharedStructs);
    await deployer.deploy(Main);
    const main = await Main.deployed();
	await deployer.deploy(UserManagement, main.address);
    await deployer.deploy(RawMaterialSupplier, main.address);
    const rms = await RawMaterialSupplier.deployed();
    await deployer.deploy(Manufacturer, main.address, rms.address);
	const manufacturer = await Manufacturer.deployed();
	await deployer.deploy(RequestManagement, main.address, manufacturer.address);
	const rm = await RequestManagement.deployed();
	await deployer.deploy(Consumer, main.address, manufacturer.address, rm.address);
	await deployer.deploy(ProductNFT);
	const productNFT = await ProductNFT.deployed();
};