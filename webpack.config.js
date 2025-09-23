// webpack.config.js
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = (env, argv) => {
    const isDev = argv.mode !== 'production';

    return {
        mode: isDev ? 'development' : 'production',
        entry: path.resolve(__dirname, 'src/index.ts'),
        output: {
            filename: isDev ? '[name].js' : '[name].[contenthash].js',
            chunkFilename: isDev ? '[name].chunk.js' : '[name].[contenthash].chunk.js',
            path: path.resolve(__dirname, 'public'),
            publicPath: '/',
            clean: true,
        },
        devtool: isDev ? 'eval-cheap-module-source-map' : 'source-map',
        resolve: {
            extensions: ['.ts', '.tsx', '.js', '.d.ts'],
            alias: {
                "@": path.resolve(__dirname, "src"),
            },
            fallback: {
                buffer: require.resolve('buffer'),
            },
        },
        module: {
            rules: [
                {
                    test: /\.tsx?$/,
                    use: [{ loader: 'ts-loader', options: { transpileOnly: true } }],
                    exclude: /node_modules/,
                },
                {
                    test: /\.css$/i,
                    use: ['style-loader', 'css-loader'], // <- wichtig
                },
                // optional: wenn du Source Maps aus Abhängigkeiten willst
                { enforce: 'pre', test: /\.js$/, loader: 'source-map-loader' },
                // optional: CSS/Assets
                // { test: /\.css$/, use: ['style-loader', 'css-loader'] },
                // { test: /\.(png|svg|jpg|gif)$/, type: 'asset' },
            ],
        },
        plugins: [
            new HtmlWebpackPlugin({
                template: path.resolve(__dirname, 'src', 'index.html'),
                inject: 'body'
            }),
            // macht global Buffer verfügbar, wenn Libs das erwarten
            new webpack.ProvidePlugin({
                Buffer: ['buffer', 'Buffer'],
            }),
            new ForkTsCheckerWebpackPlugin(),
        ],
        devServer: {
            static: {
                directory: path.join(__dirname, 'public'),
            },
            port: 3000,
            hot: true,
            historyApiFallback: true,
            compress: true,
            client: {
                overlay: { errors: true, warnings: false },
                logging: 'info',
            },
            // Falls du gRPC-Web / Envoy lokal nutzt: hier Proxy einhängen
            // proxy: {
            //   '/arrow.flight.protocol.FlightService': {
            //     target: 'http://127.0.0.1:8081',
            //     changeOrigin: true,
            //     secure: false,
            //   },
            // },
            // falls du bewusst CORS brauchst (nicht nötig mit Proxy):
            // headers: { 'Access-Control-Allow-Origin': '*'}
        },
        optimization: {
            splitChunks: { chunks: 'all' },
            runtimeChunk: 'single',
        },
        performance: { hints: false },
    };
};