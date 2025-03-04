import React, {useEffect, useState} from 'react';
import { useLocation, useNavigate} from 'react-router-dom';
import { toast } from "react-hot-toast";
import {pinata} from "./utils/config";
function ViewNFT() {
	const location = useLocation();
	const navigate = useNavigate();
	const nfts = location.state?.nfts || [];
	const heading = location.state?.heading || '';
	const [data, setData] = useState([]);
	const [loading, setLoading] = useState(true);

	const loadData = async () => {
		try{
			const currData = []
			for (let i = 0; i < nfts.length; i++) {
				const metadata = await pinata.gateways.get(nfts[i].metadataURI);
				const imgURL = await pinata.gateways.convert(metadata.data.imageHash);
				currData.push({...nfts[i], product: metadata.data, imgURL});
			}
			setData(currData);
		}
		catch(error){
			toast.error("Error fetching data. Please check the console.");
			console.log(error);
		}
		finally{
			setLoading(false);
		}
	}

	useEffect(() => {
		loadData();
	}, []);

	return (<>
		{data.length ? (<><h3 className='sub-heading'>{heading}</h3>
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
			</table></>) : (<></>)
		}</>
	)
};

export default ViewNFT;