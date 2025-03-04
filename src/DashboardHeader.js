import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AES, enc } from 'crypto-js';

function DashboardHeader({ heading, username, ethAccount, mainContract, userManagementContract, productNFTContract, web3, logoutUser, state }) {
	const navigate = useNavigate();
	const [accountBalance, setAccountBalance] = useState(null);
	const [transactions, setTransactions] = useState([]);
	const [sentComments, setSentComments] = useState([]);
	const [receivedComments, setReceivedComments] = useState([]);
	const [productTokens, setProductTokens] = useState([]);
	const [userTrustScore, setUserTrustScore] = useState('');
	useEffect(() => {
		const initializeDashboardHeader = async () => {
			try {
				await loadBlockchaindata();
			} catch (error) {
				console.error("Error initializing dashboard:", error);
			}
		};

		initializeDashboardHeader();
	}, [state]);

	const loadBlockchaindata = async () => {
		const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
		const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
		await web3.eth.personal.unlockAccount(ethAccount, password, 600);
		const balance = await web3.eth.getBalance(ethAccount);
		setAccountBalance(balance);
		const currUserTrustScore = await mainContract.methods.getUserTrustScore(ethAccount).call();
		setUserTrustScore(currUserTrustScore);
		const currTransactions = await mainContract.methods.getTransactions(ethAccount).call();
		setTransactions(currTransactions);
		const currSentComments = await mainContract.methods.getUserSentComments(ethAccount).call();
		setSentComments(currSentComments);
		const currReceivedComments = await mainContract.methods.getUserReceivedComments(ethAccount).call();
		setReceivedComments(currReceivedComments);
		if(productNFTContract) {
			const currProductTokens = await productNFTContract.methods.getUserNFTs(ethAccount).call();
			setProductTokens(currProductTokens);
		}
	};

	return (
		<>
			<h2 className='page-heading'>{heading}</h2>
			<div className='welcome-message'>
				<p>Welcome, {username}</p>
				<p ><span style={{ "font-weight": "bold" }} > Your Ethereum Address: </span>{ethAccount}</p>
				<p ><span style={{ "font-weight": "bold" }}> Your Account Balance: </span> {accountBalance ? `${web3.utils.fromWei(accountBalance, 'ether')} ETH` : "Loading..."}</p>
				<p ><span style={{ "font-weight": "bold" }}> Your Trust Score: </span> {userTrustScore ? String(Number(userTrustScore) / 100000) : "Loading..."}</p>
			</div>
			<div className="button-container">
				<button onClick={() => navigate('/')} type="submit" className='home'>Home</button>
				<button onClick={logoutUser} type="submit" className='logout'>Logout</button>
				{transactions.length > 0 && <button onClick={() => navigate('/transactions', { state: { heading: `Transactions of User: ${username}`, transactions: transactions } })} type="submit" className='transactions home'>Transactions</button>}
				{sentComments.length > 0 && <button onClick={() => navigate('/comments', { state: { heading: `Comments Sent by User: ${username}`, comments: sentComments } })} type="submit" className='transactions home'>Sent Comments</button>}
				{receivedComments.length > 0 && <button onClick={() => navigate('/comments', { state: { heading: `Comments Received by User: ${username}`, comments: receivedComments } })} type="submit" className='transactions home'>Received Comments</button>}
				{productTokens.length > 0 && <button onClick={() => navigate('/view-nft', { state: { heading: `NFTs of User: ${username}`, nfts: productTokens } })} type="submit" className='transactions home'>Owned NFTs</button>}
			</div>
		</>
	);
}

export default DashboardHeader;