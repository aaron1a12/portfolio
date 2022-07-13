const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const path = require('path');

const isDevMode = (process.argv.find(a =>a.includes("dev"))) ? true : false;

module.exports = {
    entry: './src/ts/main.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings (dev)
                    // OR create separate
                    isDevMode ? "style-loader" : MiniCssExtractPlugin.loader,
                    // Translates CSS into CommonJS
                    "css-loader",
                    // Compiles Sass to CSS
                    {
                        loader: "sass-loader",
                        options: {
                          // Prefer `dart-sass`
                          implementation: require("sass"),
                          sourceMap: true
                        },
                    }
                ],
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            // Options similar to the same options in webpackOptions.output
            // both options are optional
            filename: '[name].[contenthash].css',
            chunkFilename: '[id].css'
        }),
        new HtmlWebpackPlugin({
            dev: isDevMode,
            hash: true,
            title: 'Aaron Escobar - Web Developer in Miami',
            myPageHeader: "I'll worry about the code so you don't have to...",
            template: './src/index.html',
            filename: './index.html' //relative to root of the application
        })
    ],
    resolve: {
        alias: {
            three: path.resolve('./node_modules/three')
        },
        extensions: ['.tsx', '.ts', '.js'],
    },
    output: {
        filename: 'portfolio_bundle.[contenthash].js',
        path: path.resolve(__dirname, '../www'),
    }
};