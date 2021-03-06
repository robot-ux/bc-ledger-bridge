/* eslint-disable @typescript-eslint/no-var-requires */

const path = require('path');

const HtmlPlugin = require('html-webpack-plugin');

const paths = {
  src: path.join(__dirname, 'src'),
  dist: path.join(__dirname, 'dist'),
};

module.exports = {
  name: 'bridge',
  mode: 'production',
  devtool: undefined,

  entry: './src/index.ts',

  output: {
    path: path.join(__dirname, 'build'),
    filename: 'bundle.js',
  },

  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.js'],
  },

  module: {
    rules: [{ test: /\.tsx?$/, use: ['babel-loader', 'ts-loader'] }],
  },
};
