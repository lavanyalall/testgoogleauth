import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google"
require('dotenv').config()


ReactDOM.createRoot(document.getElementById('root')).render(
	<GoogleOAuthProvider clientId={process.env.clientId}>
	  <React.StrictMode>
		<App />
	  </React.StrictMode>
	</GoogleOAuthProvider>
  );