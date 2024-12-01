// App.js
import './App.css';
import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import Web3 from 'web3';
import GoogleAuthMappingArtifact from './GoogleAuthMapping.json';
import Register from './Register';
import Dashboard from './Dashboard';
import Track from './Track';

function App() {
	const [web3, setWeb3] = useState(null);
	const [contract, setContract] = useState(null);
	const [googleId, setGoogleId] = useState(localStorage.getItem('googleId') || '');
	const [emailId, setEmailId] = useState(localStorage.getItem('emailId') || '');
	const [ethAccount, setEthAccount] = useState(localStorage.getItem('ethAccount') || '');
	const [username, setUsername] = useState(localStorage.getItem('username') || '');
	const [status, setStatus] = useState('');
	const [isRegistered, setIsRegistered] = useState(false);
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

	const checkRegistration = async () => {
		const googleIdHash = web3.utils.sha3(googleId);
		try {
			const isRegistered = await contract.methods.validateUser(googleIdHash).call();
			setIsRegistered(isRegistered);
			if (isRegistered) {
				const registeredUsername = await contract.methods.getUsername(googleIdHash).call();
				const registeredAccount = await contract.methods.getUserAddress(googleIdHash).call();
				setUsername(registeredUsername);
				setEthAccount(registeredAccount);
				localStorage.setItem('username', registeredUsername);
				localStorage.setItem('ethAccount', registeredAccount);
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
							<h1>Google Auth DApp</h1>
							<p>Status: {status}</p>
							{!googleId ? (
								<GoogleLogin
									buttonText="Sign in with Google"
									onSuccess={handleGoogleLoginSuccess}
									onFailure={handleGoogleLoginFailure}
								/>
							) : (
								<button onClick={logoutUser}>Logout</button>
							)}
							<div>
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
						/>
					}
				/>
				<Route
					path="/track"
					element={
						<Track
						web3={web3}
						ethAccount = {ethAccount}
						contract = {contract}
						/>
					}
				/>
			</Routes>
		</div>
	);
}

export default App;
