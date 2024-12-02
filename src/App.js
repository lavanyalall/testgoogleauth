import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Web3 from 'web3';
import GoogleAuthMappingArtifact from './GoogleAuthMapping.json';
import Register from './Register';
import Dashboard from './Dashboard';
import Track from './Track';
import './App.css';

function App() {
	const [web3, setWeb3] = useState(null);
	const [contract, setContract] = useState(null);
	const [googleId, setGoogleId] = useState(localStorage.getItem('googleId') || '');
	const [emailId, setEmailId] = useState(localStorage.getItem('emailId') || '');
	const [ethAccount, setEthAccount] = useState(localStorage.getItem('ethAccount') || '');
	const [username, setUsername] = useState(localStorage.getItem('username') || '');
	const [status, setStatus] = useState('');
	const [isRegistered, setIsRegistered] = useState(false);
	const [role, setRole] = useState(parseInt(localStorage.getItem('role')) || null);
	const [userProducts, setUserProducts] = useState(JSON.parse(localStorage.getItem('userProducts')) || []);
	const [allProducts, setAllProducts] = useState(JSON.parse(localStorage.getItem('allProducts')) || []);
	const navigate = useNavigate();

	useEffect(() => {
		const initBlockchain = async () => {
			const provider = new Web3.providers.HttpProvider('http://127.0.0.1:7545');
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
				console.error('Smart contract not deployed to the detected network.');
			}
		};

		initBlockchain();
	}, []);

	useEffect(() => {
		if (googleId && contract) {
			checkRegistration();
		}
	}, [googleId, contract]);

	const getProducts = async (ethAccount) => {
		const addedUserProducts = await contract.methods.getUserProducts(ethAccount).call();
		const addedAllProducts = await contract.methods.getAllProducts().call();

		setAllProducts(addedAllProducts);
		setUserProducts(addedUserProducts);
		localStorage.setItem('userProducts', JSON.stringify(addedUserProducts));
		console.log(localStorage.getItem('userProducts'));

		localStorage.setItem('allProducts', JSON.stringify(addedAllProducts));
		console.log(localStorage.getItem('allProducts'));
	}

	const checkRegistration = async () => {
		const googleIdHash = web3.utils.sha3(googleId);
		try {
			const isRegistered = await contract.methods.validateUser(googleIdHash).call();
			setIsRegistered(isRegistered);
			if (isRegistered) {
				const registeredUsername = await contract.methods.getUsername(googleIdHash).call();
				const registeredAccount = await contract.methods.getUserAddress(googleIdHash).call();
				const registeredRole = await contract.methods.getRole(googleIdHash).call();
				setUsername(registeredUsername);
				setEthAccount(registeredAccount);
				setRole(registeredRole);
				localStorage.setItem('username', registeredUsername);
				localStorage.setItem('ethAccount', registeredAccount);
				localStorage.setItem('role', registeredRole);
				await getProducts(registeredAccount);
			}
		} catch (err) {
			console.error('Error checking registration:', err);
		}
	};

	const handleGoogleLoginSuccess = (response) => {
		try {
			const decoded = jwtDecode(response.credential);
			setGoogleId(decoded.sub);
			localStorage.setItem('googleId', decoded.sub);
			setEmailId(decoded.email);
			localStorage.setItem('emailId', decoded.emailId);
			setStatus('Google login successful.');
		} catch (error) {
			console.error('Failed to decode token:', error);
			setStatus('Google login failed. Try again.');
		}
	};

	const handleGoogleLoginFailure = (response) => {
		console.error('Google login failed:', response);
		setStatus('Google login failed. Try again.');
	};

	const logoutUser = () => {
		localStorage.clear();
		setGoogleId('');
		setEmailId('');
		setEthAccount('');
		setUsername('');
		setRole(null);
		setUserProducts([]);
		setAllProducts([]);
		setIsRegistered(false);
		navigate('/');
		setStatus('Logged out successfully.');
	};

	return (
		<div>
			<Routes>
				<Route
					path="/"
					element={
						<div>
							<h1>CraftChain Commerce</h1>
							<h4>E-Marketplace for Artisans using Blockchain</h4>
							<p>Discover a world of unique, handmade creations directly from talented artisans across the globe. We are committed to empowering artisans by providing a platform that celebrates their creativity and craftsmanship. Every purchase supports these skilled creators and helps preserve traditional arts. Explore our curated collection of authentic, handmade  products crafted by skilled artisans. Each piece is a work of art, carrying the story and tradition of its maker. Support artisans and find something truly special. Behind every product is a story, a craft, and a talented artisan who brings it to life. At CraftChain Commerce, we celebrate the incredible skills and creativity of artisans from around the world. Each piece you see here is the result of dedication, passion, and tradition passed down through generations.</p>
							<p className='status'>Status: {status}</p>
							<div className='btn-cont'>
								{!googleId ? (
									<GoogleLogin
										buttonText="Sign in with Google"
										onSuccess={handleGoogleLoginSuccess}
										onFailure={handleGoogleLoginFailure}
									/>
								) : (
									<button onClick={logoutUser}>Logout</button>
								)}
									{!isRegistered && googleId && (
										<button onClick={() => navigate('/register')}>Register</button>
									)}
									{isRegistered && googleId && (
										<>
											<button onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
											<button onClick={() => navigate('/track')}>Track a Product</button>
										</>
									)}
							</div>
						</div>
					}
				/>
				<Route
					path="/register"
					element={
						<Register
							web3={web3}
							contract={contract}
							googleId={googleId}
							emailId={emailId}
							setUsername={setUsername}
							setEthAccount={setEthAccount}
							setIsRegistered={setIsRegistered}
							setStatus={setStatus}
							setRole={setRole}
							setAllProducts={setAllProducts}
							setUserProducts={setUserProducts}
						/>
					}
				/>
				<Route
					path="/dashboard"
					element={
						<Dashboard
							web3={web3}
							contract={contract}
							username={username}
							ethAccount={ethAccount}
							googleId={googleId}
							emailId={emailId}
							setStatus={setStatus}
							logoutUser={logoutUser}
							status={status}
							role={role}
							userProducts={userProducts}
							allProducts={allProducts}
							setAllProducts = {setAllProducts}
							setUserProducts = {setUserProducts}
						/>
					}
				/>
				<Route
					path="/track"
					element={
						<Track
							web3={web3}
							ethAccount={ethAccount}
							contract={contract}
						/>
					}
				/>
			</Routes>
		</div>
	);
}

export default App;
