import './App.css';
import { useState, useEffect } from 'react';
import {jwtDecode} from "jwt-decode";
import { GoogleLogin } from "@react-oauth/google";
import Web3 from "web3";
import GoogleAuthMappingArtifact from "./GoogleAuthMapping.json";


function App() {
	const [web3, setWeb3] = useState(null);
	const [contract, setContract] = useState(null);
	const [googleId, setGoogleId] = useState("");
	const [ethAccount, setEthAccount] = useState("");
	const [status, setStatus] = useState("");
	const [productName, setProductName] = useState("");
	const [productQuantity, setProductQuantity] = useState("");
	const [products, setProducts] = useState([]);
	const [registeredEthAccount, setRegisteredEthAccount] = useState("");

	useEffect(() => {
		const initBlockchain = async () => {
		  const provider = new Web3.providers.HttpProvider("http://127.0.0.1:7545");
		  const web3Instance = new Web3(provider);
		  setWeb3(web3Instance);
	
		  const networkId = await web3Instance.eth.net.getId();
		  const deployedNetwork = GoogleAuthMappingArtifact.networks[networkId];
	
		  if (deployedNetwork) {
			const contractInstance = new web3Instance.eth.Contract(
			  GoogleAuthMappingArtifact.abi,
			  deployedNetwork.address
			);
			setContract(contractInstance);
		  } else {
			console.error("Smart contract not deployed to the detected network.");
		  }
		};
	
		initBlockchain();
	  }, []);
	
	const handleGoogleLoginSuccess = (response) => {
	  try {
		const decoded = jwtDecode(response.credential);
		console.log(decoded); // Contains user info such as email, sub (Google ID), etc.
		setGoogleId(decoded.sub); // 'sub' is the unique Google ID
		setStatus("Google login successful. You can now register or login.");
	  } catch (error) {
		console.error("Failed to decode token:", error);
		setStatus("Google login failed. Please try again.");
	  }
	};
	
	
	  const handleGoogleLoginFailure = (response) => {
		console.error("Google login failed:", response);
		setStatus("Google login failed. Please try again.");
	  };
	
	  const hashGoogleId = (id) => {
		return web3.utils.sha3(id);
	  };
	
	  const registerUser = async () => {
		if (!googleId) {
		  setStatus("Please log in with Google first.");
		  return;
		}
	
		setStatus("Registering user...");
		const googleIdHash = hashGoogleId(googleId);
	
		try {
		  const accounts = await web3.eth.getAccounts();
		  const fundingAccount = accounts[0]; // Ganache-funded account
	
		  // Create a new Ethereum account
		  const newAccount = web3.eth.accounts.create();
		  setEthAccount(newAccount.address);
	
		  // Pre-fund the new account
		  await web3.eth.sendTransaction({
			from: fundingAccount,
			to: newAccount.address,
			value: web3.utils.toWei("1", "ether"),
		  });
	
		  // Register on the blockchain
		  await contract.methods
			.registerUser(googleIdHash, newAccount.address)
			.send({ from: fundingAccount });
	
		  setStatus("Registration successful!");
		} catch (err) {
		  console.error(err);
		  setStatus("Error during registration. Check the console for details.");
		}
	  };
	
	  const loginUser = async () => {
		if (!googleId) {
		  setStatus("Please log in with Google first.");
		  return;
		}
	
		setStatus("Logging in...");
		const googleIdHash = hashGoogleId(googleId);
	
		try {
		  const isRegistered = await contract.methods.validateUser(googleIdHash).call();
	
		  if (isRegistered) {
			const ethAddress = await contract.methods.getUserAddress(googleIdHash).call();
			setRegisteredEthAccount(ethAddress);
			setStatus("Login successful! Ethereum account retrieved.");
			fetchProducts()
		  } else {
			setStatus("No registration found for this Google account.");
		  }
		} catch (err) {
		  console.error(err);
		  setStatus("Error during login. Check the console for details.");
		}
	  };
	
	  const addProduct = async () => {
		if (!productName || !productQuantity || isNaN(productQuantity) || productQuantity <= 0) {
		  setStatus("Please provide a valid product name and quantity.");
		  return;
		}
	
		try {
		  const accounts = await web3.eth.getAccounts();
		  const currentAccount = accounts[0];
	
		  await contract.methods
			.addProduct(productName, productQuantity)
			.send({ from: currentAccount , gas: '210000'});
	
		  setStatus("Product added successfully!");
		  fetchProducts();
		} catch (err) {
		  console.error(err);
		  setStatus("Error adding product. Check the console for details.");
		}
	  };
	
	  const fetchProducts = async () => {
		try {
		  const accounts = await web3.eth.getAccounts();
		  const currentAccount = accounts[0];
	
		  const userProducts = await contract.methods.getProducts().call({ from: currentAccount });
		  console.log(userProducts);
		  setProducts(userProducts);
		} catch (err) {
		  console.error(err);
		  setStatus("Error fetching products. Check the console for details.");
		}
	  };
	
	  return (
		<div>
		  <h1>Google Auth DApp</h1>
		  <GoogleLogin
			buttonText="Login with Google"
			onSuccess={handleGoogleLoginSuccess}
			onFailure={handleGoogleLoginFailure}
		  />
		  <div>
			<button onClick={registerUser}>Register</button>
			<button onClick={loginUser}>Login</button>
		  </div>
		  <div>
			<h2>Add Product</h2>
			<input
			  type="text"
			  placeholder="Product Name"
			  value={productName}
			  onChange={(e) => setProductName(e.target.value)}
			/>
			<input
			  type="number"
			  placeholder="Quantity"
			  value={productQuantity}
			  onChange={(e) => setProductQuantity(e.target.value)}
			/>
			<button onClick={addProduct}>Add Product</button>
		  </div>
		  <div>
			<h2>Registered Products</h2>
			<table>
			  <thead>
				<tr>
				  <th>ID</th>
				  <th>Name</th>
				  <th>Quantity</th>
				</tr>
			  </thead>
			  <tbody>
				{products.map((product) => (
				  <tr key={product.id}>
					<td>{String(product.id)}</td>
					<td>{product.name}</td>
					<td>{String(product.quantity)}</td>
				  </tr>
				))}
			  </tbody>
			</table>
		  </div>
		  <p>Status: {status}</p>
		  {ethAccount && <p>New Ethereum Account: {ethAccount}</p>}
		  {registeredEthAccount && <p>Registered Ethereum Account: {registeredEthAccount}</p>}
		</div>	
  );
}

export default App;
