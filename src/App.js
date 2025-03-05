import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import axios from "axios";
import { toast } from "react-hot-toast";
import { useGoogleLogin } from "@react-oauth/google";
import MainArtifact from './contracts/Main.json';
import UserManagementArtifact from './contracts/UserManagement.json';
import RawMaterialSupplierArtifact from './contracts/RawMaterialSupplier.json';
import ManufacturerArtifact from './contracts/Manufacturer.json';
import RequestManagementArtifact from './contracts/RequestManagement.json';
import ConsumerArtifact from './contracts/Consumer.json';
import ProductNFTArtifact from './contracts/ProductNFT.json';
import Home from './Home';
import Register from './Register';
import RMSDashboard from './RMSDashboard';
import ConsumerDashboard from './ConsumerDashboard';
import ManufacturerDashboard from './ManufacturerDashboard';
import Transactions from './Transactions';
import Comments from './Comments';
import ProductRawMaterials from './ProductRawMaterials';
import ViewNFT from './ViewNFT';
import ShippingDetails from './ShippingDetails';
import './App.css';
const {Web3} = require("web3");

function App() {
	const [web3, setWeb3] = useState(null);
	const [mainContract, setMainContract] = useState(null);
	const [userManagementContract, setUserManagementContract] = useState(null);
	const [rawMaterialSupplierContract, setRawMaterialSupplierContract] = useState(null);
	const [manufacturerContract, setManufacturerContract] = useState(null);
	const [requestManagementContract, setRequestManagementContract] = useState(null);
	const [consumerContract, setConsumerContract] = useState(null);
	const [productNFTContract, setProductNFTContract] = useState(null);
	const [googleId, setGoogleId] = useState(localStorage.getItem('googleId') || '');
	const [emailId, setEmailId] = useState(localStorage.getItem('emailId') || '');
	const [ethAccount, setEthAccount] = useState(localStorage.getItem('ethAccount') || '');
	const [username, setUsername] = useState(localStorage.getItem('username') || '');
	const [isRegistered, setIsRegistered] = useState(false);
	const [role, setRole] = useState(parseInt(localStorage.getItem('role')) || null);
	const navigate = useNavigate();

	useEffect(() => {
		const initBlockchain = async () => {
			const provider = new Web3.providers.HttpProvider('http://127.0.0.1:8545');
			const web3Instance = new Web3(provider);
			setWeb3(web3Instance);
			const networkId = await web3Instance.eth.net.getId();

			const mainDeployedNetwork = MainArtifact.networks[networkId];
			if (mainDeployedNetwork) {
				const mainContractInstance = new web3Instance.eth.Contract(
					MainArtifact.abi,
					mainDeployedNetwork.address
				);
				setMainContract(mainContractInstance);
			} else {
				console.error('Smart contract "Main" not deployed to the detected network.');
			}

			const userManagementDeployedNetwork = UserManagementArtifact.networks[networkId];
			if (userManagementDeployedNetwork) {
				const userManagementContractInstance = new web3Instance.eth.Contract(
					UserManagementArtifact.abi,
					userManagementDeployedNetwork.address
				);
				setUserManagementContract(userManagementContractInstance);
			} else {
				console.error('Smart contract "UserManagement" not deployed to the detected network.');
			}

			const rawMaterialSupplierDeployedNetwork = RawMaterialSupplierArtifact.networks[networkId];
			if (rawMaterialSupplierDeployedNetwork) {
				const rawMaterialSupplierContractInstance = new web3Instance.eth.Contract(
					RawMaterialSupplierArtifact.abi,
					rawMaterialSupplierDeployedNetwork.address
				);
				setRawMaterialSupplierContract(rawMaterialSupplierContractInstance);
			} else {
				console.error('Smart contract "RawMaterialSupplier" not deployed to the detected network.');
			}

			const manufacturerDeployedNetwork = ManufacturerArtifact.networks[networkId];
			if (manufacturerDeployedNetwork) {
				const manufacturerContractInstance = new web3Instance.eth.Contract(
					ManufacturerArtifact.abi,
					manufacturerDeployedNetwork.address
				);
				setManufacturerContract(manufacturerContractInstance);
			} else {
				console.error('Smart contract "Manufacturer" not deployed to the detected network.');
			}

			const requestManagementDeployedNetwork = RequestManagementArtifact.networks[networkId];
			if (requestManagementDeployedNetwork) {
				const requestManagementContractInstance = new web3Instance.eth.Contract(
					RequestManagementArtifact.abi,
					requestManagementDeployedNetwork.address
				);
				setRequestManagementContract(requestManagementContractInstance);
			} else {
				console.error('Smart contract "RequestManagement" not deployed to the detected network.');
			}

			const consumerDeployedNetwork = ConsumerArtifact.networks[networkId];
			if (consumerDeployedNetwork) {
				const consumerContractInstance = new web3Instance.eth.Contract(
					ConsumerArtifact.abi,
					consumerDeployedNetwork.address
				);
				setConsumerContract(consumerContractInstance);
			} else {
				console.error('Smart contract "Consumer" not deployed to the detected network.');
			}

			const productNFTDeployedNetwork = ProductNFTArtifact.networks[networkId];
			if (productNFTDeployedNetwork) {
				const productNFTContractInstance = new web3Instance.eth.Contract(
					ProductNFTArtifact.abi,
					productNFTDeployedNetwork.address
				);
				setProductNFTContract(productNFTContractInstance);
			} else {
				console.error('Smart contract "ProductNFT" not deployed to the detected network.');
			}
		};

		initBlockchain();
	}, []);

	useEffect(() => {
		if (googleId && userManagementContract) {
			checkRegistration();
		}
	}, [googleId, userManagementContract, isRegistered]);

	const checkRegistration = async () => {
		const googleIdHash = web3.utils.sha3(googleId);
		try {
			const currReg = await userManagementContract.methods.validateUser(googleIdHash).call();
			setIsRegistered(currReg);
			if (currReg) {
				const registeredUsername = await userManagementContract.methods.getUsername(googleIdHash).call();
				const registeredAccount = await userManagementContract.methods.getUserAddress(googleIdHash).call();
				const registeredRole = await userManagementContract.methods.getUserRole(googleIdHash).call();
				setUsername(registeredUsername);
				setEthAccount(registeredAccount);
				setRole(Number(registeredRole));
				localStorage.setItem('username', registeredUsername);
				localStorage.setItem('ethAccount', registeredAccount);
				localStorage.setItem('role', Number(registeredRole));
			}
		} catch (err) {
			console.error('Error checking registration:', err);
		}
	};

	const handleGoogleLogin = useGoogleLogin({
		onSuccess: (codeResponse) => {
			axios.get(
				`https://www.googleapis.com/oauth2/v1/userinfo? 
                   access_token=${codeResponse.access_token}`,
				{
					headers: {
						Authorization: `Bearer ${codeResponse.access_token}`,
						Accept: "application/json",
					},
				}).then((res) => {
					setGoogleId(res.data.id);
					localStorage.setItem('googleId', res.data.id);
					setEmailId(res.data.email);
					localStorage.setItem('emailId', res.data.email);
					toast.success('Google login successful.');
				}).catch((error) => {toast.error(`Failed to decode token:', ${error}. \n\n Please try again.`); console.log(error);})
		},
		onError: (error) => {toast.error(`Failed to decode token:', ${error}. \n\n Please try again.`); console.log(error);}
	});

	const logoutUser = () => {
		localStorage.clear();
		setGoogleId('');
		setEmailId('');
		setEthAccount('');
		setUsername('');
		setRole(null);
		setIsRegistered(false);
		setGoogleId('');
		navigate('/');
		toast.success('Logged out successfully.');
	};

	return (
		<div>
			<Routes>
				<Route
					path="/"
					element={
						<Home
							googleId={googleId}
							isRegistered={isRegistered}
							role={role}
							handleGoogleLogin = {handleGoogleLogin}
							logoutUser={logoutUser}
						/>
					}
				/>
				<Route
					path="/register"
					element={
						<Register
							web3={web3}
							contract={userManagementContract}
							googleId={googleId}
							emailId={emailId}
							role={role}
							setUsername={setUsername}
							setEthAccount={setEthAccount}
							setIsRegistered={setIsRegistered}
							setRole={setRole}
						/>
					}
				/>
				<Route
					path="/rms-dashboard"
					element={<RMSDashboard
						web3={web3}
						mainContract={mainContract}
						userManagementContract={userManagementContract}
						RMSContract={rawMaterialSupplierContract}
						manufacturerContract={manufacturerContract}
						productNFTContract={productNFTContract}
						username={username}
						emailId={emailId}
						googleId={googleId}
						ethAccount={ethAccount}
						logoutUser={logoutUser}
					/>}
				/>
				<Route
					path="/manufacturer-dashboard"
					element={<ManufacturerDashboard 
						web3 = {web3}
						mainContract = {mainContract}
						userManagementContract = {userManagementContract}
						RMSContract = {rawMaterialSupplierContract}
						manufacturerContract = {manufacturerContract}
						RMContract = {requestManagementContract}
						consumerContract={consumerContract}
						productNFTContract = {productNFTContract}
						ethAccount={ethAccount}
						googleId = {googleId}
						username={username}
						logoutUser={logoutUser}
						emailId = {emailId}
					/>}
				/>
				<Route
					path="/consumer-dashboard"
					element={<ConsumerDashboard 
						web3 = {web3}
						userManagementContract={userManagementContract}
						consumerContract={consumerContract}
						manufacturerContract = {manufacturerContract}
						RMContract = {requestManagementContract}
						mainContract = {mainContract}
						productNFTContract = {productNFTContract}
						googleId = {googleId}
						username = {username}
						ethAccount = {ethAccount}
						logoutUser = {logoutUser}
						emailId = {emailId}
					/>}
				/>
				<Route
					path="/transactions"
					element={
						<Transactions
						web3 = {web3}
						ethAccount = {ethAccount}
						mainContract = {mainContract}
						userManagementContract = {userManagementContract}
						/>
					}
				/>
				<Route
					path="/comments"
					element={
						<Comments
						web3 = {web3}
						ethAccount = {ethAccount}
						mainContract = {mainContract}
						userManagementContract = {userManagementContract}
						/>
					}
				/>
				<Route
					path="/view-raw-materials"
					element={
						<ProductRawMaterials
						web3 = {web3}
						ethAccount = {ethAccount}
						mainContract = {mainContract}
						userManagementContract = {userManagementContract}
						/>
					}
				/>
				<Route
					path="/view-nft"
					element={
						<ViewNFT
						/>
					}
				/>
				<Route
					path="/view-shipping-details"
					element={
						<ShippingDetails
						web3 = {web3}
						ethAccount = {ethAccount}
						mainContract = {mainContract}
						userManagementContract = {userManagementContract}
						/>
					}
				/>
			</Routes>
		</div>
	);
}

export default App;
