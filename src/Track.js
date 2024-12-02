import React, { useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom"
import Web3 from "web3";
import GoogleAuthMappingArtifact from './GoogleAuthMapping.json';
import "./Track.css";

function Track({ web3, ethAccount, contract }) {
	useEffect(() => {
		// loadWeb3();
		loadBlockchaindata();
	}, [web3, contract, ethAccount])

	const SupplyChainABI = GoogleAuthMappingArtifact;
	const navigate = useNavigate();

	const [currentaccount, setCurrentaccount] = useState("");
	const [loader, setloader] = useState(true);
	const [SupplyChain, setSupplyChain] = useState();
	const [PROD, setPROD] = useState();
	const [ProdStage, setProdStage] = useState();
	const [ID, setID] = useState();
	const [RMS, setRMS] = useState();
	const [MAN, setMAN] = useState();
	const [DIS, setDIS] = useState();
	const [RET, setRET] = useState();
	const [TrackTillSold, showTrackTillSold] = useState(false);
	const [TrackTillRetail, showTrackTillRetail] = useState(false);
	const [TrackTillDistribution, showTrackTillDistribution] = useState(false);
	const [TrackTillManufacture, showTrackTillManufacture] = useState(false);
	const [TrackTillRMS, showTrackTillRMS] = useState(false);
	const [TrackTillOrdered, showTrackTillOrdered] = useState(false);

	// const loadWeb3 = async () => {
	//     if (window.ethereum) {
	//         window.web3 = new Web3(window.ethereum);
	//         await window.ethereum.enable();
	//     } else if (window.web3) {
	//         window.web3 = new Web3(window.web3.currentProvider);
	//     } else {
	//         window.alert(
	//             "Non-Ethereum browser detected. You should consider trying MetaMask!"
	//         );
	//     }
	// };
	const loadBlockchaindata = async () => {
		setloader(true);
		// const web3 = window.web3;
		
		if(web3 && contract && ethAccount){
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
				prod[i + 1] = await contract.methods.ProductStock(i + 1).call();
				prodStage[i + 1] = await contract.methods.showStage(i + 1).call();
			}
			setPROD(prod);
			setProdStage(prodStage);
			const rmsCtr = await contract.methods.rmsCtr().call();
			const rms = {};
			for (i = 0; i < rmsCtr; i++) {
				rms[i + 1] = await contract.methods.RMS(i + 1).call();
			}
			setRMS(rms);
			const manCtr = await contract.methods.manCtr().call();
			const man = {};
			for (i = 0; i < manCtr; i++) {
				man[i + 1] = await contract.methods.MAN(i + 1).call();
			}
			setMAN(man);
			const disCtr = await contract.methods.disCtr().call();
			const dis = {};
			for (i = 0; i < disCtr; i++) {
				dis[i + 1] = await contract.methods.DIS(i + 1).call();
			}
			setDIS(dis);
			const retCtr = await contract.methods.retCtr().call();
			const ret = {};
			for (i = 0; i < retCtr; i++) {
				ret[i + 1] = await contract.methods.RET(i + 1).call();
			}
			setRET(ret);
			setloader(false);
		}
		else {
			window.alert('The smart contract is not deployed to current network')
		}
		}
	}
	// if (loader) {
	//     return (
	//         <div>
	//             <h1 className="wait">Loading...</h1>
	//         </div>
	//     )
	// }
	if (TrackTillSold) {
		return (
			<div className='main-cont'>
				<h4 className='page-heading'>{String(PROD[ID].id)}. {PROD[ID].name}</h4>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Product:</b></h3>
						<p><b>Product ID: </b>{String(PROD[ID].id)}</p>
						<p><b>Name:</b> {PROD[ID].name}</p>
						<p><b>Description: </b>{PROD[ID].description}</p>
						<p><b>Current stage: </b>{ProdStage[ID]}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Raw Materials Supplied by:</b></h3>
						<p><b>Supplier ID: </b>{String(RMS[PROD[ID].RMSid].id)}</p>
						<p><b>Name:</b> {RMS[PROD[ID].RMSid].name}</p>
						<p><b>Place: </b>{RMS[PROD[ID].RMSid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Manufactured by:</b></h3>
						<p><b>Manufacturer ID: </b>{String(MAN[PROD[ID].MANid].id)}</p>
						<p><b>Name:</b> {MAN[PROD[ID].MANid].name}</p>
						<p><b>Place: </b>{MAN[PROD[ID].MANid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Distributed by:</b></h3>
						<p><b>Distributor ID: </b>{String(DIS[PROD[ID].DISid].id)}</p>
						<p><b>Name:</b> {DIS[PROD[ID].DISid].name}</p>
						<p><b>Place: </b>{DIS[PROD[ID].DISid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Retailed by:</b></h3>
						<p><b>Retailer ID: </b>{String(RET[PROD[ID].RETid].id)}</p>
						<p><b>Name:</b> {RET[PROD[ID].RETid].name}</p>
						<p><b>Place: </b>{RET[PROD[ID].RETid].place}</p>
					</article>
				</div>
				<h5 className='sub-heading'>Product has been Sold!</h5>
				<button onClick={() => {
					showTrackTillSold(false);
					navigate('/track');
				}} className="btn track-another-btn" type = "submit">Track Another Item</button>
			</div >
		)
	}
	if (TrackTillRetail) {
		return (
			<div className='main-cont'>
				<h4 className='page-heading'>{String(PROD[ID].id)}. {PROD[ID].name}</h4>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Product:</b></h3>
						<p><b>Product ID: </b>{String(PROD[ID].id)}</p>
						<p><b>Name:</b> {PROD[ID].name}</p>
						<p><b>Description: </b>{PROD[ID].description}</p>
						<p><b>Current stage: </b>{ProdStage[ID]}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Raw Materials Supplied by:</b></h3>
						<p><b>Supplier ID: </b>{String(RMS[PROD[ID].RMSid].id)}</p>
						<p><b>Name:</b> {RMS[PROD[ID].RMSid].name}</p>
						<p><b>Place: </b>{RMS[PROD[ID].RMSid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Manufactured by:</b></h3>
						<p><b>Manufacturer ID: </b>{String(MAN[PROD[ID].MANid].id)}</p>
						<p><b>Name:</b> {MAN[PROD[ID].MANid].name}</p>
						<p><b>Place: </b>{MAN[PROD[ID].MANid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Distributed by:</b></h3>
						<p><b>Distributor ID: </b>{String(DIS[PROD[ID].DISid].id)}</p>
						<p><b>Name:</b> {DIS[PROD[ID].DISid].name}</p>
						<p><b>Place: </b>{DIS[PROD[ID].DISid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Retailed by:</b></h3>
						<p><b>Retailer ID: </b>{String(RET[PROD[ID].RETid].id)}</p>
						<p><b>Name:</b> {RET[PROD[ID].RETid].name}</p>
						<p><b>Place: </b>{RET[PROD[ID].RETid].place}</p>
					</article>
				</div>
				<button onClick={() => {
					showTrackTillRetail(false);
					navigate('/track');
				}} className="btn track-another-btn" type = "submit">Track Another Item</button>
			</div >
		)
	}
	if (TrackTillDistribution) {
		return (
			<div className='main-cont'>
				<h4 className='page-heading'>{String(PROD[ID].id)}. {PROD[ID].name}</h4>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Product:</b></h3>
						<p><b>Product ID: </b>{String(PROD[ID].id)}</p>
						<p><b>Name:</b> {PROD[ID].name}</p>
						<p><b>Description: </b>{PROD[ID].description}</p>
						<p><b>Current stage: </b>{ProdStage[ID]}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Raw Materials Supplied by:</b></h3>
						<p><b>Supplier ID: </b>{String(RMS[PROD[ID].RMSid].id)}</p>
						<p><b>Name:</b> {RMS[PROD[ID].RMSid].name}</p>
						<p><b>Place: </b>{RMS[PROD[ID].RMSid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Manufactured by:</b></h3>
						<p><b>Manufacturer ID: </b>{String(MAN[PROD[ID].MANid].id)}</p>
						<p><b>Name:</b> {MAN[PROD[ID].MANid].name}</p>
						<p><b>Place: </b>{MAN[PROD[ID].MANid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Distributed by:</b></h3>
						<p><b>Distributor ID: </b>{String(DIS[PROD[ID].DISid].id)}</p>
						<p><b>Name:</b> {DIS[PROD[ID].DISid].name}</p>
						<p><b>Place: </b>{DIS[PROD[ID].DISid].place}</p>
					</article>
				</div>
				<button onClick={() => {
					showTrackTillDistribution(false);
					navigate('/track')
				}} className="btn track-another-btn" type = "submit">Track Another Item</button>
			</div >
		)
	}
	if (TrackTillManufacture) {
		return (
			<div className='main-cont'>
				<h4 className='page-heading'>{String(PROD[ID].id)}. {PROD[ID].name}</h4>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Product:</b></h3>
						<p><b>Product ID: </b>{String(PROD[ID].id)}</p>
						<p><b>Name:</b> {PROD[ID].name}</p>
						<p><b>Description: </b>{PROD[ID].description}</p>
						<p><b>Current stage: </b>{ProdStage[ID]}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Raw Materials Supplied by:</b></h3>
						<p><b>Supplier ID: </b>{String(RMS[PROD[ID].RMSid].id)}</p>
						<p><b>Name:</b> {RMS[PROD[ID].RMSid].name}</p>
						<p><b>Place: </b>{RMS[PROD[ID].RMSid].place}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Manufactured by:</b></h3>
						<p><b>Manufacturer ID: </b>{String(MAN[PROD[ID].MANid].id)}</p>
						<p><b>Name:</b> {MAN[PROD[ID].MANid].name}</p>
						<p><b>Place: </b>{MAN[PROD[ID].MANid].place}</p>
					</article>
				</div>
				<button onClick={() => {
					showTrackTillManufacture(false);
					navigate('/track');
				}} className="btn track-another-btn" type="submit">Track Another Item</button>
			</div>
		)
	}
	if (TrackTillRMS) {
		return (
			<div className='main-cont'>
				<h4 className='page-heading'>{String(PROD[ID].id)}. {PROD[ID].name}</h4>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Product:</b></h3>
						<p><b>Product ID: </b>{String(PROD[ID].id)}</p>
						<p><b>Name:</b> {PROD[ID].name}</p>
						<p><b>Description: </b>{PROD[ID].description}</p>
						<p><b>Current stage: </b>{ProdStage[ID]}</p>
					</article>
				</div>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Raw Materials Supplied by:</b></h3>
						<p><b>Supplier ID: </b>{String(RMS[PROD[ID].RMSid].id)}</p>
						<p><b>Name:</b> {RMS[PROD[ID].RMSid].name}</p>
						<p><b>Place: </b>{RMS[PROD[ID].RMSid].place}</p>
					</article>
				</div>
				<button onClick={() => {
					showTrackTillRMS(false);
					navigate('/track');
				}} className="btn track-another-btn" type = "submit">Track Another Item</button>
			</div >
		)
	}
	if (TrackTillOrdered) {
		return (
			<div className='main-cont'>
				<h4 className='page-heading'>{String(PROD[ID].id)}. {PROD[ID].name}</h4>
				<div className="container-xl">
					<article className="product-info col-4">
						<h3 className='sub-heading'><b>Product:</b></h3>
						<p><b>Product ID: </b>{String(PROD[ID].id)}</p>
						<p><b>Name:</b> {PROD[ID].name}</p>
						<p><b>Description: </b>{PROD[ID].description}</p>
						<p><b>Current stage: </b>{ProdStage[ID]}</p>
					</article>
				</div>
					<h5 className='sub-heading'>Product Not Yet Processed...</h5>
					<button onClick={() => {
						showTrackTillOrdered(false);
						navigate('/track')
					}} className="btn track-another-btn" type = "submit">Track Another Item</button>
			</div >
		)
	}
	const handlerChangeID = (event) => {
		setID(event.target.value);
	}

	const handlerSubmit = async (event) => {
		event.preventDefault();
		var ctr = await contract.methods.productCtr().call();
		if (!((ID > 0) && (ID <= ctr)))
			alert("Invalid Product ID!!!");
		else {
			// eslint-disable-next-line
			if (PROD[ID].stage == 5)
				showTrackTillSold(true);
			// eslint-disable-next-line
			else if (PROD[ID].stage == 4)
				showTrackTillRetail(true);
			// eslint-disable-next-line
			else if (PROD[ID].stage == 3)
				showTrackTillDistribution(true);
			// eslint-disable-next-line
			else if (PROD[ID].stage == 2)
				showTrackTillManufacture(true);
			// eslint-disable-next-line
			else if (PROD[ID].stage == 1)
				showTrackTillRMS(true);
			else
				showTrackTillOrdered(true);

		}
	}

	return (
		<div>
			<div className="top-container-roles">
				<h2 className='page-heading'>TRACK PROGRESS</h2>
				{/* <span className='current-account-1'><span className="current-account">Current Account Address:</span> {currentaccount}</span> */}
			</div>
			<h4 className='sub-heading'>All Products</h4>
			<table className="table-roles">
				<thead>
					<tr>
						<th scope="col">Product ID</th>
						<th scope="col">Name</th>
						<th scope="col">Description</th>
						<th scope="col">Current Processing Stage</th>
					</tr>
				</thead>
				<tbody>
					{PROD && Object.keys(PROD).map(function (key) {
						return (
							<tr key={key}>
								<td>{String(PROD[key].id)}</td>
								<td>{PROD[key].name}</td>
								<td>{PROD[key].description}</td>
								<td>
									{
										ProdStage[key]
									}
								</td>
							</tr>
						)
					})}
				</tbody>
			</table>
			<div className='container'>
				<h4 className="sub-heading">Track using Product ID</h4>
				<form className="role-form" onSubmit={handlerSubmit}>
					<input className="form-control-sm" type="text" onChange={handlerChangeID} placeholder="Enter Product ID" required />
					<button className="btn btn-outline-success btn-sm btn-outline-light" onSubmit={handlerSubmit}>Track</button>
				</form>
			</div>
			<button className="button-1" onClick={() => navigate('/')}>Home</button>
		</div>
	)
}

export default Track
