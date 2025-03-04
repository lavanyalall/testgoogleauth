const webpack = require('webpack');

module.exports = function override(config) {
	const fallback = config.resolve.fallback || {};
	Object.assign(fallback, {
		"crypto": require.resolve("crypto-browserify"),
		"stream": require.resolve("stream-browserify"),
		"assert": require.resolve("assert"),
		"http": require.resolve("stream-http"),
		"https": require.resolve("https-browserify"),
		"os": require.resolve("os-browserify"),
		"url": require.resolve("url"),
		"path": require.resolve("path-browserify"),
		"vm": require.resolve("vm-browserify"),
		'process/browser': require.resolve('process/browser'),
		"querystring": require.resolve("querystring-es3"),
		"fs": false,  
		"zlib": require.resolve("browserify-zlib")
	})
	config.resolve.fallback = fallback;
	config.plugins = (config.plugins || []).concat([
		new webpack.ProvidePlugin({
			process: 'process/browser',
			Buffer: ['buffer', 'Buffer']
		})
	])
	config.module.rules.unshift({
		test: /\.m?js$/,
		resolve: {
			fullySpecified: false, // disable the behavior
		},
	})
	return config;
}