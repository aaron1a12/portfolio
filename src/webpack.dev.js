const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')
const path = require('path');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'eval-source-map',
    watch: true,
    devServer: {
        static: {
            directory: path.join(__dirname, '../www'),
        },
        hot: true,
        headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, PATCH, OPTIONS",
            "Access-Control-Allow-Headers": "X-Requested-With, content-type, Authorization"
        },
        allowedHosts: [
            'aaronescobar.com',
            'www.aaronescobar.com'
          ]
    },
})