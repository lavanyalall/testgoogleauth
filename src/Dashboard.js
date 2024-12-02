import React, { useEffect, useState } from 'react';
import GoogleAuthMappingArtifact from './GoogleAuthMapping.json';
// import Web3 from 'web3';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';


function Dashboard({ web3, contract, username, ethAccount, googleId, emailId, setStatus, logoutUser, status, role, userProducts, allProducts }) {
	// const [allProducts, setAllProducts] = useState([]);
	// const [userProducts, setUserProducts] = useState([]);
	// const [role, setRole] = useState(null);
	const [newProduct, setNewProduct] = useState({ name: '', quantity: '', description: '' });
	const [currentaccount, setCurrentaccount] = useState("");
	const [loader, setloader] = useState(false);
	const [SupplyChain, setSupplyChain] = useState();
	const [PROD, setPROD] = useState();
	const [ProdStage, setProdStage] = useState();
	const [ID, setID] = useState();
	const navigate = useNavigate();
	const SupplyChainABI = GoogleAuthMappingArtifact;

	useEffect(() => {
		const initializeDashboard = async () => {
			try {
			// 	await loadWeb3();
				await loadBlockchaindata();
			//  await fetchRole();
				await fetchProducts();
			} catch (error) {
				console.error("Error initializing dashboard:", error);
			}
		};
	
		initializeDashboard();
	}, []);

	// const loadWeb3 = async () => {
	// 	if (window.ethereum) {
	// 		window.web3 = new Web3(window.ethereum);
	// 		await window.ethereum.enable();
	// 	} else if (window.web3) {
	// 		window.web3 = new Web3(window.web3.currentProvider);
	// 	} else {
	// 		window.alert(
	// 			"Non-Ethereum browser detected. You should consider trying MetaMask!"
	// 		);
	// 	}
	// };

	const loadBlockchaindata = async () => {
		// setloader(true);
		// const web3 = window.web3;
		const account = ethAccount;
		setCurrentaccount(account);
		const networkId = await web3.eth.net.getId();
		const networkData = SupplyChainABI.networks[networkId];
		if (networkData) {
			const supplychain = new web3.eth.Contract(SupplyChainABI.abi, networkData.address);
			setSupplyChain(supplychain);
			var i;
			await web3.eth.personal.unlockAccount(ethAccount, 'password123', 600);
			const prodCtr = await contract.methods.productCtr().call();
			const prod = {};
			const prodStage = [];
			for (i = 0; i < prodCtr; i++) {
				prod[i] = await contract.methods.ProductStock(i + 1).call();
				prodStage[i] = await contract.methods.showStage(i + 1).call();
			}
			setPROD(prod);
			setProdStage(prodStage);
			// setloader(false);
		}
		else {
			window.alert('The smart contract is not deployed to current network')
		}
	}

	const handlerChangeID = (event) => {
		setID(event.target.value);
	}
	const handlerSubmitRMSsupply = async (event) => {
		event.preventDefault();
		try {
			await web3.eth.personal.unlockAccount(ethAccount, 'password123', 600);
			await contract.methods.RMSsupply(ID).send({ from: ethAccount, gas: 3000000 });
			setStatus(`Raw materials for Product ${ID} supplied successfully!`);
		}
		catch (err) {
			alert("An error occured!!!")
		}
	}
	const handlerSubmitManufacturing = async (event) => {
		event.preventDefault();
		try {
			await web3.eth.personal.unlockAccount(ethAccount, 'password123', 600);
			await contract.methods.Manufacturing(ID).send({ from: ethAccount, gas: 3000000 });
			setStatus(`Product ${ID} manufactured successfully!`);
		}
		catch (err) {
			alert("An error occured!!!")
		}
	}
	const handlerSubmitDistribute = async (event) => {
		event.preventDefault();
		try {
			await web3.eth.personal.unlockAccount(ethAccount, 'password123', 600);
			await contract.methods.Distribute(ID).send({ from: ethAccount, gas: 3000000 });
			setStatus(`Product ${ID} distributed successfully!`);
		}
		catch (err) {
			alert("An error occured!!!")
		}
	}
	const handlerSubmitRetail = async (event) => {
		event.preventDefault();
		try {
			await web3.eth.personal.unlockAccount(ethAccount, 'password123', 600);
			await contract.methods.Retail(ID).send({ from: ethAccount, gas: 3000000 });
			setStatus(`Product ${ID} retailed successfully!`);
		}
		catch (err) {
			alert("An error occured!!!")
		}
	}
	const handlerSubmitSold = async (event) => {
		event.preventDefault();
		try {
			await web3.eth.personal.unlockAccount(ethAccount, 'password123', 600);
			await contract.methods.sold(ID).send({ from: ethAccount, gas: 3000000 });
			setStatus(`Product ${ID} sold successfully!`);
		}
		catch (err) {
			alert("An error occured!!!")
		}
	}

	if (loader) {
		return (
			<div>
				<h1 className="wait">Loading...</h1>
			</div>
		)

	}

	// const fetchRole = async () => {
	// 	try {
	// 		console.log(googleId);
	// 		const googleIdHash = web3.utils.sha3(googleId);
			
	// 		const userRole = await contract.methods.getRole(googleIdHash).call();
	// 		console.log(userRole);
	// 		setRole(parseInt(userRole));
	// 		console.log(role);
	// 	} catch (error) {
	// 		console.error('Error fetching role:', error);
	// 	}
	// };

	const fetchProducts = async () => {
		try {
			const allProductsList = await contract.methods.getAllProducts().call();
			allProducts = allProductsList;

			const userProductsList = await contract.methods.getUserProducts(ethAccount).call();
			userProducts = userProductsList;
		} catch (error) {
			console.error('Error fetching products:', error);
			setStatus('Error fetching products. Please check the console.');
		}
	};

	const handleAddProduct = async (e) => {
		e.preventDefault();
		if (!newProduct.name || !newProduct.quantity || isNaN(newProduct.quantity) || newProduct.quantity <= 0 || !newProduct.description) {
			setStatus('Please provide a valid product name, description and quantity.');
			return;
		}

		try {
			setStatus('Adding product...');
			const accounts = await web3.eth.personal.getAccounts();
			await web3.eth.personal.unlockAccount(ethAccount, 'password123', 600);

			await contract.methods
				.addProduct(newProduct.name, parseInt(newProduct.quantity), emailId, newProduct.description)
				.send({ from: ethAccount, gas: 3000000 });

			setStatus('Product added successfully!');
			fetchProducts();
		} catch (error) {
			console.error('Error adding product:', error);
			setStatus('Error adding product. Please check the console.');
		}
	};

	return (
		<div className='main'>
			<h2 className='page-heading'>Dashboard</h2>
			<div className='welcome-message'>
			<p>Welcome, {username}</p>
			<p ><p style={{"font-weight": "bold"}} > Your Ethereum Address: </p>{ethAccount}</p>
			</div>
			<div className="button-container">
			<button onClick={() => navigate('/')} type="submit" className='home'>Home</button>
			<button onClick={logoutUser} type="submit" className='logout'>Logout</button>
			</div>
			<p className='status'>Status: {status}</p>

			{role == 1 && ( // Only manufacturers can add products
				<div>
					<h3 className='sub-heading'>Add Product</h3>
					<form onSubmit={handleAddProduct} className='form'>
						<label> Product Name</label>
						<input
							type="text"
							placeholder="Enter Product Name"
							value={newProduct.name}
							onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
						/>
						<label> Quantity</label>
						<input
							type="number"
							placeholder="Enter Quantity"
							value={newProduct.quantity}
							onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })}
						/>
						<label> Product Description</label>
						<input
							type="text"
							placeholder="Enter Product Description"
							value={newProduct.description}
							onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
						/>
						<button type="submit">Add Product</button>
					</form>
				</div>
			)}

			{allProducts.length ? (<><h3 className='sub-heading'>All Products</h3>
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Name</th>
						<th>Quantity</th>
						<th>Description</th>
						<th>Registered By (Email)</th>
					</tr>
				</thead>
				<tbody>
					{allProducts.map((product) => (
						<tr key={product.id}>
							<td>{String(product.id)}</td>
							<td>{String(product.name)}</td>
							<td>{String(product.quantity)}</td>
							<td>{String(product.description)}</td>
							<td>{product.registeredByEmail}</td>
						</tr>
					))}
				</tbody>
			</table></>) : (<></>)
}
			{role == 1 && (userProducts.length ? (
				<>
					<h3 className='sub-heading'>Your Products</h3>
					<table>
						<thead>
							<tr>
								<th>ID</th>
								<th>Name</th>
								<th>Quantity</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							{userProducts.map((product) => (
								<tr key={product.id}>
									<td>{String(product.id)}</td>
									<td>{product.name}</td>
									<td>{String(product.quantity)}</td>
									<td>{String(product.description)}</td>
								</tr>
							))}
						</tbody>
					</table></>) : (<></>)
			)}

			{
				role == 0 && (
					<>
						<h4 className='sub-heading'>Supply Raw Materials</h4>
						<form className='role-form' onSubmit={handlerSubmitRMSsupply}>
							<input className="form-control-sm " type="text" onChange={handlerChangeID} placeholder="Enter Product ID" required />
							<button className="btn btn-outline-light btn-sm" onSubmit={handlerSubmitRMSsupply}>Supply</button>
						</form>
					</>
				)
			}

			{
				role == 1 && (
					<>
						<h4 className='sub-heading sub-heading'>Manufacture</h4>
						<form className='role-form' onSubmit={handlerSubmitManufacturing}>
							<input className="form-control-sm" type="text" onChange={handlerChangeID} placeholder="Enter Product ID" required />
							<button className="btn btn-outline-light btn-sm" onSubmit={handlerSubmitManufacturing}>Manufacture</button>
						</form>

					</>
				)
			}

			{
				role == 2 && (
					<>
						<h4 className='sub-heading'>Distribute</h4>
						<form className='role-form' onSubmit={handlerSubmitDistribute}>
						<label> Product Name</label>
							<input className="form-control-sm" type="text" onChange={handlerChangeID} placeholder="Enter Product ID" required />
							<button className="btn btn-outline-light btn-sm" onSubmit={handlerSubmitDistribute}>Distribute</button>
						</form>

					</>
				)
			}

			{
				role == 3 && (
					<>
						<h4 className='sub-heading'>Retail</h4>
						<form className='role-form' onSubmit={handlerSubmitRetail}>
						<label> Product Name</label>
							<input className="form-control-sm" type="text" onChange={handlerChangeID} placeholder="Enter Product ID" required />
							<button className="btn btn-outline-light btn-sm" onSubmit={handlerSubmitRetail}>Retail</button>
						</form>
					</>
				)
			}

			{
				role == 3 && (
					<>
						<h4 className='sub-heading'>Mark as sold</h4>
						<form className='role-form' onSubmit={handlerSubmitSold}>
						<label> Product ID</label>
							<input className="form-control-sm" type="text" onChange={handlerChangeID} placeholder="Enter Product ID" required />
							<button className="btn btn-outline-light btn-sm" onSubmit={handlerSubmitSold}>Sold</button>
						</form>

					</>
				)
			}

		</div>
	);
}

export default Dashboard;