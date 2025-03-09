import React from 'react';
import { useLocation } from 'react-router-dom';

function ShippingDetails() {
	const location = useLocation();
	const sd = location.state?.shippingDetails || [];
	const heading = location.state?.heading || '';
	return (<>
		{sd.length ? (<><h3 className='page-heading'>{heading}</h3>
			<div className="table-cont">
            <table>
				<thead>
					<tr>
						<th>Transaction ID</th>
						<th>From</th>
						<th>Sender Location</th>
						<th>To</th>
						<th>Receiver Location</th>
						<th>Description</th>
						<th>Price per Unit</th>
						<th>Weight per Unit</th>
						<th>Quantity Ordered</th>
						<th>Total Price</th>
						<th>Total Weight</th>
						<th>Shipping Partner</th>
						<th>Shipping Partner Rating</th>
						<th>Estimated Time to Deliver</th>
						<th>Shipping Charges</th>
					</tr>
				</thead>
				<tbody>
					{sd.map(({shippingDetails,transaction}) => (
						<tr key={transaction.id}>
							<td>{String(transaction.id)}</td>
							<td>{String(transaction.from.email)}</td>
							<td>{String(transaction.from.location)}</td>
							<td>{String(transaction.to.email)}</td>
							<td>{String(transaction.to.location)}</td>
							<td>{String(transaction.description)}</td>
							<td>Rs. {String(shippingDetails.pricePerUnit)}</td>
							<td>{String(shippingDetails.weightPerUnit)} kg</td>
							<td>{String(shippingDetails.quantity)}</td>
							<td>Rs. {String(shippingDetails.totalPrice)}</td>
							<td>{String(shippingDetails.totalWeight)} kg</td>
							<td>{String(shippingDetails.shippingPartner)}</td>
							<td>{String(shippingDetails.partnerRating)}</td>
							<td>{String(shippingDetails.estimatedTimeToDelivery)} days</td>
							<td>Rs. {String(shippingDetails.shippingCharges)}</td>
						</tr>
					))}
				</tbody>
			</table>
          </div></>) : (<></>)
		}</>
	)
}

export default ShippingDetails;