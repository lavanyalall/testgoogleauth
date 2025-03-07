import React, {useEffect, useState} from 'react';
import { useLocation, useNavigate} from 'react-router-dom';
import { toast } from "react-hot-toast";
import {pinata} from "./utils/config";
function ViewNFT() {
	const location = useLocation();
	const navigate = useNavigate();
	const nfts = location.state?.nfts || [];
	const heading = location.state?.heading || '';
	const group = location.state?.group;
	const [data, setData] = useState([]);
	const [groupedNFTs, setGroupedNFTs] = useState(null);

	const loadData = async () => {
		try{
			const currData = []
			for (let i = 0; i < nfts.length; i++) {
				const metadata = await pinata.gateways.get(nfts[i].metadataURI);
				const imgURL = await pinata.gateways.convert(metadata.data.imageHash);
				currData.push({...nfts[i], product: metadata.data, imgURL});
			}
			setData(currData);
			if(group){
				setGroupedNFTs(currData.reduce((acc, nft) => {
					const productId = nft.product.id;
					if(!acc[productId]){
						acc[productId] = [nft];
					}
					else{
						acc[productId].push(nft);
					}
					return acc;
				}, {}));
			}
		}
		catch(error){
			toast.error("Error fetching data. Please check the console.");
			console.log(error);
		}
	}

	useEffect(() => {
		loadData();
	}, []);

	return (<>
		{group && groupedNFTs ? (<><h3 className='sub-heading'>{heading}</h3>
			<div className="table-cont">
            <table>
				<thead>
					<tr>
						<th>Product ID</th>
						<th>Manufacturer</th>
						<th>Consumer</th>
						<th>Date Product Added</th>
						<th>Date Product Manufactured</th>
						<th>Product Name</th>
						<th>Product Description</th>
						<th>Product Quantity</th>
						<th>Product Price Per Unit</th>
						<th>Raw Materials</th>
						<th>Product Image</th>
					</tr>
				</thead>
				<tbody>
				{Object.keys(groupedNFTs).map((productId) => {
						const nftGroup = groupedNFTs[productId];
						const firstNFT = nftGroup[0];
						return (
							<tr key={productId}>
								<td>{String(firstNFT.product.id)}</td>
								<td>{String(firstNFT.manufacturer.email)}</td>
								<td>{firstNFT.isBought ? String(firstNFT.consumer.email) : "Product has not been sold yet."}</td>
								<td>{new Date(Number(firstNFT.product.timestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{new Date(Number(firstNFT.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
								<td>{String(firstNFT.product.name)}</td>
								<td>{String(firstNFT.product.description)}</td>
								<td>{String(nftGroup.length)}</td>
								<td>Rs. {String(firstNFT.product.pricePerUnit)}</td>
								<td><a className='comment-link' onClick={() => navigate('/view-raw-materials', { state: { rawMaterials: firstNFT.product.rawMaterials, heading: `Raw Materials for Product ID: ${firstNFT.product.id}` } })} target="_blank">View Raw Materials</a></td>
								<td><img src={firstNFT.imgURL} alt="Product Image" /></td>
							</tr>
						)
					})}
				</tbody>
			</table>
          </div></>) : (<></>)
		}
		{!group && data.length ? (<><h3 className='sub-heading'>{heading}</h3>
			<div className="table-cont">
            <table>
				<thead>
					<tr>
						<th>Token ID</th>
						<th>Manufacturer</th>
						<th>Consumer</th>
						<th>Product ID</th>
						<th>Date Product Added</th>
						<th>Date Product Manufactured</th>
						<th>Product Name</th>
						<th>Product Description</th>
						{/* <th>Product Quantity</th> */}
						<th>Product Price Per Unit</th>
						<th>Raw Materials</th>
						<th>Product Image</th>
					</tr>
				</thead>
				<tbody>
					{data.map((nft) => (
						<tr key={nft.tokenId}>
							<td>{String(nft.tokenId)}</td>
							<td>{String(nft.manufacturer.email)}</td>
							<td>{nft.isBought ? String(nft.consumer.email) : "Product has not been sold yet."}</td>
							<td>{String(nft.product.id)}</td>
							<td>{new Date(Number(nft.product.timestamp) * 1000).toLocaleString('en-GB')}</td>
							<td>{new Date(Number(nft.product.manufacturedTimestamp) * 1000).toLocaleString('en-GB')}</td>
							<td>{String(nft.product.name)}</td>
							<td>{String(nft.product.description)}</td>
							{/* <td>{String(nft.product.quantity)}</td> */}
							<td>Rs. {String(nft.product.pricePerUnit)}</td>
							<td><a className='comment-link' onClick={() => navigate('/view-raw-materials', { state: { rawMaterials: nft.product.rawMaterials, heading: `Raw Materials for Product ID: ${nft.product.id}` } })} target="_blank">View Raw Materials</a></td>
							<td><img src={nft.imgURL} alt="Product Image" /></td>
						</tr>
					))}
				</tbody>
			</table>
          </div></>) : (<></>)
		}
		</>
	)
};

export default ViewNFT;