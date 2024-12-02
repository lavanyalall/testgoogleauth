import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google"
import { BrowserRouter } from 'react-router-dom'



ReactDOM.createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<GoogleOAuthProvider clientId={clientId}>
			<React.StrictMode>
				<App />
			</React.StrictMode>
		</GoogleOAuthProvider>
	</BrowserRouter>
);