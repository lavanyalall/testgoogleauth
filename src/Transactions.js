import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AES, enc } from 'crypto-js';
import toast from "react-hot-toast";
require("dotenv").config();

function Transactions({ mainContract, userManagementContract, web3, ethAccount }) {
	const navigate = useNavigate();
	const location = useLocation();
	const transactions = location.state?.transactions || [];
	const heading = location.state?.heading || '';
	const [trustScores, setTrustScores] = useState({});

	useEffect(() => {
		const initializeTransactions = async () => {
			try {
				await loadBlockchaindata();
			} catch (error) {
				console.error("Error initializing transactions page:", error);
			}
		};

		initializeTransactions();
	}, []);

	const loadBlockchaindata = async () => {
		const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
		const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
		await web3.eth.personal.unlockAccount(ethAccount, password, 600);
		const currTrustScores = {};
		for (let i = 0; i < transactions.length; i++) {
			const currSenderTrustScore = await mainContract.methods.getUserTrustScore(transactions[i].from.ethAddress).call();
			currTrustScores[transactions[i].from.ethAddress] = currSenderTrustScore;
			const currReceiverTrustScore = await mainContract.methods.getUserTrustScore(transactions[i].to.ethAddress).call();
			currTrustScores[transactions[i].to.ethAddress] = currReceiverTrustScore;
		}
		setTrustScores(currTrustScores);
	};

	const handleViewShippingDetails = async (transaction) => {
		try {
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const shippingDetails = await mainContract.methods.getShippingDetails(transaction.id).call();
			navigate('/view-shipping-details', { state: { shippingDetails: [{ shippingDetails: shippingDetails, transaction: transaction }], heading: `Shipping Details for Transaction ID: ${transaction.id}` } });
		}
		catch (error) {
			toast.error('Error fetching shipping details. Please check the console.');
			console.log(error);
		}
	};

	return (<>
		{transactions.length ? (<><h3 className='page-heading'>{heading}</h3>
			<div className="table-cont">
            <table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Date</th>
						<th>From</th>
						<th>Sender Trust Score</th>
						<th>To</th>
						<th>Receiver Trust Score</th>
						<th>Quantity</th>
						<th>Price per Unit</th>
						<th>Total Price</th>
						<th>Description</th>
						<th>Gas Used</th>
						<th>Shipping Details</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{transactions.map((transaction) => (
						<tr key={transaction.id}>
							<td>{String(transaction.id)}</td>
							<td>{new Date(Number(transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
							<td>{String(transaction.from.email)}</td>
							<td>{String(Number(trustScores[transaction.from.ethAddress]) / 100000)}</td>
							<td>{String(transaction.to.email)}</td>
							<td>{String(Number(trustScores[transaction.to.ethAddress]) / 100000)}</td>
							<td>{String(transaction.quantity)}</td>
							<td>Rs. {String(transaction.pricePerUnit)}</td>
							<td>Rs. {String(transaction.quantity * transaction.pricePerUnit)}</td>
							<td>{String(transaction.description)}</td>
							<td>{String(transaction.gasUsed)} gwei</td>
							<td><a className='comment-link' onClick={() => handleViewShippingDetails(transaction)} target="_blank">View Shipping Details</a></td>
							<td>{transaction.status ? "Success" : "Failed"}</td>
						</tr>
					))}
				</tbody>
			</table>
          </div></>) : (<h2 className = "page-heading">No transactions found.</h2>)
		}</>
	)
}

export default Transactions;