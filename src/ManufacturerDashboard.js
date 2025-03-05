import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { AES, enc } from 'crypto-js';
import { pinata } from "./utils/config";
import axios from "axios";
import "./Dashboard.css";
import DashboardHeader from './DashboardHeader';
require("dotenv").config();

function ManufacturerDashboard({ mainContract, userManagementContract, RMSContract, manufacturerContract, RMContract, productNFTContract, consumerContract, web3, ethAccount, googleId, username, logoutUser, emailId }) {
	const navigate = useNavigate();
	const [unsoldProducts, setUnsoldProducts] = useState([]);
	const [soldProducts, setSoldProducts] = useState([]);
	const [allRawMaterials, setAllRawMaterials] = useState([]);
	const [boughtRawMaterials, setBoughtRawMaterials] = useState([]);
	// const [newProduct, setNewProduct] = useState({ name: '', quantity: 1, pricePerUnit: '', weightPerUnit: '', description: '', rawMaterialIds: [], rawMaterialQuantities: [] });
	const [newProduct, setNewProduct] = useState({ name: '', quantity: '', pricePerUnit: '', weightPerUnit: '', description: '', rawMaterialIds: [], rawMaterialQuantities: [] });
	const [productImages, setProductImages] = useState({});
	const [RMSComments, setRMSComments] = useState({});
	const [rawMaterialComments, setRawMaterialComments] = useState({});
	const [requests, setRequests] = useState([]);
	const [RMSTrustScores, setRMSTrustScores] = useState({});
	const [consumerTrustScores, setConsumerTrustScores] = useState({});
	const [consumerComments, setConsumerComments] = useState({});

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
		const currBoughtRawMaterials = await manufacturerContract.methods.getUserBoughtRawMaterials(ethAccount).call();
		setBoughtRawMaterials(currBoughtRawMaterials);
		const currUnsoldProducts = await manufacturerContract.methods.getUserUnsoldProducts(ethAccount).call();
		setUnsoldProducts(currUnsoldProducts);
		const currSoldProducts = await manufacturerContract.methods.getUserSoldProducts(ethAccount).call();
		setSoldProducts(currSoldProducts);
		const currAllRawMaterials = await RMSContract.methods.getAllRawMaterials().call();
		setAllRawMaterials(currAllRawMaterials);
		const currRequests = await RMContract.methods.getManufacturerProductRequests(ethAccount).call();
		setRequests(currRequests);
		const currRMSTrustScores = {};
		for (let i = 0; i < currAllRawMaterials.length; i++) {
			const currRMSTrustScore = await mainContract.methods.getUserTrustScore(currAllRawMaterials[i].registeringUser.ethAddress).call();
			currRMSTrustScores[currAllRawMaterials[i].registeringUser.ethAddress] = currRMSTrustScore;
		}
		const currRawMaterialComments = {}
		for (let i = 0; i < currBoughtRawMaterials.length; i++) {
			const currRMSTrustScore = await mainContract.methods.getUserTrustScore(currBoughtRawMaterials[i].rawMaterial.registeringUser.ethAddress).call();
			currRMSTrustScores[currBoughtRawMaterials[i].rawMaterial.registeringUser.ethAddress] = currRMSTrustScore;
			const commentId = await RMSContract.methods.getFromManufacturerCommentId(ethAccount, currBoughtRawMaterials[i].id).call();
			if (commentId) {
				const comment = await mainContract.methods.getComment(commentId).call();
				currRawMaterialComments[currBoughtRawMaterials[i].id] = {};
				currRawMaterialComments[currBoughtRawMaterials[i].id].comment = comment.comment;
				currRawMaterialComments[currBoughtRawMaterials[i].id].rating = Number(comment.rating);
				currRawMaterialComments[currBoughtRawMaterials[i].id].submitted = true;
			}
		}
		setRawMaterialComments(currRawMaterialComments);
		setRMSTrustScores(currRMSTrustScores);
		const currConsumerTrustScores = {};
		const currConsumerComments = {};
		for (let i = 0; i < currSoldProducts.length; i++) {
			const currConsumerTrustScore = await mainContract.methods.getUserTrustScore(currSoldProducts[i].buyingUser.ethAddress).call();
			currConsumerTrustScores[currSoldProducts[i].buyingUser.ethAddress] = currConsumerTrustScore;
			const commentId = await consumerContract.methods.getFromManufacturerCommentId(ethAccount, currSoldProducts[i].id).call();
			if (commentId) {
				const comment = await mainContract.methods.getComment(commentId).call();
				currConsumerComments[currSoldProducts[i].id] = {};
				currConsumerComments[currSoldProducts[i].id].comment = comment.comment;
				currConsumerComments[currSoldProducts[i].id].rating = Number(comment.rating);
				currConsumerComments[currSoldProducts[i].id].submitted = true;
			}
		}
		setConsumerComments(currConsumerComments);
		for (let i = 0; i < currRequests.length; i++) {
			const currConsumerTrustScore = await mainContract.methods.getUserTrustScore(currRequests[i].requestingUser.ethAddress).call();
			currConsumerTrustScores[currRequests[i].requestingUser.ethAddress] = currConsumerTrustScore;
		}
		setConsumerTrustScores(currConsumerTrustScores);
	}

	const handleAddProduct = async (e) => {
		e.preventDefault();
		if (!newProduct.name || !newProduct.quantity || isNaN(newProduct.quantity) || newProduct.quantity <= 0 || !newProduct.pricePerUnit || isNaN(newProduct.pricePerUnit) || newProduct.pricePerUnit <= 0 || !newProduct.weightPerUnit || isNaN(newProduct.weightPerUnit) || newProduct.weightPerUnit <= 0 || !newProduct.description) {
			toast.error('Please provide a valid product name, description, price per unit, weight per unit and quantity.');
			return;
		}

		try {
			const toastId = toast.loading('Adding Product...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const googleIdHash = web3.utils.sha3(googleId);
			const transactionStatuses = [];
			const gasUsed = [];
			const transactionTimestamps = [];
			for (let i = 0; i < newProduct.rawMaterialIds.length; i++) {
				const rawMaterialId = newProduct.rawMaterialIds[i];
				const quantity = newProduct.rawMaterialQuantities[i];
				const receipt = await RMSContract.methods.buyRawMaterial(parseInt(rawMaterialId), parseInt(quantity)).send({ from: ethAccount, gas: 30000000 });
				const transactionRecipt = await web3.eth.getTransactionReceipt(receipt.transactionHash);
				const block = await web3.eth.getBlock(receipt.blockNumber);
				const timestamp = block.timestamp;
				transactionStatuses.push(Boolean(transactionRecipt.status));
				gasUsed.push(transactionRecipt.gasUsed);
				transactionTimestamps.push(timestamp);
			}
			const receipt = await manufacturerContract.methods.addProduct(newProduct.name, parseInt(newProduct.quantity), newProduct.description, parseInt(newProduct.pricePerUnit), parseInt(newProduct.weightPerUnit), newProduct.rawMaterialIds, newProduct.rawMaterialQuantities, transactionStatuses, gasUsed, transactionTimestamps, googleIdHash).send({ from: ethAccount, gas: 30000000 });
			const productId = receipt.events.getProductId.returnValues.productId;
			const rawMaterials = await manufacturerContract.methods.getProductRawMaterials(productId).call();
			const srlogindata = JSON.stringify({
				"email": process.env.REACT_APP_SHIPROCKET_EMAIL,
				"password": process.env.REACT_APP_SHIPROCKET_PASSWORD
			});
			let authToken = "";
			const response = await axios.post('https://apiv2.shiprocket.in/v1/external/auth/login', srlogindata, { headers: { 'Content-Type': 'application/json' } });
			authToken = response.data.token;
			if (!authToken) {
				toast.error("Error during authorization while fetching shipping details!");
			}
			else {
				for (let i = 0; i < rawMaterials.length; i++) {
					let shippingDetails = "";
					const params = 'pickup_postcode=' + rawMaterials[i].rawMaterial.registeringUser.location + '&delivery_postcode=' + rawMaterials[i].buyingUser.location + '&weight=' + rawMaterials[i].transaction.quantity * rawMaterials[i].transaction.weightPerUnit + '&declared_value=' + rawMaterials[i].transaction.quantity * rawMaterials[i].transaction.pricePerUnit + '&cod=1' + '&rate_calculator=1' + '&blocked=1' + '&is_return=0' + '&is_web=1' + '&is_dg=0' + '&only_qc_couriers=0';
					const config = {
						method: 'get',
						maxBodyLength: Infinity,
						url: 'https://apiv2.shiprocket.in/v1/external/courier/serviceability?' + params,
						headers: {
							'Content-Type': 'application/json',
							'Authorization': `Bearer ${authToken}`
						}
					};
					const response = await axios(config);
					shippingDetails = response.data.data;
					if (!shippingDetails) {
						toast.error("Error fetching shipping details!");
					}
					else {
						const recommendedCourierId = shippingDetails.recommended_courier_company_id;
						const recommendedCourier = shippingDetails.available_courier_companies.find(courier => courier.courier_company_id === recommendedCourierId);
						const shippingCharges = recommendedCourier.rate;
						const estimatedDeliveryTime = recommendedCourier.estimated_delivery_days;
						const courierName = recommendedCourier.courier_name;
						const courierRating = recommendedCourier.rating;
						const r = await mainContract.methods.addShippingDetails(rawMaterials[i].transaction.id, String(courierName), parseInt(Math.round(courierRating)), parseInt(Math.round(estimatedDeliveryTime)), parseInt(Math.round(shippingCharges))).send({ from: ethAccount, gas: 30000000 });
					}
				}
			}
			toast.dismiss(toastId);
			toast.success(`Product added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error adding product. Please check the console.');
			console.log(error);
		}
	};

	const fetchProducts = async () => {
		try {
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const currBoughtRawMaterials = await manufacturerContract.methods.getUserBoughtRawMaterials(ethAccount).call();
			setBoughtRawMaterials(currBoughtRawMaterials);
			const currUnsoldProducts = await manufacturerContract.methods.getUserUnsoldProducts(ethAccount).call();
			setUnsoldProducts(currUnsoldProducts);
			const currSoldProducts = await manufacturerContract.methods.getUserSoldProducts(ethAccount).call();
			setSoldProducts(currSoldProducts);
			const currAllRawMaterials = await RMSContract.methods.getAllRawMaterials().call();
			setAllRawMaterials(currAllRawMaterials);
			const currRequests = await RMContract.methods.getManufacturerProductRequests(ethAccount).call();
			setRequests(currRequests);
			const currRMSTrustScores = {};
			for (let i = 0; i < currAllRawMaterials.length; i++) {
				const currRMSTrustScore = await mainContract.methods.getUserTrustScore(currAllRawMaterials[i].registeringUser.ethAddress).call();
				currRMSTrustScores[currAllRawMaterials[i].registeringUser.ethAddress] = currRMSTrustScore;
			}
			const currRawMaterialComments = {}
			for (let i = 0; i < currBoughtRawMaterials.length; i++) {
				const currRMSTrustScore = await mainContract.methods.getUserTrustScore(currBoughtRawMaterials[i].rawMaterial.registeringUser.ethAddress).call();
				currRMSTrustScores[currBoughtRawMaterials[i].rawMaterial.registeringUser.ethAddress] = currRMSTrustScore;
				const commentId = await RMSContract.methods.getFromManufacturerCommentId(ethAccount, currBoughtRawMaterials[i].id).call();
				if (commentId) {
					const comment = await mainContract.methods.getComment(commentId).call();
					currRawMaterialComments[currBoughtRawMaterials[i].id] = {};
					currRawMaterialComments[currBoughtRawMaterials[i].id].comment = comment.comment;
					currRawMaterialComments[currBoughtRawMaterials[i].id].rating = Number(comment.rating);
					currRawMaterialComments[currBoughtRawMaterials[i].id].submitted = true;
				}
			}
			setRawMaterialComments(currRawMaterialComments);
			setRMSTrustScores(currRMSTrustScores);
			const currConsumerTrustScores = {};
			const currConsumerComments = {};
			for (let i = 0; i < currSoldProducts.length; i++) {
				const currConsumerTrustScore = await mainContract.methods.getUserTrustScore(currSoldProducts[i].buyingUser.ethAddress).call();
				currConsumerTrustScores[currSoldProducts[i].buyingUser.ethAddress] = currConsumerTrustScore;
				const commentId = await consumerContract.methods.getFromManufacturerCommentId(ethAccount, currSoldProducts[i].id).call();
				if (commentId) {
					const comment = await mainContract.methods.getComment(commentId).call();
					currConsumerComments[currSoldProducts[i].id] = {};
					currConsumerComments[currSoldProducts[i].id].comment = comment.comment;
					currConsumerComments[currSoldProducts[i].id].rating = Number(comment.rating);
					currConsumerComments[currSoldProducts[i].id].submitted = true;
				}
			}
			setConsumerComments(currConsumerComments);
			for (let i = 0; i < currRequests.length; i++) {
				const currConsumerTrustScore = await mainContract.methods.getUserTrustScore(currRequests[i].requestingUser.ethAddress).call();
				currConsumerTrustScores[currRequests[i].requestingUser.ethAddress] = currConsumerTrustScore;
			}
			setConsumerTrustScores(currConsumerTrustScores);
		} catch (error) {
			toast.error('Error fetching raw materials. Please check the console.');
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

	const handleViewConsumerComments = async (user) => {
		try {
			const comments = await mainContract.methods.getUserReceivedComments(user.ethAddress).call();
			navigate('/comments', { state: { comments: comments, heading: `Comments for Consumer: ${user.username}` } });
		}
		catch (error) {
			toast.error('Error fetching consumer comments. Please check the console.');
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

	const handleRawMaterialCheckboxChange = (e, rawMaterialId) => {
		const isChecked = e.target.checked;
		if (isChecked) {
			setNewProduct((prevState) => ({
				...prevState,
				rawMaterialIds: [...prevState.rawMaterialIds, rawMaterialId],
				rawMaterialQuantities: [...prevState.rawMaterialQuantities, 1],
			}));
		} else {
			setNewProduct((prevState) => ({
				...prevState,
				rawMaterialIds: prevState.rawMaterialIds.filter((id) => id !== rawMaterialId),
				rawMaterialQuantities: prevState.rawMaterialQuantities.filter((quantity, index) => index !== prevState.rawMaterialIds.indexOf(rawMaterialId)),
			}))
		}
	}

	const handleRawMaterialQuantityChange = (e, index, quantityAvailable) => {
		const value = e.target.value;
		const newQuantities = [...newProduct.rawMaterialQuantities];
		newQuantities[index] = value;
		if (parseInt(value) > quantityAvailable) {
			toast.error('Entered Quantity exceeds stock. Please enter a valid quantity.');
			return;
		}
		if (parseInt(value) <= 0) {
			toast.error('Quantity must be greater than 0. Please enter a valid quantity.');
			return;
		}
		setNewProduct((prevState) => ({
			...prevState,
			rawMaterialQuantities: newQuantities,
		}));
	}

	const handleMarkAsReceived = async (soldRawMaterial) => {
		try {
			const toastId = toast.loading('Receiving raw material...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await manufacturerContract.methods.receiveRawMaterial(soldRawMaterial.id).send({ from: ethAccount, gas: 30000000 });
			let currRMSTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress).call();
			currRMSTrustScore = Number(currRMSTrustScore);
			const oldRMSTrustScore = currRMSTrustScore;
			if (currRMSTrustScore + 100 > 10000000) {
				currRMSTrustScore = 10000000;
			}
			else {
				currRMSTrustScore = currRMSTrustScore + 100;
			}
			// if (currRMSTrustScore + (Number(soldRawMaterial.transaction.pricePerUnit) * Number(soldRawMaterial.transaction.quantity)) > 10000000) {
			// 	currRMSTrustScore = 10000000;
			// }
			// else {
			// 	currRMSTrustScore = currRMSTrustScore + Number(soldRawMaterial.transaction.pricePerUnit) * Number(soldRawMaterial.transaction.quantity);
			// }
			const r1 = await mainContract.methods.setUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress, currRMSTrustScore).send({ from: ethAccount, gas: 30000000 });
			let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.buyingUser.ethAddress).call();
			currManufacturerTrustScore = Number(currManufacturerTrustScore);
			const oldManufacturerTrustScore = currManufacturerTrustScore;
			if (currManufacturerTrustScore + 100 > 10000000) {
				currManufacturerTrustScore = 10000000;
			}
			else {
				currManufacturerTrustScore = currManufacturerTrustScore + 100;
			}
			// if (currManufacturerTrustScore + (Number(soldRawMaterial.transaction.pricePerUnit) * Number(soldRawMaterial.transaction.quantity)) > 10000000) {
			// 	currManufacturerTrustScore = 10000000;
			// }
			// else {
			// 	currManufacturerTrustScore = currManufacturerTrustScore + Number(soldRawMaterial.transaction.pricePerUnit) * Number(soldRawMaterial.transaction.quantity);
			// }
			const r2 = await mainContract.methods.setUserTrustScore(soldRawMaterial.buyingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Raw Material received successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei. \n\n Raw Material Supplier Trust Score updated from ${oldRMSTrustScore / 100000} to ${currRMSTrustScore / 100000}. \n\n Manufacturer Trust Score updated from ${oldManufacturerTrustScore / 100000} to ${currManufacturerTrustScore / 100000}.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error receiving raw material. Please check the console.');
			console.log(error);
		}
	};

	const handleRMSCommentChange = (id, field, value) => {
		setRMSComments((prevState) => ({
			...prevState,
			[id]: {
				...prevState[id],
				[field]: value,
			},
		}))
	};

	const handleRawMaterialCommentChange = (id, field, value) => {
		setRawMaterialComments((prevState) => ({
			...prevState,
			[id]: {
				...prevState[id],
				[field]: value,
			},
		}))
	};

	// const handleAddCommentForRawMaterialSupplier = async (soldRawMaterial) => {
	// 	try {
	// 		if (!RMSComments[soldRawMaterial.id]?.comment) {
	// 			toast.error("Raw Material Supplier comment cannot be empty.");
	// 			return;
	// 		}
	// 		if(!RMSComments[soldRawMaterial.id]?.rating){
	// 			toast.error("Raw Material Supplier rating cannot be empty.");
	// 			return;
	// 		}
	// 		const toastId = toast.loading('Adding Comment for Raw Material Supplier...');
	// 		const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
	// 		const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
	// 		await web3.eth.personal.unlockAccount(ethAccount, password, 600);
	// 		const receipt = await mainContract.methods.addComment(soldRawMaterial.buyingUser, soldRawMaterial.rawMaterial.registeringUser, RMSComments[soldRawMaterial.id]?.comment, RMSComments[soldRawMaterial.id]?.rating).send({ from: ethAccount, gas: 30000000 });
	// 		let currRMSTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress).call();
	// 		currRMSTrustScore = Number(currRMSTrustScore);
	// 		if (currRMSTrustScore + (100 * Number(RMSComments[soldRawMaterial.id]?.rating - 3)) < 0) {
	// 			currRMSTrustScore = 0;
	// 		}
	// 		else if (currRMSTrustScore + (100 * Number(RMSComments[soldRawMaterial.id]?.rating - 3)) > 10000000) {
	// 			currRMSTrustScore = 10000000;
	// 		}
	// 		else {
	// 			currRMSTrustScore = currRMSTrustScore + Number(100 * (RMSComments[soldRawMaterial.id]?.rating - 3));
	// 		}
	// 		const r1 = await mainContract.methods.setUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress, currRMSTrustScore).send({ from: ethAccount, gas: 30000000 });

	// 		// let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.buyingUser.ethAddress).call();
	// 		// currManufacturerTrustScore = Number(currManufacturerTrustScore);
	// 		// if (currManufacturerTrustScore + 100 > 10000000) {
	// 		// 	currManufacturerTrustScore = 10000000;
	// 		// }
	// 		// else {
	// 		// 	currManufacturerTrustScore = currManufacturerTrustScore + 100;
	// 		// }
	// 		// const r2 = await mainContract.methods.setUserTrustScore(soldRawMaterial.buyingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
	// 		toast.dismiss(toastId);
	// 		toast.success(`Comment for Raw Material Supplier added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
	// 		setRMSComments((prevState) => ({
	// 			...prevState,
	// 			[soldRawMaterial.id]: {
	// 				...prevState[soldRawMaterial.id],
	// 				submitted: true
	// 			},
	// 		}));
	// 		await fetchProducts();
	// 	} catch (error) {
	// 		toast.error('Error adding raw material supplier comment. Please check the console.');
	// 		console.log(error);
	// 	}
	// };

	const handleAddCommentForRawMaterial = async (soldRawMaterial) => {
		try {
			if (!rawMaterialComments[soldRawMaterial.id]?.comment) {
				toast.error("Raw Material comment cannot be empty.");
				return;
			}
			if (!rawMaterialComments[soldRawMaterial.id]?.rating) {
				toast.error("Raw Material rating cannot be empty.");
				return;
			}
			const toastId = toast.loading('Adding Comment for Raw Material...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await RMSContract.methods.addSoldRawMaterialComment(soldRawMaterial.id, rawMaterialComments[soldRawMaterial.id]?.comment, rawMaterialComments[soldRawMaterial.id]?.rating).send({ from: ethAccount, gas: 30000000 });
			let currRMSTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress).call();
			currRMSTrustScore = Number(currRMSTrustScore);
			const oldRMSTrustScore = currRMSTrustScore;
			if (currRMSTrustScore + (100 * Number(rawMaterialComments[soldRawMaterial.id]?.rating - 3)) < 0) {
				currRMSTrustScore = 0;
			}
			else if (currRMSTrustScore + (100 * Number(rawMaterialComments[soldRawMaterial.id]?.rating - 3)) > 10000000) {
				currRMSTrustScore = 10000000;
			}
			else {
				currRMSTrustScore = currRMSTrustScore + (100 * Number(rawMaterialComments[soldRawMaterial.id]?.rating - 3));
			}
			const r1 = await mainContract.methods.setUserTrustScore(soldRawMaterial.rawMaterial.registeringUser.ethAddress, currRMSTrustScore).send({ from: ethAccount, gas: 30000000 });

			// let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(soldRawMaterial.buyingUser.ethAddress).call();
			// currManufacturerTrustScore = Number(currManufacturerTrustScore);
			// if (currManufacturerTrustScore + 100 > 10000000) {
			// 	currManufacturerTrustScore = 10000000;
			// }
			// else {
			// 	currManufacturerTrustScore = currManufacturerTrustScore + 100;
			// }
			// const r2 = await mainContract.methods.setUserTrustScore(soldRawMaterial.buyingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Comment for Raw Material added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei. \n\n Raw Material Supplier Trust Score updated from ${oldRMSTrustScore / 100000} to ${currRMSTrustScore / 100000}.`);
			setRawMaterialComments((prevState) => ({
				...prevState,
				[soldRawMaterial.id]: {
					...prevState[soldRawMaterial.id],
					submitted: true
				},
			}));
			await fetchProducts();
		} catch (error) {
			toast.error('Error adding raw material comment. Please check the console.');
			console.log(error);
		}
	};

	const handleViewShippingDetails = async (item) => {
		try {
			const shippingDetails = await mainContract.methods.getShippingDetails(item.transaction.id).call();
			navigate('/view-shipping-details', { state: { shippingDetails: [{ shippingDetails: shippingDetails, transaction: item.transaction }], heading: `Shipping Details for Transaction ID: ${item.transaction.id}` } });
		}
		catch (error) {
			toast.error('Error fetching shipping details. Please check the console.');
			console.log(error);
		}
	};

	const handleViewRawMaterials = async (productId) => {
		try {
			const rawMaterials = await manufacturerContract.methods.getProductRawMaterials(productId).call();
			navigate('/view-raw-materials', { state: { rawMaterials: rawMaterials, heading: `Raw Materials for Product ID: ${productId}` } });
		}
		catch (error) {
			toast.error('Error fetching raw materials. Please check the console.');
			console.log(error);
		}
	};

	const handleConsumerCommentChange = (id, field, value) => {
		setConsumerComments((prevState) => ({
			...prevState,
			[id]: {
				...prevState[id],
				[field]: value,
			},
		}))
	};

	const handleAddCommentForConsumer = async (soldProduct) => {
		try {
			if (!consumerComments[soldProduct.id]?.comment) {
				toast.error("Consumer comment cannot be empty.");
				return;
			}
			if (!consumerComments[soldProduct.id]?.rating) {
				toast.error("Consumer rating cannot be empty.");
				return;
			}
			const toastId = toast.loading('Adding Comment for Consumer...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await consumerContract.methods.addConsumerComment(soldProduct.product.manufacturingUser, soldProduct.buyingUser, consumerComments[soldProduct.id]?.comment, consumerComments[soldProduct.id]?.rating, soldProduct.id).send({ from: ethAccount, gas: 30000000 });
			let currConsumerTrustScore = await mainContract.methods.getUserTrustScore(soldProduct.buyingUser.ethAddress).call();
			currConsumerTrustScore = Number(currConsumerTrustScore);
			const oldConsumerTrustScore = currConsumerTrustScore;
			if (currConsumerTrustScore + (100 * Number(consumerComments[soldProduct.id]?.rating - 3)) < 0) {
				currConsumerTrustScore = 0;
			}
			else if (currConsumerTrustScore + (100 * Number(consumerComments[soldProduct.id]?.rating - 3)) > 10000000) {
				currConsumerTrustScore = 10000000;
			}
			else {
				currConsumerTrustScore = currConsumerTrustScore + Number(100 * (consumerComments[soldProduct.id]?.rating - 3));
			}
			const r1 = await mainContract.methods.setUserTrustScore(soldProduct.buyingUser.ethAddress, currConsumerTrustScore).send({ from: ethAccount, gas: 30000000 });

			// let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(soldProduct.product.manufacturingUser.ethAddress).call();
			// currManufacturerTrustScore = Number(currManufacturerTrustScore);
			// if (currManufacturerTrustScore + 100 > 10000000) {
			// 	currManufacturerTrustScore = 10000000;
			// }
			// else {
			// 	currManufacturerTrustScore = currManufacturerTrustScore + 100;
			// }
			// const r2 = await mainContract.methods.setUserTrustScore(soldProduct.product.manufacturingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Comment for Consumer added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei. \n\n Consumer Trust Score updated from ${oldConsumerTrustScore / 100000} to ${currConsumerTrustScore / 100000}.`);
			setConsumerComments((prevState) => ({
				...prevState,
				[soldProduct.id]: {
					...prevState[soldProduct.id],
					submitted: true
				},
			}));
			await fetchProducts();
		} catch (error) {
			toast.error('Error adding consumer comment. Please check the console.');
			console.log(error);
		}
	};

	const handleProductImageChange = (productId, file) => {
		setProductImages((prevState) => ({
			...prevState,
			[productId]: file
		}));
	}

	const uploadImagetoIPFS = async (file) => {
		try {
			const upload = await pinata.upload.file(file);
			return upload.IpfsHash;
		}
		catch (err) {
			toast.error("Error uploading image to IPFS. Please try again.", err);
			console.log(err);
			return null;
		}
	};

	const formatBigInt = (value) => (typeof value === 'bigint' ? value.toString() : Number(value));

	const formatUser = (user) => ({
		id: formatBigInt(user.id),
		ethAddress: String(user.ethAddress),
		email: String(user.email),
		username: String(user.username),
		location: String(user.location),
		role: Number(user.role),
		registered: Boolean(user.registered),
	});

	const formatRawMaterial = (rawMaterial) => ({
		id: formatBigInt(rawMaterial.id),
		timestamp: formatBigInt(rawMaterial.timestamp),
		name: String(rawMaterial.name),
		quantity: formatBigInt(rawMaterial.quantity),
		description: String(rawMaterial.description),
		pricePerUnit: formatBigInt(rawMaterial.pricePerUnit),
		weightPerUnit: formatBigInt(rawMaterial.weightPerUnit),
		registeringUser: formatUser(rawMaterial.registeringUser),
	});

	const formatTransaction = (transaction) => ({
		id: formatBigInt(transaction.id),
		from: formatUser(transaction.from),
		to: formatUser(transaction.to),
		timestamp: formatBigInt(transaction.timestamp),
		pricePerUnit: formatBigInt(transaction.pricePerUnit),
		weightPerUnit: formatBigInt(transaction.weightPerUnit),
		quantity: formatBigInt(transaction.quantity),
		gasUsed: formatBigInt(transaction.gasUsed),
		description: String(transaction.description),
		status: Boolean(transaction.status),
	});

	const formatSoldRawMaterial = (soldRawMaterial) => ({
		id: formatBigInt(soldRawMaterial.id),
		rawMaterial: formatRawMaterial(soldRawMaterial.rawMaterial),
		buyingUser: formatUser(soldRawMaterial.buyingUser),
		transaction: formatTransaction(soldRawMaterial.transaction),
		receivedTimestamp: formatBigInt(soldRawMaterial.receivedTimestamp),
		received: Boolean(soldRawMaterial.received),
	});

	const uploadMetadatatoIPFS = async (product, imageHash) => {
		try {
			const rawMaterialsData = await manufacturerContract.methods.getProductRawMaterials(product.id).call();
			const rawMaterials = rawMaterialsData.map(formatSoldRawMaterial);

			const metadata = {
				id: formatBigInt(product.id),
				name: String(product.name),
				description: String(product.description),
				quantity: formatBigInt(product.quantity),
				pricePerUnit: formatBigInt(product.pricePerUnit),
				weightPerUnit: formatBigInt(product.weightPerUnit),
				rawMaterials,
				timestamp: formatBigInt(product.timestamp),
				manufacturedTimestamp: formatBigInt(product.manufacturedTimestamp),
				imageHash,
			};

			const upload = await pinata.upload.json(metadata);
			return upload.IpfsHash;
		} catch (err) {
			toast.error("Error uploading metadata to IPFS. Please try again.");
			console.error(err);
			return null;
		}
	};

	const handleManufactureProduct = async (product) => {
		try {
			if (!productImages[product.id]) {
				toast.error("Product image cannot be empty.");
				return;
			}
			const toastId = toast.loading('Manufacturing Product...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const rawMaterials = await manufacturerContract.methods.getProductRawMaterials(product.id).call();
			for (let i = 0; i < rawMaterials.length; i++) {
				if (!rawMaterials[i].received) {
					toast.error(`Sold Raw Material ID: ${rawMaterials[i].id} has not been received. Please receive all raw materials before manufacturing the product.`);
					return;
				}
			}
			const receipt = await manufacturerContract.methods.manufactureProduct(product.id).send({ from: ethAccount, gas: 30000000 });
			product = await manufacturerContract.methods.getProduct(product.id).call();
			const imageHash = await uploadImagetoIPFS(productImages[product.id]);
			if (!imageHash) {
				toast.error("Error uploading image to IPFS. Please try again.");
				return;
			}
			const metadataHash = await uploadMetadatatoIPFS(product, imageHash);
			if (!metadataHash) {
				toast.error("Error uploading metadata to IPFS. Please try again.");
				return;
			}
			// await productNFTContract.methods.manufactureProduct(metadataHash, product.id, product.manufacturingUser).send({ from: ethAccount, gas: 30000000 });
			await productNFTContract.methods.manufactureProduct(metadataHash, product.id, product.quantity, product.manufacturingUser).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Product manufactured successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error manufacturing product. Please check the console.');
			console.log(error);
		}
	};

	const handleViewSoldProductComments = async (soldProductId) => {
		try {
			const comments = await consumerContract.methods.getSoldProductComments(soldProductId).call();
			navigate('/comments', { state: { comments: comments, heading: `Comments for Sold Product ID: ${soldProductId}` } });
		}
		catch (error) {
			toast.error('Error fetching comments. Please check the console.');
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

	const handleAcceptRequest = async (requestId) => {
		try {
			const toastId = toast.loading('Accepting Product Request...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await RMContract.methods.acceptRequest(requestId).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Product request accepted successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error accepting product request. Please check the console.');
			console.log(error);
		}
	};

	const handleRejectRequest = async (requestId) => {
		try {
			const toastId = toast.loading('Rejecting Product Request...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await RMContract.methods.rejectRequest(requestId).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Product request rejected. \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error rejecting product request. Please check the console.');
			console.log(error);
		}
	};

	return (
		<div className='main'>
			<DashboardHeader web3={web3} mainContract={mainContract} userManagementContract={userManagementContract} productNFTContract={productNFTContract} username={username} ethAccount={ethAccount} logoutUser={logoutUser} heading={"Manufacturer Dashboard"} state={{ unsoldProducts, soldProducts, allRawMaterials, boughtRawMaterials, RMSComments, rawMaterialComments, requests, RMSTrustScores, consumerTrustScores, consumerComments }} />
			{allRawMaterials.length > 0 && <div>
				<h3 className='sub-heading'>Add Product</h3>
				<form onSubmit={handleAddProduct} className='form man-form'>
					<label> Name</label>
					<input
						type="text"
						placeholder="Enter Product Name"
						value={newProduct.name}
						onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
					/>
					{/* <label> Quantity</label>
					<input
						type="number"
						placeholder="Enter Product Quantity"
						value={newProduct.quantity}
						onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
					/> */}
					<label> Quantity</label>
					<input
						type="number"
						placeholder="Enter Product Quantity"
						value={newProduct.quantity}
						onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
					/>
					<label> Price per Unit</label>
					<input
						type="number"
						placeholder="Enter Product Price per Unit"
						value={newProduct.pricePerUnit}
						onChange={(e) => setNewProduct({ ...newProduct, pricePerUnit: e.target.value })}
					/>
					<label> Weight per Unit (in kg)</label>
					<input
						type="number"
						placeholder="Enter Product Weight per Unit"
						value={newProduct.weightPerUnit}
						onChange={(e) => setNewProduct({ ...newProduct, weightPerUnit: e.target.value })}
					/>
					<label> Description</label>
					<input
						type="text"
						placeholder="Enter Product Description"
						value={newProduct.description}
						onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
					/>
					<label> Choose Raw Materials: </label>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Date Added</th>
								<th>Registering User</th>
								<th>Name</th>
								<th>Quantity Available</th>
								<th>Price per Unit</th>
								<th>Weight per Unit</th>
								<th>Description</th>
								<th>RMS Trust Score</th>
								<th>RMS Comments</th>
								<th>Raw Material Comments</th>
								<th>Required</th>
								<th>Quantity Required</th>
							</tr>
						</thead>
						<tbody>
							{allRawMaterials.map((rawMaterial) => (
								<tr key={rawMaterial.id}>
									<td>{String(rawMaterial.id)}</td>
									<td>{new Date(Number(rawMaterial.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(rawMaterial.registeringUser.email)}</td>
									<td>{String(rawMaterial.name)}</td>
									<td>{String(rawMaterial.quantity)}</td>
									<td>Rs. {String(rawMaterial.pricePerUnit)}</td>
									<td>{String(rawMaterial.weightPerUnit)} kg</td>
									<td>{String(rawMaterial.description)}</td>
									<td>{String(Number(RMSTrustScores[rawMaterial.registeringUser.ethAddress]) / 100000)}</td>
									<td><a className='comment-link' onClick={() => handleViewRMSComments(rawMaterial.registeringUser)} target="_blank">View RMS Comments</a></td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterialComments(rawMaterial.id)} target="_blank">View Raw Material Comments</a></td>
									<td><input type="checkbox" onChange={(e) => handleRawMaterialCheckboxChange(e, rawMaterial.id)} checked={newProduct.rawMaterialIds.includes(rawMaterial.id)} /></td>
									<td><input type="number" value={newProduct.rawMaterialQuantities[newProduct.rawMaterialIds.indexOf(rawMaterial.id)]} onChange={(e) => handleRawMaterialQuantityChange(e, newProduct.rawMaterialIds.indexOf(rawMaterial.id), parseInt(rawMaterial.quantity))} disabled={!newProduct.rawMaterialIds.includes(rawMaterial.id)} /></td>
								</tr>
							))}
						</tbody>
					</table>
					<button type="submit">Add Product</button>
				</form>
			</div>}
			{boughtRawMaterials.filter(soldRawMaterial => !soldRawMaterial.received).length ? (<><h3 className='sub-heading'>Bought Raw Materials</h3>
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
							<th>Raw Material Supplier Bought From</th>
							<th>RMS Trust Score</th>
							<th>Shipping Details</th>
							<th>Mark as Received</th>
						</tr>
					</thead>
					<tbody>
						{boughtRawMaterials.filter(soldRawMaterial => !soldRawMaterial.received).map((soldRawMaterial) => (
							<tr key={soldRawMaterial.id}>
								<td>{String(soldRawMaterial.id)}</td>
								<td>{new Date(Number(soldRawMaterial.rawMaterial.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldRawMaterial.rawMaterial.name)}</td>
								<td>{String(soldRawMaterial.transaction.quantity)}</td>
								<td>Rs. {String(soldRawMaterial.rawMaterial.pricePerUnit)}</td>
								<td>Rs. {String(soldRawMaterial.transaction.pricePerUnit * soldRawMaterial.transaction.quantity)}</td>
								<td>{String(soldRawMaterial.rawMaterial.description)}</td>
								<td>{new Date(Number(soldRawMaterial.transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldRawMaterial.rawMaterial.registeringUser.email)}</td>
								<td>{String(Number(RMSTrustScores[soldRawMaterial.rawMaterial.registeringUser.ethAddress]) / 100000)}</td>
								<td><a className='comment-link' onClick={() => handleViewShippingDetails(soldRawMaterial)} target="_blank">View Shipping Details</a></td>
								<td><button className="table-button" onClick={() => handleMarkAsReceived(soldRawMaterial)}>Mark as Received</button></td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
			{boughtRawMaterials.filter(soldRawMaterial => soldRawMaterial.received).length ? (<><h3 className='sub-heading'>Received Raw Materials</h3>
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
							<th>RMS Trust Score</th>
							<th>Shipping Details</th>
							{/* <th>Add Comment for Raw Material Supplier</th> */}
							<th>Add Comment for Raw Material</th>
						</tr>
					</thead>
					<tbody>
						{boughtRawMaterials.filter(soldRawMaterial => soldRawMaterial.received).map((soldRawMaterial) => (
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
								<td>{String(Number(RMSTrustScores[soldRawMaterial.rawMaterial.registeringUser.ethAddress]) / 100000)}</td>
								<td><a className='comment-link' onClick={() => handleViewShippingDetails(soldRawMaterial)} target="_blank">View Shipping Details</a></td>
								{/* <td>{
									RMSComments[soldRawMaterial.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {RMSComments[soldRawMaterial.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {RMSComments[soldRawMaterial.id]?.rating} ⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={RMSComments[soldRawMaterial.id]?.comment || ''} onChange={(e) => handleRMSCommentChange(soldRawMaterial.id, "comment", e.target.value)} />
											<select value={RMSComments[soldRawMaterial.id]?.rating || ""} onChange={(e) => handleRMSCommentChange(soldRawMaterial.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForRawMaterialSupplier(soldRawMaterial)}>Add Comment</button>
										</div>
									)
								}</td> */}
								<td>{
									rawMaterialComments[soldRawMaterial.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {rawMaterialComments[soldRawMaterial.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {rawMaterialComments[soldRawMaterial.id]?.rating}⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={rawMaterialComments[soldRawMaterial.id]?.comment || ''} onChange={(e) => handleRawMaterialCommentChange(soldRawMaterial.id, "comment", e.target.value)} />
											<select value={rawMaterialComments[soldRawMaterial.id]?.rating || ""} onChange={(e) => handleRawMaterialCommentChange(soldRawMaterial.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForRawMaterial(soldRawMaterial)}>Add Comment</button>
										</div>
									)
								}</td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
			{
				unsoldProducts.filter(product => !product.manufactured).length ? (<><h3 className='sub-heading'>Unmanufactured Products</h3>
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
								<th>Raw Materials</th>
								<th>Product Image</th>
								<th>Manufacture Product</th>
							</tr>
						</thead>
						<tbody>
							{unsoldProducts.filter(product => !product.manufactured).map((product) => (
								<tr key={product.id}>
									<td>{String(product.id)}</td>
									<td>{new Date(Number(product.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(product.name)}</td>
									<td>{String(product.quantity)}</td>
									<td>Rs. {String(product.pricePerUnit)}</td>
									<td>{String(product.weightPerUnit)} kg</td>
									<td>{String(product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(product.id)} target="_blank">View Raw Materials</a></td>
									<td><input type="file" accept="image/*" onChange={(e) => handleProductImageChange(product.id, e.target.files[0])} /></td>
									<td><button className="table-button" onClick={() => handleManufactureProduct(product)}>Manufacture Product</button></td>
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			}
			{
				unsoldProducts.filter(product => product.manufactured).length ? (<><h3 className='sub-heading'>Manufactured Products</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Date Added</th>
								<th>Name</th>
								<th>Date Manufactured</th>
								<th>Quantity</th>
								<th>Price per Unit</th>
								<th>Weight per Unit</th>
								<th>Description</th>
								<th>Raw Materials</th>
								<th>NFT</th>
							</tr>
						</thead>
						<tbody>
							{unsoldProducts.filter(product => product.manufactured).map((product) => (
								<tr key={product.id}>
									<td>{String(product.id)}</td>
									<td>{new Date(Number(product.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(product.name)}</td>
									<td>{new Date(Number(product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(product.quantity)}</td>
									<td>Rs. {String(product.pricePerUnit)}</td>
									<td>{String(product.weightPerUnit)} kg</td>
									<td>{String(product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(product.id)} target="_blank">View NFT</a></td>
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			}
			{soldProducts.filter(soldProduct => !soldProduct.received).length ? (<><h3 className='sub-heading'>Pending Products</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Date Added</th>
							<th>Name</th>
							<th>Date Manufactured</th>
							<th>Quantity Purchased</th>
							<th>Price per Unit</th>
							<th>Total Price</th>
							<th>Description</th>
							<th>Date Sold</th>
							<th>Consumer Sold To</th>
							<th>Consumer Trust Score</th>
							<th>Raw Materials</th>
							<th>NFT</th>
							<th>Shipping Details</th>
							<th>Add Comment for Consumer</th>
						</tr>
					</thead>
					<tbody>
						{soldProducts.filter(soldProduct => !soldProduct.received).map((soldProduct) => (
							<tr key={soldProduct.id}>
								<td>{String(soldProduct.id)}</td>
								<td>{new Date(Number(soldProduct.product.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldProduct.product.name)}</td>
								<td>{new Date(Number(soldProduct.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldProduct.transaction.quantity)}</td>
								<td>Rs. {String(soldProduct.product.pricePerUnit)}</td>
								<td>{String(soldProduct.transaction.pricePerUnit * soldProduct.transaction.quantity)}</td>
								<td>{String(soldProduct.product.description)}</td>
								<td>{new Date(Number(soldProduct.transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldProduct.buyingUser.email)}</td>
								<td>{String(Number(consumerTrustScores[soldProduct.buyingUser.ethAddress]) / 100000)}</td>
								<td><a className='comment-link' onClick={() => handleViewRawMaterials(soldProduct.product.id)} target="_blank">View Raw Materials</a></td>
								<td><a className='comment-link' onClick={() => handleViewNFT(soldProduct.product.id)} target="_blank">View NFT</a></td>
								<td><a className='comment-link' onClick={() => handleViewShippingDetails(soldProduct)} target="_blank">View Shipping Details</a></td>
								<td>{
									consumerComments[soldProduct.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {consumerComments[soldProduct.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {consumerComments[soldProduct.id]?.rating}⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={consumerComments[soldProduct.id]?.comment || ''} onChange={(e) => handleConsumerCommentChange(soldProduct.id, "comment", e.target.value)} />
											<select value={consumerComments[soldProduct.id]?.rating || ""} onChange={(e) => handleConsumerCommentChange(soldProduct.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForConsumer(soldProduct)}>Add Comment</button>
										</div>
									)
								}</td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
			{soldProducts.filter(soldProduct => soldProduct.received).length ? (<><h3 className='sub-heading'>Received Products</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Date Added</th>
							<th>Name</th>
							<th>Date Manufactured</th>
							<th>Quantity Purchased</th>
							<th>Price per Unit</th>
							<th>Total Price</th>
							<th>Description</th>
							<th>Date Sold</th>
							<th>Date Received</th>
							<th>Consumer Sold To</th>
							<th>Consumer Trust Score</th>
							<th>Raw Materials</th>
							<th>NFT</th>
							<th>Shipping Details</th>
							<th>Comments from Consumer</th>
							<th>Add Comment for Consumer</th>
						</tr>
					</thead>
					<tbody>
						{soldProducts.filter(soldProduct => soldProduct.received).map((soldProduct) => (
							<tr key={soldProduct.id}>
								<td>{String(soldProduct.id)}</td>
								<td>{new Date(Number(soldProduct.product.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldProduct.product.name)}</td>
								<td>{new Date(Number(soldProduct.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldProduct.transaction.quantity)}</td>
								<td>Rs. {String(soldProduct.product.pricePerUnit)}</td>
								<td>{String(soldProduct.transaction.quantity * soldProduct.transaction.pricePerUnit)}</td>
								<td>{String(soldProduct.product.description)}</td>
								<td>{new Date(Number(soldProduct.transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{new Date(Number(soldProduct.receivedTimestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(soldProduct.buyingUser.email)}</td>
								<td>{String(Number(consumerTrustScores[soldProduct.buyingUser.ethAddress]) / 100000)}</td>
								<td><a className='comment-link' onClick={() => handleViewRawMaterials(soldProduct.id)} target="_blank">View Raw Materials</a></td>
								<td><a className='comment-link' onClick={() => handleViewNFT(soldProduct.id)} target="_blank">View NFT</a></td>
								<td><a className='comment-link' onClick={() => handleViewShippingDetails(soldProduct)} target="_blank">View Shipping Details</a></td>
								<td><a className='comment-link' onClick={() => handleViewSoldProductComments(soldProduct.id)} target='_blank'>View Comments</a></td>
								<td>{
									consumerComments[soldProduct.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {consumerComments[soldProduct.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {consumerComments[soldProduct.id]?.rating}⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={consumerComments[soldProduct.id]?.comment || ''} onChange={(e) => handleConsumerCommentChange(soldProduct.id, "comment", e.target.value)} />
											<select value={consumerComments[soldProduct.id]?.rating || ""} onChange={(e) => handleConsumerCommentChange(soldProduct.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForConsumer(soldProduct)}>Add Comment</button>
										</div>
									)
								}</td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
			{
				requests.filter(request => Number(request.status) === 0).length ? (<><h3 className='sub-heading'>Pending Requests</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>From</th>
								<th>Consumer Trust Score</th>
								<th>Consumer Comments</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Manufactured Date</th>
								<th>Product Quantity Available</th>
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								<th>Product NFT</th>
								<th>Quantity Requested</th>
								<th>Respond to Request</th>
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 0).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.requestingUser.email)}</td>
									<td>{String(Number(consumerTrustScores[request.requestingUser.ethAddress]) / 100000)}</td>
									<td><a className='comment-link' onClick={() => handleViewConsumerComments(request.requestingUser)} target="_blank">View Consumer Comments</a></td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.quantity)}</td>
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(request.product.id)} target="_blank">View NFT</a></td>
									<td>{String(request.quantity)}</td>
									<td><button onClick={() => handleAcceptRequest(request.id)} className='table-button'>Accept Request</button>
										<button className="table-button" onClick={() => handleRejectRequest(request.id)}>Reject Request</button></td>
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			}
			{
				requests.filter(request => Number(request.status) === 1).length ? (<><h3 className='sub-heading'>Accepted Requests</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>From</th>
								<th>Consumer Trust Score</th>
								<th>Consumer Comments</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Manufactured Date</th>
								<th>Product Quantity Available</th>
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								<th>Product NFT</th>
								<th>Quantity Requested</th>
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 1).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.requestingUser.email)}</td>
									<td>{String(Number(consumerTrustScores[request.requestingUser.ethAddress]) / 100000)}</td>
									<td><a className='comment-link' onClick={() => handleViewConsumerComments(request.requestingUser)} target="_blank">View Consumer Comments</a></td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.quantity)}</td>
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(request.product.id)} target="_blank">View NFT</a></td>
									<td>{String(request.quantity)}</td>
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			}
			{
				requests.filter(request => Number(request.status) === 2).length ? (<><h3 className='sub-heading'>Rejected Requests</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>From</th>
								<th>Consumer Trust Score</th>
								<th>Consumer Comments</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Manufactured Date</th>
								<th>Product Quantity Available</th>
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								<th>Product NFT</th>
								<th>Quantity Requested</th>
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 2).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.requestingUser.email)}</td>
									<td>{String(Number(consumerTrustScores[request.requestingUser.ethAddress]) / 100000)}</td>
									<td><a className='comment-link' onClick={() => handleViewConsumerComments(request.requestingUser)} target="_blank">View Consumer Comments</a></td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.quantity)}</td>
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(request.product.id)} target="_blank">View NFT</a></td>
									<td>{String(request.quantity)}</td>
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			}
			{
				requests.filter(request => Number(request.status) === 3).length ? (<><h3 className='sub-heading'>Fulfilled Requests</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>From</th>
								<th>Consumer Trust Score</th>
								<th>Consumer Comments</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Manufactured Date</th>
								<th>Product Quantity Available</th>
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								<th>Product NFT</th>
								<th>Quantity Requested</th>
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 3).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.requestingUser.email)}</td>
									<td>{String(Number(consumerTrustScores[request.requestingUser.ethAddress]) / 100000)}</td>
									<td><a className='comment-link' onClick={() => handleViewConsumerComments(request.requestingUser)} target="_blank">View Consumer Comments</a></td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.quantity)}</td>
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(request.product.id)} target="_blank">View NFT</a></td>
									<td>{String(request.quantity)}</td>
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			}
		</div>
	);
}

export default ManufacturerDashboard;