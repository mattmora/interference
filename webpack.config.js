const path = require('path');
const fs = require('fs');
const TerserPlugin = require('terser-webpack-plugin')

module.exports = {
    mode: 'production',
    optimization: {
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    keep_classnames: true,
                    keep_fnames: true,
                    extractComments: 'all',
                    compress: {
                        drop_console: true,
                    }
                }
            })
        ]
    },
    entry: './src/client/clientEntryPoint.js',
    output: {
        path: path.join(__dirname, 'dist'),
        filename: 'bundle.js'
    },
    devtool: 'source-map',
    module: {
        rules: [
            { test: /\.css$/, loader: 'style!css' },
            {
                test: /\.scss$/,
                loaders: ['style-loader', 'raw-loader', 'sass-loader']
            },
            {
                test: /\.js$/,
                include: [
                    path.resolve(__dirname, 'src'),
                    path.resolve(__dirname, 'node_modules/lance-gg/'),
                    fs.realpathSync('./node_modules/lance-gg/')
                ],
                loader: 'babel-loader',
                query: {
                    presets: ['@babel/preset-env'].map(require.resolve)
                }
            }
        ]
    }
};

