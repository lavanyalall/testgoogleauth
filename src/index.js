import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google"
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
require('dotenv').config();

ReactDOM.createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<GoogleOAuthProvider clientId={process.env.REACT_APP_CLIENT_ID}>
			<React.StrictMode>
				<App />
				<Toaster reverseOrder = {false} position='top-center' toastOptions={{duration: 5000, style: {maxWidth: '500px'}}} />
			</React.StrictMode>
		</GoogleOAuthProvider>
	</BrowserRouter>
);