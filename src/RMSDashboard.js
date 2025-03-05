import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { useEffect, useState } from 'react';
import { AES, enc } from 'crypto-js';
import "./Dashboard.css";
import DashboardHeader from './DashboardHeader';

function RMSDashboard({ web3, mainContract, userManagementContract, RMSContract, manufacturerContract, productNFTContract, username, emailId, googleId, ethAccount, logoutUser }) {
	const navigate = useNavigate();
	const [unsoldRawMaterials, setUnsoldRawMaterials] = useState([]);
	const [soldRawMaterials, setSoldRawMaterials] = useState([]);
	const [newRawMaterial, setNewRawMaterial] = useState({ name: '', quantity: '', pricePerUnit: '', weightPerUnit: '', description: '' });
	const [ManufacturerComments, setManufacturerComments] = useState({});
	const [manufacturerTrustScores, setManufacturerTrustScores] = useState({});
	const [rawMaterialToProduct, setRawMaterialToProduct] = useState({});

	useEffect(() => {
		const initializeDashboard = async () => {
			try {
				await loadBlockchaindata();
			} catch (error) {
				console.error("Error initializing dashboard:", error);
			}
		};

		initializeDashboard();
	}, []);

	const loadBlockchaindata = async () => {
		const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
		const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
		await web3.eth.personal.unlockAccount(ethAccount, password, 600);
		const currUnsoldRawMaterials = await RMSContract.methods.getUserUnsoldRawMaterials(ethAccount).call();
		setUnsoldRawMaterials(currUnsoldRawMaterials);
		const currSoldRawMaterials = await RMSContract.methods.getUserSoldRawMaterials(ethAccount).call();
		setSoldRawMaterials(currSoldRawMaterials);
		const currManufacturerTrustScores = {};
		const currManufacturerComments = {};
		for (let i = 0; i < currSoldRawMaterials.length; i++) {
			const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currSoldRawMaterials[i].buyingUser.ethAddress).call();
			currManufacturerTrustScores[currSoldRawMaterials[i].id] = currManufacturerTrustScore;
			const productId = await RMSContract.methods.getRawMaterialProduct(currSoldRawMaterials[i].id).call();
			const product = await manufacturerContract.methods.getProduct(productId).call();
			setRawMaterialToProduct((prevState) => ({ ...prevState, [currSoldRawMaterials[i].id]: product }));
			const commentId = await RMSContract.methods.getToManufacturerCommentId(ethAccount, currSoldRawMaterials[i].id).call();
			if (commentId) {
				const comment = await mainContract.methods.getComment(commentId).call();
				currManufacturerComments[currSoldRawMaterials[i].id] = {};
				currManufacturerComments[currSoldRawMaterials[i].id].comment = comment.comment;
				currManufacturerComments[currSoldRawMaterials[i].id].rating = Number(comment.rating);
				currManufacturerComments[currSoldRawMaterials[i].id].submitted = true;
			}
		}
		setManufacturerTrustScores(currManufacturerTrustScores);
		setManufacturerComments(currManufacturerComments);
	}

	const handleAddRawMaterial = async (e) => {
		e.preventDefault();
		if (!newRawMaterial.name || !newRawMaterial.quantity || isNaN(newRawMaterial.quantity) || newRawMaterial.quantity <= 0 || !newRawMaterial.pricePerUnit || isNaN(newRawMaterial.pricePerUnit) || newRawMaterial.pricePerUnit <= 0 || !newRawMaterial.weightPerUnit || isNaN(newRawMaterial.weightPerUnit) || newRawMaterial.weightPerUnit <= 0 || !newRawMaterial.description) {
			toast.error('Please provide a valid raw material name, description, price per unit, weight per unit and quantity.');
			return;
		}

		try {
			const toastId = toast.loading('Adding Raw Material...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const googleIdHash = web3.utils.sha3(googleId);
			const receipt = await RMSContract.methods
				.addRawMaterial(newRawMaterial.name, parseInt(newRawMaterial.quantity), newRawMaterial.description, parseInt(newRawMaterial.pricePerUnit), parseInt(newRawMaterial.weightPerUnit), googleIdHash)
				.send({ from: ethAccount, gas: 30000000 });

			toast.dismiss(toastId);
			toast.success(`Raw Material added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			await fetchRawMaterials();
		} catch (error) {
			toast.error('Error adding raw material. Please check the console.');
			console.log(error);
		}
	};

	const fetchRawMaterials = async () => {
		try {
			const currUnsoldRawMaterials = await RMSContract.methods.getUserUnsoldRawMaterials(ethAccount).call();
			setUnsoldRawMaterials(currUnsoldRawMaterials);
			const currSoldRawMaterials = await RMSContract.methods.getUserSoldRawMaterials(ethAccount).call();
			setSoldRawMaterials(currSoldRawMaterials);
			const currManufacturerTrustScores = {};
			const currManufacturerComments = {};
			for (let i = 0; i < currSoldRawMaterials.length; i++) {
				const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currSoldRawMaterials[i].buyingUser.ethAddress).call();
				currManufacturerTrustScores[currSoldRawMaterials[i].id] = currManufacturerTrustScore;
				const productId = await RMSContract.methods.getRawMaterialProduct(currSoldRawMaterials[i].id).call();
				const product = await manufacturerContract.methods.getProduct(productId).call();
				setRawMaterialToProduct((prevState) => ({ ...prevState, [currSoldRawMaterials[i].id]: product }));
				const commentId = await RMSContract.methods.getToManufacturerCommentId(ethAccount, currSoldRawMaterials[i].id).call();
				if (commentId) {
					const comment = await mainContract.methods.getComment(commentId).call();
					currManufacturerComments[currSoldRawMaterials[i].id] = {};
					currManufacturerComments[currSoldRawMaterials[i].id].comment = comment.comment;
					currManufacturerComments[currSoldRawMaterials[i].id].rating = Number(comment.rating);
					currManufacturerComments[currSoldRawMaterials[i].id].submitted = true;
				}
			}
			setManufacturerTrustScores(currManufacturerTrustScores);
			setManufacturerComments(currManufacturerComments);
		} catch (error) {
			toast.error('Error fetching raw materials. Please check the console.');
			console.log(error);
		}
	};

	const handleViewComments = async (soldRawMaterialId) => {
		try {
			const comments = await RMSContract.methods.getSoldRawMaterialComments(soldRawMaterialId).call();
			navigate('/comments', { state: { comments: comments, heading: `Comments for Sold Raw Material ID: ${soldRawMaterialId}` } });
		}
		catch (error) {
			toast.error('Error fetching comments. Please check the console.');
			console.log(error);
		}
	};

	const handleManufacturerCommentChange = (id, field, value) => {
		setManufacturerComments((prevState) => ({
			...prevState,
			[id]: {
				...prevState[id],
				[field]: value,
			},
		}));
	};

	const handleAddCommentForManufacturer = async (soldRawMaterial) => {
		try {
			if (!ManufacturerComments[soldRawMaterial.id]?.comment) {
				toast.error("Manufacturer comment cannot be empty.");
				return;
			}
			if (!ManufacturerComments[soldRawMaterial.id]?.rating) {
				toast.error("Manufacturer rating cannot be empty.");
				return;
			}
			const toastId = toast.loading('Adding Comment for Manufacturer...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await RMSContract.methods.addManufacturerComment(soldRawMaterial.rawMaterial.registeringUser, soldRawMaterial.buyingUser, ManufacturerComments[soldRawMaterial.id]?.comment, ManufacturerComments[soldRawMaterial.id]?.rating, soldRawMaterial.id).send({ from: ethAccount, gas: 30000000 });
			// let currRMSTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress).call();
			// currRMSTrustScore = Number(currRMSTrustScore);
			// if (currRMSTrustScore + 100 > 10000000) {
			// 	currRMSTrustScore = 10000000;
			// }
			// else {
			// 	currRMSTrustScore = currRMSTrustScore + 100;
			// }
			// const r1 = await mainContract.methods.setUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress, currRMSTrustScore).send({ from: ethAccount, gas: 30000000 });
			let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.buyingUser.ethAddress).call();
			currManufacturerTrustScore = Number(currManufacturerTrustScore);
			const oldManufacturerTrustScore = currManufacturerTrustScore;
			if (currManufacturerTrustScore + (100 * Number(ManufacturerComments[soldRawMaterial.id]?.rating - 3)) < 0) {
				currManufacturerTrustScore = 0;
			}
			else if (currManufacturerTrustScore + (100 * Number(ManufacturerComments[soldRawMaterial.id]?.rating - 3)) > 10000000) {
				currManufacturerTrustScore = 10000000;
			}
			else {
				currManufacturerTrustScore = currManufacturerTrustScore + (100 * Number(ManufacturerComments[soldRawMaterial.id]?.rating - 3));
			}
			const r2 = await mainContract.methods.setUserTrustScore(soldRawMaterial.buyingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Comment for Manufacturer added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei. \n\n Manufacturer Trust Score updated from ${oldManufacturerTrustScore / 100000} to ${currManufacturerTrustScore / 100000}.`);
			setManufacturerComments((prevState) => ({
				...prevState,
				[soldRawMaterial.id]: {
					...prevState[soldRawMaterial.id],
					submitted: true
				},
			}));
			await fetchRawMaterials();
		} catch (error) {
			toast.error('Error adding manufacturer comment. Please check the console.');
			console.log(error);
		}
	};

	const handleViewShippingDetails = async (soldRawMaterial) => {
		try {
			const shippingDetails = await mainContract.methods.getShippingDetails(soldRawMaterial.transaction.id).call();
			navigate('/view-shipping-details', { state: { shippingDetails: [{ shippingDetails: shippingDetails, transaction: soldRawMaterial.transaction }], heading: `Shipping Details for Transaction ID: ${soldRawMaterial.transaction.id}` } });
		}
		catch (error) {
			toast.error('Error fetching shipping details. Please check the console.');
			console.log(error);
		}
	};

	const handleViewNFT = async (productId) => {
		try {
			// const nft = await productNFTContract.methods.getProductNFT(productId).call();
			// navigate('/view-nft', { state: { nfts: [nft], heading: `NFT for Product ID: ${productId}` } });
			const nfts = await productNFTContract.methods.getProductNFT(productId).call();
			navigate('/view-nft', { state: { nfts: nfts, heading: `NFT for Product ID: ${productId}` } });
		}
		catch (error) {
			toast.error('Error fetching NFT. Please check the console.');
			console.log(error);
		}
	};

	return (
		<div className='main'>
			<DashboardHeader web3={web3} mainContract={mainContract} userManagementContract={userManagementContract} username={username} ethAccount={ethAccount} logoutUser={logoutUser} heading={"Raw Material Supplier Dashboard"} state={{ unsoldRawMaterials, soldRawMaterials, ManufacturerComments, manufacturerTrustScores, rawMaterialToProduct }} />
			<div>
				<h3 className='sub-heading'>Add Raw Material</h3>
				<form onSubmit={handleAddRawMaterial} className='form'>
					<label> Name</label>
					<input
						type="text"
						placeholder="Enter Raw Material Name"
						value={newRawMaterial.name}
						onChange={(e) => setNewRawMaterial({ ...newRawMaterial, name: e.target.value })}
					/>
					<label> Quantity</label>
					<input
						type="number"
						placeholder="Enter Quantity"
						value={newRawMaterial.quantity}
						onChange={(e) => setNewRawMaterial({ ...newRawMaterial, quantity: e.target.value })}
					/>
					<label> Price per Unit</label>
					<input
						type="number"
						placeholder="Enter Price per Unit"
						value={newRawMaterial.pricePerUnit}
						onChange={(e) => setNewRawMaterial({ ...newRawMaterial, pricePerUnit: e.target.value })}
					/>
					<label> Weight per Unit (in kg)</label>
					<input
						type="number"
						placeholder="Enter Weight per Unit"
						value={newRawMaterial.weightPerUnit}
						onChange={(e) => setNewRawMaterial({ ...newRawMaterial, weightPerUnit: e.target.value })}
					/>
					<label> Description</label>
					<input
						type="text"
						placeholder="Enter Raw Material Description"
						value={newRawMaterial.description}
						onChange={(e) => setNewRawMaterial({ ...newRawMaterial, description: e.target.value })}
					/>
					<button type="submit">Add Raw Material</button>
				</form>
			</div>
			{unsoldRawMaterials.length ? (<><h3 className='sub-heading'>Unsold Raw Materials</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Date Added</th>
							<th>Name</th>
							<th>Quantity</th>
							<th>Price per Unit</th>
							<th>Weight per Unit</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						{unsoldRawMaterials.map((rawMaterial) => (
							<tr key={rawMaterial.id}>
								<td>{String(rawMaterial.id)}</td>
								<td>{new Date(Number(rawMaterial.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(rawMaterial.name)}</td>
								<td>{String(rawMaterial.quantity)}</td>
								<td>Rs. {String(rawMaterial.pricePerUnit)}</td>
								<td>{String(rawMaterial.weightPerUnit)} kg</td>
								<td>{String(rawMaterial.description)}</td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
			{soldRawMaterials.filter(soldRawMaterial => !soldRawMaterial.received).length ? (<><h3 className='sub-heading'>Pending Raw Materials</h3>
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
							<th>Date Sold</th>
							<th>Manufacturer Sold To</th>
							<th>Manufacturer Trust Score</th>
							<th>Add Comment for Manufacturer</th>
							<th>Shipping Details</th>
						</tr>
					</thead>
					<tbody>
						{soldRawMaterials.filter(soldRawMaterial => !soldRawMaterial.received).map((soldRawMaterial) => (
							<tr key={soldRawMaterial.id}>
								<td>{String(soldRawMaterial.id)}</td>
								<td>{new Date(soldRawMaterial.rawMaterial.timestamp * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldRawMaterial.rawMaterial.name)}</td>
								<td>{String(soldRawMaterial.transaction.quantity)}</td>
								<td>Rs. {String(soldRawMaterial.rawMaterial.pricePerUnit)}</td>
								<td>Rs. {String(soldRawMaterial.transaction.pricePerUnit * soldRawMaterial.transaction.quantity)}</td>
								<td>{String(soldRawMaterial.rawMaterial.description)}</td>
								<td>{new Date(Number(soldRawMaterial.transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldRawMaterial.buyingUser.email)}</td>
								<td>{String(Number(manufacturerTrustScores[soldRawMaterial.id]) / 100000)}</td>
								<td>{
									ManufacturerComments[soldRawMaterial.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {ManufacturerComments[soldRawMaterial.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {ManufacturerComments[soldRawMaterial.id]?.rating}⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={ManufacturerComments[soldRawMaterial.id]?.comment || ''} onChange={(e) => handleManufacturerCommentChange(soldRawMaterial.id, "comment", e.target.value)} />
											<select value={ManufacturerComments[soldRawMaterial.id]?.rating || ""} onChange={(e) => handleManufacturerCommentChange(soldRawMaterial.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForManufacturer(soldRawMaterial)}>Add Comment</button>
										</div>
									)
								}</td>
								<td><a className='comment-link' onClick={() => handleViewShippingDetails(soldRawMaterial)}>View Shipping Details</a></td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
			{soldRawMaterials.filter(soldRawMaterial => soldRawMaterial.received).length ? (<><h3 className='sub-heading'>Received Raw Materials</h3>
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
							<th>Date Sold</th>
							<th>Date Received</th>
							<th>Manufacturer Sold To</th>
							<th>Comments from Manufacturer</th>
							<th>Manufacturer Trust Score</th>
							<th>Add Comment for Manufacturer</th>
							<th>Shipping Details</th>
							<th>Product To Be Used For</th>
							<th>Product NFT</th>
						</tr>
					</thead>
					<tbody>
						{soldRawMaterials.filter(soldRawMaterial => soldRawMaterial.received).map((soldRawMaterial) => (
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
								<td>{String(soldRawMaterial.buyingUser.email)}</td>
								<td><a className='comment-link' onClick={() => handleViewComments(soldRawMaterial.id)} target='_blank'>View Comments</a></td>
								<td>{String(Number(manufacturerTrustScores[soldRawMaterial.id]) / 100000)}</td>
								<td>{
									ManufacturerComments[soldRawMaterial.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {ManufacturerComments[soldRawMaterial.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {ManufacturerComments[soldRawMaterial.id]?.rating}⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={ManufacturerComments[soldRawMaterial.id]?.comment || ''} onChange={(e) => handleManufacturerCommentChange(soldRawMaterial.id, "comment", e.target.value)} />
											<select value={ManufacturerComments[soldRawMaterial.id]?.rating || ""} onChange={(e) => handleManufacturerCommentChange(soldRawMaterial.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForManufacturer(soldRawMaterial)}>Add Comment</button>
										</div>
									)
								}</td>
								<td><a className='comment-link' onClick={() => handleViewShippingDetails(soldRawMaterial)}>View Shipping Details</a></td>
								<td>{String(rawMaterialToProduct[soldRawMaterial.id]?.name)}</td>
								<td>{rawMaterialToProduct[soldRawMaterial.id]?.manufactured ? (<a className='comment-link' onClick={() => handleViewNFT(rawMaterialToProduct[soldRawMaterial.id].id)} target="_blank">View NFT</a>) : "Product has not been manufactured yet."}</td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
		</div>
	);
}

export default RMSDashboard;