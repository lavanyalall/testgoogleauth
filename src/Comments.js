import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { AES, enc } from 'crypto-js';
require("dotenv").config();

function Comments({ mainContract, userManagementContract, web3, ethAccount }) {
	const location = useLocation();
	const comments = location.state?.comments || [];
	const heading = location.state?.heading || '';

	const [trustScores, setTrustScores] = useState({});

	useEffect(() => {
		const initializeComments = async () => {
			try {
				await loadBlockchaindata();
			} catch (error) {
				console.error("Error initializing comments page:", error);
			}
		};

		initializeComments();
	}, []);

	const loadBlockchaindata = async () => {
		const encryptedPassword = await userManagementContract.methods.getUserPassword(ethAccount).call();
		const password = AES.decrypt(encryptedPassword, process.env.REACT_APP_KEY).toString(enc.Utf8);
		await web3.eth.personal.unlockAccount(ethAccount, password, 600);
		const currTrustScores = {};
		for (let i = 0; i < comments.length; i++) {
			const currSenderTrustScore = await mainContract.methods.getUserTrustScore(comments[i].from.ethAddress).call();
			currTrustScores[comments[i].from.ethAddress] = currSenderTrustScore;
			const currReceiverTrustScore = await mainContract.methods.getUserTrustScore(comments[i].to.ethAddress).call();
			currTrustScores[comments[i].to.ethAddress] = currReceiverTrustScore;
		}
		setTrustScores(currTrustScores);
	};

	return (<>
		{comments.length ? (<><h3 className='sub-heading'>{heading}</h3>
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Date</th>
						<th>From</th>
						<th>Sender Trust Score</th>
						<th>To</th>
						<th>Receiver Trust Score</th>
						<th>Comment</th>
						<th>Rating</th>
					</tr>
				</thead>
				<tbody>
					{comments.map((comment) => (
						<tr key={comment.id}>
							<td>{String(comment.id)}</td>
							<td>{new Date(Number(comment.timestamp) * 1000).toLocaleString('en-GB')}</td>
							<td>{String(comment.from.email)}</td>
							<td>{String(Number(trustScores[comment.from.ethAddress]) / 100000)}</td>
							<td>{String(comment.to.email)}</td>
							<td>{String(Number(trustScores[comment.to.ethAddress]) / 100000)}</td>
							<td>{String(comment.comment)}</td>
							<td>{String(comment.rating)} ⭐</td>
						</tr>
					))}
				</tbody>
			</table></>) : (<h2 className='page-heading'>No comments found</h2>)
		}</>
	)
}

export default Comments;