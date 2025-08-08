const path = require('path');

module.exports = {
    mode: 'development',
    entry: './proto/main.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'public'),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, 'public'),
        },
        port: 3000,
    },
    resolve: {
        fallback: {
            buffer: require.resolve('buffer'),
        },
    },
};