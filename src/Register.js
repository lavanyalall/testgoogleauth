import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';

function Register({ web3, contract, googleId, emailId, setUsername, setEthAccount, setIsRegistered, setStatus, setRole, setAllProducts, setUserProducts }) {
  const [formData, setFormData] = useState({ username: '', location: '', role: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.location || !formData.role) {
      setStatus('Please fill in all fields.');
      return;
    }

    try {
      setStatus('Registering...');
      const googleIdHash = web3.utils.sha3(googleId);

      // Create a new Ethereum account
      const newAccount = await web3.eth.personal.newAccount('password123');
      await web3.eth.personal.unlockAccount(newAccount, 'password123', 600); // Unlock for transactions

      // Prefund the new account
      const accounts = await web3.eth.getAccounts();
      const fundingAccount = accounts[0];
      await web3.eth.sendTransaction({
        from: fundingAccount,
        to: newAccount,
        value: web3.utils.toWei('0.1', 'ether'),
      });

      // Register user on the blockchain
      await contract.methods
        .registerUser(googleIdHash, emailId, newAccount, formData.username, formData.location, parseInt(formData.role))
        .send({ from: newAccount, gas: 3000000 });

      setUsername(formData.username);
      setEthAccount(newAccount);
      setIsRegistered(true);
	  setRole(parseInt(formData.role));
      localStorage.setItem('username', formData.username);
      localStorage.setItem('ethAccount', newAccount);
	  localStorage.setItem('role',parseInt(formData.role));
      setStatus('Registration successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error during registration:', error);
      setStatus('Registration failed. Please try again.');
    }
  };

  return (
    <div>
      <h2 className='heading'>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username: <span className='required'>*</span></label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder='Please enter your name' required />
        </div>
        <div>
          <label>Location: <span className='required'>*</span></label>
          <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder='Please enter your location' required />
        </div>
        <div>
          <label>Role: <span className='required'>*</span></label>
          <div className='radio-group'>
            <label>
              <input type="radio" name="role" value="0" onChange={handleChange} /> Raw Material Supplier
            </label>
            <label>
              <input type="radio" name="role" value="1" onChange={handleChange} /> Manufacturer
            </label>
            <label>
              <input type="radio" name="role" value="2" onChange={handleChange} /> Distributor
            </label>
            <label>
              <input type="radio" name="role" value="3" onChange={handleChange} /> Retailer
            </label>
          </div>
        </div>
		<span className='required'>* indicates required fields</span>
        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
