var path = require('path');
var glob = require('glob');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var node_dir = path.join(__dirname, './node_modules/');
var HtmlWebpackPlugin = require('html-webpack-plugin');

var isProduction = process.env.NODE_ENV === 'production';

var getEntry = function(globPath, pathDir) {
  var entries = {
    vendor: []
  };
  glob.sync(globPath).forEach(function(entry) {
    var pathname = entry.replace(pathDir, '').split('.')[0]
    entries[pathname] = entry;
  });
  return entries;
};
var entries = getEntry('./src/view/**/**/*.js', './src/view/');
var chunks = Object.keys(entries);

var HtmlPlugin = [];
chunks.forEach(function(pathname) {
  if (pathname === 'vendor') return;
  var conf = {
    title: 'My App',
    filename: (pathname == 'index/index' ? 'index.html' : 'view/' + pathname + '.html'),
    template: entries[pathname].split('.js')[0] + '.html',
    inject: 'body',
    chunks: ['vendor', pathname],
    hash: false,
    minify: {
      removeComments: true,
      collapseWhitespace: false
    }
  };
  HtmlPlugin.push(new HtmlWebpackPlugin(conf));
});

module.exports = {
  entry: entries,
  output: {
    path: path.join(__dirname, './dist'),
    filename: isProduction ? 'js/[name].[hash:8].js' : 'js/[name].js',
    publicPath: '/',
    chunkFilename: 'chunk/[name].chunk.js'
  },
  module: {
    noParse: [],
    loaders: [{
      test: /\.jsx?$/,
      loader: 'babel',
      query: {
        presets: ['es2015', 'react']
      },
      exclude: node_dir
    }, {
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('style', 'css')
    }, {
      test: /\.less$/,
      loader: ExtractTextPlugin.extract('style', 'css!less')
    }, {
      test: /\.(png|jpe?g|gif)$/,
      loader: 'url?limit=8192&name=img/[hash:8].[ext]'
    }, {
      test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
      loader: 'file?limit=10000&name=fonts/[hash:8].[ext]'
    }, {
      test: /\.scss$/,
      loader: ExtractTextPlugin.extract('style', 'css!sass')
    }]
  },
  resolve: {
    extensions: ['', '.js', '.json'],
    alias: {
      mod: node_dir
    }
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: isProduction ? 'js/vendor.[hash:8].js' : 'js/vendor.js',
      minChunks: 3
    }),
    new ExtractTextPlugin(isProduction ? 'css/[name].[hash:8].css' : 'css/[name].css'),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production')
      }
    }),
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false
      }
    }),
    ...HtmlPlugin
  ],
  devtool: isProduction ? null : 'source-map'
};
