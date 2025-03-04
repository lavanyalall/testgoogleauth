import React from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "react-hot-toast";
import { useEffect, useState } from 'react';
import { AES, enc } from 'crypto-js';
import axios from "axios";
import "./Dashboard.css";
import DashboardHeader from './DashboardHeader';

const ConsumerDashboard = ({ web3, userManagementContract, consumerContract, manufacturerContract, RMContract, mainContract, productNFTContract, googleId, username, ethAccount, logoutUser, emailId }) => {
	const navigate = useNavigate();
	const [boughtProducts, setBoughtProducts] = useState([]);
	const [receivedProducts, setReceivedProducts] = useState([]);
	const [allProducts, setAllProducts] = useState([]);
	const [productQuantities, setProductQuantities] = useState({});
	const [requests, setRequests] = useState([]);
	const [manufacturerComments, setManufacturerComments] = useState({});
	const [productComments, setProductComments] = useState({});
	const [manufacturerTrustScores, setManufacturerTrustScores] = useState({});
	const [requestedProductIds, setRequestedProductIds] = useState(new Set());

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
		const currBoughtProducts = await consumerContract.methods.getUserBoughtProducts(ethAccount).call();
		setBoughtProducts(currBoughtProducts);
		const currReceivedProducts = await consumerContract.methods.getUserReceivedProducts(ethAccount).call();
		setReceivedProducts(currReceivedProducts);
		const currAllProducts = await manufacturerContract.methods.getAllManufacturedProducts().call();
		setAllProducts(currAllProducts);
		const currRequests = await RMContract.methods.getConsumerProductRequests(ethAccount).call();
		setRequests(currRequests);
		const currManufacturerTrustScores = {};
		const currProductComments = {};
		for (let i = 0; i < currBoughtProducts.length; i++) {
			const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currBoughtProducts[i].product.manufacturingUser.ethAddress).call();
			currManufacturerTrustScores[currBoughtProducts[i].product.manufacturingUser.ethAddress] = currManufacturerTrustScore;
			const commentId = await consumerContract.methods.getToManufacturerComment(ethAccount, currBoughtProducts[i].id).call();
			if (commentId) {
				const comment = await mainContract.methods.getComment(commentId).call();
				currProductComments[currBoughtProducts[i].id] = {};
				currProductComments[currBoughtProducts[i].id].comment = comment.comment;
				currProductComments[currBoughtProducts[i].id].rating = Number(comment.rating);
				currProductComments[currBoughtProducts[i].id].submitted = true;
			}
		}
		for (let i = 0; i < currReceivedProducts.length; i++) {
			const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currReceivedProducts[i].product.manufacturingUser.ethAddress).call();
			currManufacturerTrustScores[currReceivedProducts[i].product.manufacturingUser.ethAddress] = currManufacturerTrustScore;
			const commentId = await consumerContract.methods.getToManufacturerComment(ethAccount, currReceivedProducts[i].id).call();
			if (commentId) {
				const comment = await mainContract.methods.getComment(commentId).call();
				currProductComments[currReceivedProducts[i].id] = {};
				currProductComments[currReceivedProducts[i].id].comment = comment.comment;
				currProductComments[currReceivedProducts[i].id].rating = Number(comment.rating);
				currProductComments[currReceivedProducts[i].id].submitted = true;
			}
		}
		setProductComments(currProductComments);
		for (let i = 0; i < currAllProducts.length; i++) {
			const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currAllProducts[i].manufacturingUser.ethAddress).call();
			currManufacturerTrustScores[currAllProducts[i].manufacturingUser.ethAddress] = currManufacturerTrustScore;
		}
		for (let i = 0; i < currRequests.length; i++) {
			const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currRequests[i].product.manufacturingUser.ethAddress).call();
			currManufacturerTrustScores[currRequests[i].product.manufacturingUser.ethAddress] = currManufacturerTrustScore;
		}
		setRequestedProductIds(new Set(currRequests.map(request => request.product.id)));
		setManufacturerTrustScores(currManufacturerTrustScores);
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

	const handleViewManufacturerComments = async (user) => {
		try {
			const comments = await mainContract.methods.getUserReceivedComments(user.ethAddress).call();
			navigate('/comments', { state: { comments: comments, heading: `Comments for Manufacturer: ${user.username}` } });
		}
		catch (error) {
			toast.error('Error fetching manufacturer comments. Please check the console.');
			console.log(error);
		}
	};

	const handleViewProductComments = async (id) => {
		try {
			const comments = await consumerContract.methods.getProductComments(id).call();
			navigate('/comments', { state: { comments: comments, heading: `Comments for Raw Material ID: ${id}` } });
		}
		catch (error) {
			toast.error('Error fetching product comments. Please check the console.');
			console.log(error);
		}
	};

	const fetchProducts = async () => {
		try {
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const currBoughtProducts = await consumerContract.methods.getUserBoughtProducts(ethAccount).call();
			setBoughtProducts(currBoughtProducts);
			const currReceivedProducts = await consumerContract.methods.getUserReceivedProducts(ethAccount).call();
			setReceivedProducts(currReceivedProducts);
			const currAllProducts = await manufacturerContract.methods.getAllManufacturedProducts().call();
			setAllProducts(currAllProducts);
			const currRequests = await RMContract.methods.getConsumerProductRequests(ethAccount).call();
			setRequests(currRequests);
			const currManufacturerTrustScores = {};
			const currProductComments = {};
			for (let i = 0; i < currBoughtProducts.length; i++) {
				const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currBoughtProducts[i].product.manufacturingUser.ethAddress).call();
				currManufacturerTrustScores[currBoughtProducts[i].product.manufacturingUser.ethAddress] = currManufacturerTrustScore;
				const commentId = await consumerContract.methods.getToManufacturerComment(ethAccount, currBoughtProducts[i].id).call();
				if (commentId) {
					const comment = await mainContract.methods.getComment(commentId).call();
					currProductComments[currBoughtProducts[i].id] = {};
					currProductComments[currBoughtProducts[i].id].comment = comment.comment;
					currProductComments[currBoughtProducts[i].id].rating = Number(comment.rating);
					currProductComments[currBoughtProducts[i].id].submitted = true;
				}
			}
			for (let i = 0; i < currReceivedProducts.length; i++) {
				const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currReceivedProducts[i].product.manufacturingUser.ethAddress).call();
				currManufacturerTrustScores[currReceivedProducts[i].product.manufacturingUser.ethAddress] = currManufacturerTrustScore;
				const commentId = await consumerContract.methods.getToManufacturerComment(ethAccount, currReceivedProducts[i].id).call();
				if (commentId) {
					const comment = await mainContract.methods.getComment(commentId).call();
					currProductComments[currReceivedProducts[i].id] = {};
					currProductComments[currReceivedProducts[i].id].comment = comment.comment;
					currProductComments[currReceivedProducts[i].id].rating = Number(comment.rating);
					currProductComments[currReceivedProducts[i].id].submitted = true;
				}
			}
			setProductComments(currProductComments);
			for (let i = 0; i < currAllProducts.length; i++) {
				const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currAllProducts[i].manufacturingUser.ethAddress).call();
				currManufacturerTrustScores[currAllProducts[i].manufacturingUser.ethAddress] = currManufacturerTrustScore;
			}
			for (let i = 0; i < currRequests.length; i++) {
				const currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(currRequests[i].product.manufacturingUser.ethAddress).call();
				currManufacturerTrustScores[currRequests[i].product.manufacturingUser.ethAddress] = currManufacturerTrustScore;
			}
			setRequestedProductIds(new Set(currRequests.map(request => request.product.id)));
			setManufacturerTrustScores(currManufacturerTrustScores);
		} catch (error) {
			toast.error('Error fetching products. Please check the console.');
		}
	};

	const handleProductQuantityChange = (e, productId, quantityAvailable) => {
		const value = parseInt(e.target.value, 10);
		if (value > quantityAvailable) {
			toast.error('Entered quantity exceeds stock. Please enter a valid quantity.');
			return;
		}
		if (value <= 0) {
			toast.error('Quantity must be greater than 0. Please enter a valid quantity.');
			return;
		}
		setProductQuantities(prevQuantities => ({
			...prevQuantities,
			[productId]: value
		}));
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

	const handleRequestProduct = async (productId) => {
		try {
			if (!productQuantities?.productId) {
				setProductQuantities(prevQuantities => ({
					...prevQuantities,
					[productId]: 1
				}))
			}
			const toastId = toast.loading('Requesting Product...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const googleIdHash = web3.utils.sha3(googleId);
			// const receipt = await RMContract.methods.requestProduct(productId, 1, googleIdHash).send({ from: ethAccount, gas: 30000000 });
			const receipt = await RMContract.methods.requestProduct(productId, productQuantities[productId], googleIdHash).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Product Requested successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error requesting product. Please check the console.');
			console.log(error);
		}
	};

	const handleBuyProduct = async (request) => {
		try {
			const toastId = toast.loading('Buying Product...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const googleIdHash = web3.utils.sha3(googleId);
			const productToken = await productNFTContract.methods.getProductNFT(request.product.id).call();
			// await productNFTContract.methods.buyProduct(productToken.tokenId, request.requestingUser).send({ from: ethAccount, gas: 30000000 });
			await productNFTContract.methods.buyProduct(request.product.id, request.quantity, request.product.manufacturingUser.ethAddress, request.requestingUser).send({ from: ethAccount, gas: 30000000 });
			const receipt = await consumerContract.methods.buyProduct(request.id).send({ from: ethAccount, gas: 30000000 });
			const transactionRecipt = await web3.eth.getTransactionReceipt(receipt.transactionHash);
			const block = await web3.eth.getBlock(receipt.blockNumber);
			const timestamp = block.timestamp;
			const transactionStatus = Boolean(transactionRecipt.status);
			const gasUsed = transactionRecipt.gasUsed;
			const r = await consumerContract.methods.markProductAsSold(request.id, transactionStatus, timestamp, gasUsed, googleIdHash).send({ from: ethAccount, gas: 30000000 });
			const transactionId = r.events.getTransactionId.returnValues.transactionId;
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
				let shippingDetails = "";
				const params = 'pickup_postcode=' + request.product.manufacturingUser.location + '&delivery_postcode=' + request.requestingUser.location + '&weight=' + request.quantity * request.product.weightPerUnit + '&declared_value=' + request.quantity * request.product.pricePerUnit + '&cod=1' + '&rate_calculator=1' + '&blocked=1' + '&is_return=0' + '&is_web=1' + '&is_dg=0' + '&only_qc_couriers=0';
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
					const r = await mainContract.methods.addShippingDetails(transactionId, String(courierName), parseInt(Math.round(courierRating)), parseInt(Math.round(estimatedDeliveryTime)), parseInt(Math.round(shippingCharges))).send({ from: ethAccount, gas: 30000000 });
				}
			}
			toast.dismiss(toastId);
			toast.success(`Product Bought successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${r.gasUsed} gwei.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error buying product. Please check the console.');
			console.log(error);
		}
	};

	const handleMarkAsReceived = async (soldProduct) => {
		try {
			const toastId = toast.loading('Receiving product...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await consumerContract.methods.receiveProduct(soldProduct.id).send({ from: ethAccount, gas: 30000000 });
			let currConsumerTrustScore = await mainContract.methods.getUserTrustScore(soldProduct.buyingUser.ethAddress).call();
			currConsumerTrustScore = Number(currConsumerTrustScore);
			if (currConsumerTrustScore + 100 > 10000000) {
				currConsumerTrustScore = 10000000;
			}
			else {
				currConsumerTrustScore = currConsumerTrustScore + 100;
			}
			// if (currConsumerTrustScore + (Number(soldProduct.transaction.pricePerUnit) * Number(soldProduct.transaction.quantity)) > 10000000) {
			// 	currConsumerTrustScore = 10000000;
			// }
			// else {
			// 	currConsumerTrustScore = currConsumerTrustScore + Number(soldProduct.transaction.pricePerUnit) * Number(soldProduct.transaction.quantity);
			// }
			const r1 = await mainContract.methods.setUserTrustScore(soldProduct.buyingUser.ethAddress, currConsumerTrustScore).send({ from: ethAccount, gas: 30000000 });
			let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(soldProduct.product.manufacturingUser.ethAddress).call();
			currManufacturerTrustScore = Number(currManufacturerTrustScore);
			if (currManufacturerTrustScore + 100 > 10000000) {
				currManufacturerTrustScore = 10000000;
			}
			else {
				currManufacturerTrustScore = currManufacturerTrustScore + 100;
			}
			// if (currManufacturerTrustScore + (Number(soldProduct.transaction.pricePerUnit) * Number(soldProduct.transaction.quantity)) > 10000000) {
			// 	currManufacturerTrustScore = 10000000;
			// }
			// else {
			// 	currManufacturerTrustScore = currManufacturerTrustScore + Number(soldProduct.transaction.pricePerUnit) * Number(soldProduct.transaction.quantity);
			// }
			const r2 = await mainContract.methods.setUserTrustScore(soldProduct.product.manufacturingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Product received successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			await fetchProducts();
		} catch (error) {
			toast.error('Error receiving product. Please check the console.');
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
		}))
	};

	const handleProductCommentChange = (id, field, value) => {
		setProductComments((prevState) => ({
			...prevState,
			[id]: {
				...prevState[id],
				[field]: value,
			},
		}))
	};

	// const handleAddCommentForManufacturer = async (receivedProduct) => {
	// 	try {
	// 		if (!manufacturerComments[receivedProduct.id]?.comment) {
	// 			toast.error("Manufacturer comment cannot be empty.");
	// 			return;
	// 		}
	// 		if(!manufacturerComments[receivedProduct.id]?.rating){
	// 			toast.error("Manufacturer rating cannot be empty.");
	// 			return;
	// 		}
	// 		const toastId = toast.loading('Adding Comment for Manufacturer...');
	// 		const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
	// 		const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
	// 		await web3.eth.personal.unlockAccount(ethAccount, password, 600);
	// 		const receipt = await mainContract.methods.addComment(receivedProduct.buyingUser, receivedProduct.product.manufacturingUser, manufacturerComments[receivedProduct.id]?.comment, manufacturerComments[receivedProduct.id]?.rating).send({ from: ethAccount, gas: 30000000 });
	// 		// let currConsumerTrustScore = await mainContract.methods.getUserTrustScore(receivedProduct.buyingUser.ethAddress).call();
	// 		// currConsumerTrustScore = Number(currConsumerTrustScore);
	// 		// if (currConsumerTrustScore + 100 > 10000000) {
	// 		// 	currConsumerTrustScore = 10000000;
	// 		// }
	// 		// else {
	// 		// 	currConsumerTrustScore = currConsumerTrustScore + 100;
	// 		// }
	// 		// const r1 = await mainContract.methods.setUserTrustScore(receivedProduct.buyingUser.ethAddress, currConsumerTrustScore).send({ from: ethAccount, gas: 30000000 });

	// 		let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(receivedProduct.product.manufacturingUser.ethAddress).call();
	// 		currManufacturerTrustScore = Number(currManufacturerTrustScore);
	// 		if (currManufacturerTrustScore + (100 * Number(manufacturerComments[receivedProduct.id]?.rating - 3)) < 0) {
	// 			currManufacturerTrustScore = 0;
	// 		}
	// 		else if (currManufacturerTrustScore + (100 * Number(manufacturerComments[receivedProduct.id]?.rating - 3)) > 10000000) {
	// 			currManufacturerTrustScore = 10000000;
	// 		}
	// 		else {
	// 			currManufacturerTrustScore = currManufacturerTrustScore + (100 * Number(manufacturerComments[receivedProduct.id]?.rating - 3));
	// 		}
	// 		const r2 = await mainContract.methods.setUserTrustScore(receivedProduct.product.manufacturingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
	// 		toast.dismiss(toastId);
	// 		toast.success(`Comment for Manufacturer added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
	// 		setManufacturerComments((prevState) => ({
	// 			...prevState,
	// 			[receivedProduct.id]: {
	// 				...prevState[receivedProduct.id],
	// 				submitted: true
	// 			},
	// 		}));
	// 		await fetchProducts();
	// 	} catch (error) {
	// 		toast.error('Error adding manufacturer comment. Please check the console.');
	// 		console.log(error);
	// 	}
	// };

	const handleAddCommentForProduct = async (receivedProduct) => {
		try {
			if (!productComments[receivedProduct.id]?.comment) {
				toast.error("Product comment cannot be empty.");
				return;
			}
			if (!productComments[receivedProduct.id]?.rating) {
				toast.error("Product rating cannot be empty.");
				return;
			}
			const toastId = toast.loading('Adding Comment for Product...');
			const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
			const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
			await web3.eth.personal.unlockAccount(ethAccount, password, 600);
			const receipt = await consumerContract.methods.addSoldProductComment(receivedProduct, productComments[receivedProduct.id]?.comment, productComments[receivedProduct.id]?.rating).send({ from: ethAccount, gas: 30000000 });
			// let currConsumerTrustScore = await mainContract.methods.getUserTrustScore(receivedProduct.buyingUser.ethAddress).call();
			// currConsumerTrustScore = Number(currConsumerTrustScore);
			// if (currConsumerTrustScore + 100 > 10000000) {
			// 	currConsumerTrustScore = 10000000;
			// }
			// else {
			// 	currConsumerTrustScore = currConsumerTrustScore + 100;
			// }
			// const r1 = await mainContract.methods.setUserTrustScore(receivedProduct.buyingUser.ethAddress, currConsumerTrustScore).send({ from: ethAccount, gas: 30000000 });

			let currManufacturerTrustScore = await mainContract.methods.getUserTrustScore(receivedProduct.product.manufacturingUser.ethAddress).call();
			currManufacturerTrustScore = Number(currManufacturerTrustScore);
			if (currManufacturerTrustScore + (100 * Number(productComments[receivedProduct.id]?.rating - 3)) < 0) {
				currManufacturerTrustScore = 0;
			}
			else if (currManufacturerTrustScore + (100 * Number(productComments[receivedProduct.id]?.rating - 3)) > 10000000) {
				currManufacturerTrustScore = 10000000;
			}
			else {
				currManufacturerTrustScore = currManufacturerTrustScore + (100 * Number(productComments[receivedProduct.id]?.rating - 3));
			}
			const r2 = await mainContract.methods.setUserTrustScore(receivedProduct.product.manufacturingUser.ethAddress, currManufacturerTrustScore).send({ from: ethAccount, gas: 30000000 });
			toast.dismiss(toastId);
			toast.success(`Comment for Product added successfully! \n\n Transaction completed through Ethereum Account: ${ethAccount} associated with E-mail ID: ${emailId}. \n\n Gas used in transaction: ${receipt.gasUsed} gwei.`);
			setProductComments((prevState) => ({
				...prevState,
				[receivedProduct.id]: {
					...prevState[receivedProduct.id],
					submitted: true
				},
			}));
			await fetchProducts();
		} catch (error) {
			toast.error('Error adding product comment. Please check the console.');
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
	}

	return (
		<div>
			<DashboardHeader web3={web3} mainContract={mainContract} userManagementContract={userManagementContract} productNFTContract={productNFTContract} username={username} ethAccount={ethAccount} logoutUser={logoutUser} heading={"Consumer Dashboard"} state={{ boughtProducts, receivedProducts, allProducts, requests, manufacturerComments, productComments, manufacturerTrustScores }} />
			{
				allProducts.filter(product => !requestedProductIds.has(product.id)).length > 0 ? (<><h3 className='sub-heading'>Request Product</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Date Added</th>
								<th>Manufacturer</th>
								<th>Date Manufactured</th>
								<th>Name</th>
								{/* <th>Quantity Available</th> */}
								<th>Quantity Available</th>
								<th>Price per Unit</th>
								<th>Weight Per Unit</th>
								<th>Description</th>
								<th>Raw Materials</th>
								<th>Manufacturer Trust Score</th>
								<th>Manufacturer Comments</th>
								<th>Product Comments</th>
								<th>NFT</th>
								{/* <th>Quantity Required</th> */}
								<th>Quantity Required</th>
								<th>Request</th>
							</tr>
						</thead>
						<tbody>
							{allProducts.filter(product => !requestedProductIds.has(product.id)).map((product) => (
								<tr key={product.id}>
									<td>{String(product.id)}</td>
									<td>{new Date(Number(product.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(product.manufacturingUser.email)}</td>
									<td>{new Date(Number(product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(product.name)}</td>
									{/* <td>{String(product.quantity)}</td> */}
									<td>{String(product.quantity)}</td>
									<td>Rs. {String(product.pricePerUnit)}</td>
									<td>{String(product.weightPerUnit)} kg</td>
									<td>{String(product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(product.id)} target="_blank">View Raw Materials</a></td>
									<td>{String(Number(manufacturerTrustScores[product.manufacturingUser.ethAddress]) / 100000)}</td>
									<td><a className='comment-link' onClick={() => handleViewManufacturerComments(product.manufacturingUser)} target="_blank">View Manufacturer Comments</a></td>
									<td><a className='comment-link' onClick={() => handleViewProductComments(product.id)} target="_blank">View Product Comments</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(product.id)} target="_blank">View NFT</a></td>
									{/* <td><input type="number" value={productQuantities?.product.id} onChange={(e) => handleProductQuantityChange(e, product.id, parseInt(product.quantity))} /></td> */}
									<td><input type="number" value={productQuantities?.product?.id} onChange={(e) => handleProductQuantityChange(e, product.id, parseInt(product.quantity))} /></td>
									<td><button className="table-button" onClick={() => handleRequestProduct(product.id)}>Request Product</button></td>
								</tr>
							))}
						</tbody>
					</table></>
				) : (<></>)
			}
			{
				requests.filter(request => Number(request.status) === 0).length ? (<><h3 className='sub-heading'>Pending Requests</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Manufacturer Requested From</th>
								<th>Manufacturer Trust Scores</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Date Manufactured</th>
								{/* <th>Product Quantity Available</th> */}
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								<th>Manufacturer Comments</th>
								<th>Product Comments</th>
								<th>Product NFT</th>
								{/* <th>Quantity Requested</th> */}
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 0).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.product.manufacturingUser.email)}</td>
									<td>{String(Number(manufacturerTrustScores[request.product.manufacturingUser.ethAddress]) / 100000)}</td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									{/* <td>{String(request.product.quantity)}</td> */}
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewManufacturerComments(request.product.manufacturingUser)} target="_blank">View Manufacturer Comments</a></td>
									<td><a className='comment-link' onClick={() => handleViewProductComments(request.product.id)} target="_blank">View Product Comments</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(request.product.id)} target="_blank">View NFT</a></td>
									{/* <td>{String(request.quantity)}</td> */}
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
								<th>Manufacturer Requested From</th>
								<th>Manufacturer Trust Score</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Date Manufactured</th>
								{/* <th>Product Quantity Available</th> */}
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								<th>Manufacturer Comments</th>
								<th>Product Comments</th>
								<th>Product NFT</th>
								{/* <th>Quantity Requested</th> */}
								<th>Buy</th>
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 1).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.product.manufacturingUser.email)}</td>
									<td>{String(Number(manufacturerTrustScores[request.product.manufacturingUser.ethAddress]) / 100000)}</td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									{/* <td>{String(request.product.quantity)}</td> */}
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewManufacturerComments(request.product.manufacturingUser)} target="_blank">View Manufacturer Comments</a></td>
									<td><a className='comment-link' onClick={() => handleViewProductComments(request.product.id)} target="_blank">View Product Comments</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(request.product.id)} target="_blank">View NFT</a></td>
									{/* <td>{String(request.quantity)}</td> */}
									<td><button className="table-button" onClick={() => handleBuyProduct(request)}>Buy Product</button></td>
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
								<th>Manufacturer Requested From</th>
								<th>Manufacturer Trust Score</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Date Manufactured</th>
								{/* <th>Product Quantity Available</th> */}
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								{/* <th>Quantity Requested</th> */}
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 2).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.product.manufacturingUser.email)}</td>
									<td>{String(Number(manufacturerTrustScores[request.product.manufacturingUser.ethAddress]) / 100000)}</td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									{/* <td>{String(request.product.quantity)}</td> */}
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									{/* <td>{String(request.quantity)}</td> */}
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
								<th>Manufacturer Requested From</th>
								<th>Manufacturer Trust Score</th>
								<th>Date Requested</th>
								<th>Product ID</th>
								<th>Product Name</th>
								<th>Product Date Manufactured</th>
								{/* <th>Product Quantity Available</th> */}
								<th>Product Price per Unit</th>
								<th>Product Description</th>
								<th>Product Raw Materials</th>
								<th>Product NFT</th>
								{/* <th>Quantity Requested</th> */}
							</tr>
						</thead>
						<tbody>
							{requests.filter(request => Number(request.status) === 3).map((request) => (
								<tr key={request.id}>
									<td>{String(request.id)}</td>
									<td>{String(request.product.manufacturingUser.email)}</td>
									<td>{String(Number(manufacturerTrustScores[request.product.manufacturingUser.ethAddress]) / 100000)}</td>
									<td>{new Date(Number(request.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(request.product.id)}</td>
									<td>{String(request.product.name)}</td>
									<td>{new Date(Number(request.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									{/* <td>{String(request.product.quantity)}</td> */}
									<td>Rs. {String(request.product.pricePerUnit)}</td>
									<td>{String(request.product.description)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(request.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(request.product.id)} target="_blank">View NFT</a></td>
									{/* <td>{String(request.quantity)}</td> */}
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			}
			{
				boughtProducts.length ? (<><h3 className='sub-heading'>Bought Products</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Date Added</th>
								<th>Name</th>
								<th>Date Manufactured</th>
								<th>Quantity Purchased</th>
								<th>Price per Unit</th>
								{/* <th>Total Price</th> */}
								<th>Description</th>
								<th>Date Bought</th>
								<th>Manufacturer Bought From</th>
								<th>Manufacturer Trust Score</th>
								<th>Raw Materials</th>
								<th>NFT</th>
								<th>View Shipping Details</th>
								<th>Mark as Received</th>
							</tr>
						</thead>
						<tbody>
							{boughtProducts.map((boughtProduct) => (
								<tr key={boughtProduct.id}>
									<td>{String(boughtProduct.id)}</td>
									<td>{new Date(Number(boughtProduct.product.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(boughtProduct.product.name)}</td>
									<td>{new Date(Number(boughtProduct.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(boughtProduct.transaction.quantity)}</td>
									<td>Rs. {String(boughtProduct.product.pricePerUnit)}</td>
									{/* <td>{String(boughtProduct.transaction.pricePerUnit * boughtProduct.transaction.quantity)}</td> */}
									<td>{String(boughtProduct.product.description)}</td>
									<td>{new Date(Number(boughtProduct.transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
									<td>{String(boughtProduct.product.manufacturingUser.email)}</td>
									<td>{String(Number(manufacturerTrustScores[boughtProduct.product.manufacturingUser.ethAddress]) / 100000)}</td>
									<td><a className='comment-link' onClick={() => handleViewRawMaterials(boughtProduct.product.id)} target="_blank">View Raw Materials</a></td>
									<td><a className='comment-link' onClick={() => handleViewNFT(boughtProduct.product.id)} target="_blank">View NFT</a></td>
									<td><a className='comment-link' onClick={() => handleViewShippingDetails(boughtProduct)} target="_blank">View Shipping Details</a></td>
									<td><button className="table-button" onClick={() => handleMarkAsReceived(boughtProduct)}>Mark as Received</button></td>
								</tr>
							))}
						</tbody>
					</table>
				</>) : (<></>)
			}
			{receivedProducts.length ? (<><h3 className='sub-heading'>Received Products</h3>
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Date Added</th>
							<th>Name</th>
							<th>Date Manufactured</th>
							{/* <th>Quantity Purchased</th> */}
							<th>Price per Unit</th>
							{/* <th>Total Price</th> */}
							<th>Description</th>
							<th>Date Bought</th>
							<th>Date Received</th>
							<th>Manufacturer Bought From</th>
							<th>Manufacturer Trust Score</th>
							<th>Raw Materials</th>
							<th>NFT</th>
							<th>View Shipping Details</th>
							{/* <th>Add Comment for Manufacturer</th> */}
							<th>Add Comment for Product</th>
						</tr>
					</thead>
					<tbody>
						{receivedProducts.map((receivedProduct) => (
							<tr key={receivedProduct.id}>
								<td>{String(receivedProduct.id)}</td>
								<td>{new Date(Number(receivedProduct.product.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(receivedProduct.product.name)}</td>
								<td>{new Date(Number(receivedProduct.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
								{/* <td>{String(receivedProduct.transaction.quantity)}</td> */}
								<td>Rs. {String(receivedProduct.product.pricePerUnit)}</td>
								{/* <td>{String(receivedProduct.transaction.pricePerUnit * receivedProduct.transaction.quantity)}</td> */}
								<td>{String(receivedProduct.product.description)}</td>
								<td>{new Date(Number(receivedProduct.transaction.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{new Date(Number(receivedProduct.receivedTimestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(receivedProduct.product.manufacturingUser.email)}</td>
								<td>{String(Number(manufacturerTrustScores[receivedProduct.product.manufacturingUser.ethAddress]) / 100000)}</td>
								<td><a className='comment-link' onClick={() => handleViewRawMaterials(receivedProduct.product.id)} target="_blank">View Raw Materials</a></td>
								<td><a className='comment-link' onClick={() => handleViewNFT(receivedProduct.product.id)} target="_blank">View NFT</a></td>
								<td><a className='comment-link' onClick={() => handleViewShippingDetails(receivedProduct)} target="_blank">View Shipping Details</a></td>
								{/* <td>{
									manufacturerComments[receivedProduct.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {manufacturerComments[receivedProduct.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {manufacturerComments[receivedProduct.id]?.rating} ⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={manufacturerComments[receivedProduct.id]?.comment || ''} onChange={(e) => handleManufacturerCommentChange(receivedProduct.id, "comment", e.target.value)} />
											<select value={manufacturerComments[receivedProduct.id]?.rating || ""} onChange={(e) => handleManufacturerCommentChange(receivedProduct.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForManufacturer(receivedProduct)}>Add Comment</button>
										</div>
									)
								}</td> */}
								<td>{
									productComments[receivedProduct.id]?.submitted ? (
										<>
											<p>
												<strong>Comment:</strong> {productComments[receivedProduct.id]?.comment}
											</p>
											<p>
												<strong>Rating:</strong> {productComments[receivedProduct.id]?.rating}⭐
											</p>
										</>) : (
										<div>
											<input type="text" placeholder='Enter Comment' value={productComments[receivedProduct.id]?.comment || ''} onChange={(e) => handleProductCommentChange(receivedProduct.id, "comment", e.target.value)} />
											<select value={productComments[receivedProduct.id]?.rating || ""} onChange={(e) => handleProductCommentChange(receivedProduct.id, "rating", Number(e.target.value))}>
												{[-1, 5, 4, 3, 2, 1].map((num) => (
													<option key={num} value={num === -1 ? "" : num}>
														{num === -1 ? "Select Rating" : num} ⭐
													</option>
												))}
											</select>
											<button className="table-button" onClick={() => handleAddCommentForProduct(receivedProduct)}>Add Comment</button>
										</div>
									)
								}</td>
							</tr>
						))}
					</tbody>
				</table></>) : (<></>)
			}
		</div>
	);
};

export default ConsumerDashboard;