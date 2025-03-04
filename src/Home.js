import React from 'react';
import { useNavigate } from 'react-router-dom';

function Home({ googleId, isRegistered, role, handleGoogleLogin, logoutUser }) {
	const navigate = useNavigate();
	return (
		<div>
			<h1>CraftChain Commerce</h1>
			<h4>E-Marketplace for Artisans using Blockchain</h4>
			<p>Discover a world of unique, handmade creations directly from talented artisans across the globe. We are committed to empowering artisans by providing a platform that celebrates their creativity and craftsmanship. Every purchase supports these skilled creators and helps preserve traditional arts. Explore our curated collection of authentic, handmade  products crafted by skilled artisans. Each piece is a work of art, carrying the story and tradition of its maker. Support artisans and find something truly special. Behind every product is a story, a craft, and a talented artisan who brings it to life. At CraftChain Commerce, we celebrate the incredible skills and creativity of artisans from around the world. Each piece you see here is the result of dedication, passion, and tradition passed down through generations.</p>
			<div className='btn-cont'>
				{!googleId ? (
					<button className="google_sign" onClick={() => handleGoogleLogin()}>Sign In with Google</button>
				) : (
					<button onClick={logoutUser}>Logout</button>
				)}
				{!isRegistered && googleId && (
					<button onClick={() => navigate('/register')}>Register</button>
				)}
				{isRegistered && googleId && (
					<>
						<button onClick={() => {
							if (role === 0) {
								navigate('/rms-dashboard');
							}
							else if (role === 1) {
								navigate('/manufacturer-dashboard');
							}
							else if (role === 2) {
								navigate('/consumer-dashboard');
							}
						}}>Go to Dashboard</button>
					</>
				)}
			</div>
		</div>
	);
}

export default Home;
