import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AES, enc } from 'crypto-js';
import toast from "react-hot-toast";
require("dotenv").config();

function ProductRawMaterials({mainContract, userManagementContract, RMSContract, web3, ethAccount}) {
	const navigate = useNavigate();
	const location = useLocation();
	const rawMaterials = location.state?.rawMaterials || [];
	const heading = location.state?.heading || '';
	const [trustScores, setTrustScores] = useState({});

	useEffect(() => {
		const initializeRawMaterials = async () => {
			try {
				await loadBlockchaindata();
			} catch (error) {
				console.error("Error initializing raw materials page:", error);
			}
		};

		initializeRawMaterials();
	}, []);

	const loadBlockchaindata = async () => {
		const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
		const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
		await web3.eth.personal.unlockAccount(ethAccount, password, 600);
		const currTrustScores = {};
		for (let i = 0; i < rawMaterials.length; i++) {
			const currRMSTrustScore = await mainContract.methods.getUserTrustScore(rawMaterials[i].rawMaterial.registeringUser.ethAddress).call();
			currTrustScores[rawMaterials[i].rawMaterial.registeringUser.ethAddress] = currRMSTrustScore;
			const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(rawMaterials[i].buyingUser.ethAddress).call();
			currTrustScores[rawMaterials[i].buyingUser.ethAddress] = currManufacturerTrustScore;
		}
		setTrustScores(currTrustScores);
	}

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

	const handleViewRMSComments = async (user) => {
			try {
				const comments = await mainContract.methods.getUserReceivedComments(user.ethAddress).call();
				navigate('/comments', { state: { comments: comments, heading: `Comments for Sold Raw Material Supplier: ${user.username}` } });
			}
			catch (error) {
				toast.error('Error fetching raw material supplier comments. Please check the console.');
				console.log(error);
			}
		};
	
		const handleViewRawMaterialComments = async (id) => {
			try {
				const comments = await RMSContract.methods.getRawMaterialComments(id).call();
				navigate('/comments', { state: { comments: comments, heading: `Comments for Raw Material ID: ${id}` } });
			}
			catch (error) {
				toast.error('Error fetching raw material comments. Please check the console.');
				console.log(error);
			}
		};

	return (<>
		{rawMaterials.length ? (<><h3 className='sub-heading'>{heading}</h3>
			<div className="table-cont">
            <table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Date Added</th>
						<th>Name</th>
						<th>Quantity Purchased</th>
						<th>Price per Unit</th>
						<th>Total Price</th>
						<th>Description</th>
						<th>Date Bought</th>
						<th>Date Received</th>
						<th>Raw Material Supplier Bought From</th>
						<th>Raw Material Supplier Trust Score</th>
						<th>Manufacturing User</th>
						<th>Manufacturer Trust Score</th>
						<th>Shipping Details</th>
						<th>Raw Material Supplier Comments</th>
						<th>Raw Material Comments</th>
					</tr>
				</thead>
				<tbody>
					{rawMaterials.map((soldRawMaterial) => (
						<tr key={soldRawMaterial.id}>
							<td>{String(soldRawMaterial.id)}</td>
							<td>{new Date(Number(soldRawMaterial.rawMaterial.timestamp) * 1000).toLocaleString('en-GB')}</td>
							<td>{String(soldRawMaterial.rawMaterial.name)}</td>
							<td>{String(soldRawMaterial.transaction.quantity)}</td>
							<td>Rs. {String(soldRawMaterial.rawMaterial.pricePerUnit)}</td>
							<td>Rs. {String(soldRawMaterial.transaction.pricePerUnit * soldRawMaterial.transaction.quantity)}</td>
							<td>{String(soldRawMaterial.rawMaterial.description)}</td>
							<td>{new Date(Number(soldRawMaterial.transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
							<td>{new Date(Number(soldRawMaterial.receivedTimestamp) * 1000).toLocaleString('en-GB')}</td>
							<td>{String(soldRawMaterial.rawMaterial.registeringUser.email)}</td>
							<td>{String(Number(trustScores[soldRawMaterial.rawMaterial.registeringUser.ethAddress]) / 100000)}</td>
							<td>{String(soldRawMaterial.buyingUser.email)}</td>
							<td>{String(Number(trustScores[soldRawMaterial.buyingUser.ethAddress]) / 100000)}</td>
							<td><a className='comment-link' onClick={() => handleViewShippingDetails(soldRawMaterial.transaction)} target="_blank">View Shipping Details</a></td>
							<td><a className='comment-link' onClick={() => handleViewRMSComments(soldRawMaterial.rawMaterial.registeringUser)} target="_blank">View RMS Comments</a></td>
							<td><a className='comment-link' onClick={() => handleViewRawMaterialComments(soldRawMaterial.rawMaterial.id)} target="_blank">View Raw Material Comments</a></td>
						</tr>
					))}
				</tbody>
			</table>
          </div></>) : (<></>)
		}</>
	)
}

export default ProductRawMaterials;