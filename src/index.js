import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.js'
import './index.css'
import { GoogleOAuthProvider } from "@react-oauth/google"

const clientId = "243909961758-66vbkjigkn69aach9tgmuo9rivrdfg1l.apps.googleusercontent.com"; 

ReactDOM.createRoot(document.getElementById('root')).render(
	<GoogleOAuthProvider clientId={clientId}>
	  <React.StrictMode>
		<App />
	  </React.StrictMode>
	</GoogleOAuthProvider>
  );