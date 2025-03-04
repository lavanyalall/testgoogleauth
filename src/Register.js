import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { AES } from 'crypto-js';
import { toast } from 'react-hot-toast';


function generatePassword(length) {
	const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+[]{}|;:,.<>?/~";
	const randomValues = new Uint8Array(length);
	window.crypto.getRandomValues(randomValues);
	let password = "";
	for (let i = 0; i < length; i++) {
		password += charset[randomValues[i] % charset.length];
	}
	return password;
}

function Register({ web3, contract, googleId, emailId, role, setUsername, setEthAccount, setIsRegistered, setRole }) {
	const [formData, setFormData] = useState({ username: '', location: '', role: '' });
	const navigate = useNavigate();

	const handleChange = (e) => {
		const { name, value } = e.target;
		setFormData({ ...formData, [name]: value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.username || !formData.location || !formData.role) {
			toast.error('Please fill in all fields.');
			return;
		}

		let regex = new RegExp(/^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/);
		if(!regex.test(formData.location)){
			toast.error('Please enter a valid pincode.');
			return;
		}

		try {
			const toastId = toast.loading('Registering...');
			const googleIdHash = web3.utils.sha3(googleId);

			// Create a new Ethereum account
			const password = generatePassword(16);
			const encryptedPassword = AES.encrypt(password, process.env.REACT_APP_KEY).toString();
			const newAccount = await web3.eth.personal.newAccount(password);
			await web3.eth.personal.unlockAccount(newAccount, password, 600);
			// Prefund the new account
			const accounts = await web3.eth.getAccounts();
			const fundingAccount = accounts[1];
			await web3.eth.sendTransaction({
				from: fundingAccount,
				to: newAccount,
				value: web3.utils.toWei('10', 'ether'),
			});
			
			const receipt = await contract.methods
				.registerUser(googleIdHash, emailId, newAccount, encryptedPassword, formData.username, formData.location, parseInt(formData.role))
				.send({ from: newAccount, gas: 30000000 });
			const gasUsed = receipt.gasUsed;

			setUsername(formData.username);
			setEthAccount(newAccount);
			setIsRegistered(true);
			setRole(parseInt(formData.role));
			localStorage.setItem('username', formData.username);
			localStorage.setItem('ethAccount', newAccount);
			localStorage.setItem('role', parseInt(formData.role));
			toast.dismiss(toastId)
			toast.success(`Registration successful! \n\n Transaction completed through Ethereum Account: ${newAccount} associated with E-mail ID: ${emailId}. \n\n Gas used for the registration was ${gasUsed} gwei.`);
			const userRole = parseInt(formData.role);
			if (userRole === 0) {
				navigate('/rms-dashboard');
			}
			else if (userRole === 1) {
				navigate('/manufacturer-dashboard');
			}
			else if (userRole === 2) {
				navigate('/consumer-dashboard');
			}
		} catch (error) {
			toast.error(`Error during registration:, ${error} \n\n Please try again.`);
			console.log(error);
		}
	};

	return (
		<div className='registration-container'>
			<h2 className='heading'>Register</h2>
			<form onSubmit={handleSubmit} className="registration-form">
				<div>
					<label className="registration-form-label">Username: <span className='required'>*</span></label>
					<input type="text" name="username" value={formData.username} onChange={handleChange} placeholder='Please enter your name' required className='registration-form-input' />
				</div>
				<div>
					<label className="registration-form-label">Pincode: <span className='required'>*</span></label>
					<input type="text" name="location" value={formData.location} onChange={handleChange} placeholder='Please enter your pincode' required className='registration-form-input' />
				</div>
				<div>
					<label className="registration-form-label">Role: <span className='required'>*</span></label>
					<div className='radio-group'>
						<label className="registration-form-label">
							<input type="radio" name="role" value="0" onChange={handleChange} className='registration-form-input' /> Raw Material Supplier
						</label>
						<label className="registration-form-label">
							<input type="radio" name="role" value="1" onChange={handleChange} className='registration-form-input' /> Manufacturer
						</label>
						<label className="registration-form-label">
							<input type="radio" name="role" value="2" onChange={handleChange} className='registration-form-input' /> Consumer
						</label>
					</div>
				</div>
				<span className='required'>* indicates required fields</span>
				<button type="submit" className="registration-form-button">Register</button>
			</form>
		</div>
	);
}

export default Register;
