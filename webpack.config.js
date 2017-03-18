let path = require("path");
let glob = require("glob");
let webpack = require("webpack");
let ExtractTextPlugin = require("extract-text-webpack-plugin");
let CopyWebpackPlugin = require("copy-webpack-plugin");
let HtmlWebpackPlugin = require("html-webpack-plugin");

let node_dir = path.join(__dirname, "./node_modules/");
let output_dir = path.join(__dirname, "./dist");

//是否开发模式
let isProduction = process.env.NODE_ENV === "production";

//获取三层页面路径
let getEntry = function(globPath, pathDir) {
  let entries = {
    vendor: ["jquery"]
  };
  glob.sync(globPath).forEach(function(entry) {
    let pathname = entry.replace(pathDir, "").split(".")[0];
    entries[pathname] = entry;
  });
  return entries;
};
let entries = getEntry("./src/view/**/**/**/*.js", "./src/view/");
let chunks = Object.keys(entries);

//生成HTML文件
let HtmlPlugin = [];
chunks.forEach(function(pathname) {
  if (pathname === "vendor") return;
  let chunksName = pathname.substr(0, pathname.lastIndexOf("/"));
  let conf = {
    title: "My App",
    filename: pathname == "index/index"
      ? "index.html"
      : "view/" + chunksName + "/index.html",
    template: entries[pathname].split(".js")[0] + ".html",
    inject: "body",
    favicon: "./src/img/favicon.ico",
    chunks: ["vendor", pathname],
    hash: false,
    minify: {
      removeComments: true,
      collapseWhitespace: false
    }
  };
  HtmlPlugin.push(new HtmlWebpackPlugin(conf));
});

module.exports = {
  //入口
  entry: entries,
  //出口
  output: {
    path: output_dir,
    filename: isProduction ? "js/[name].[hash:8].js" : "js/[name].js",
    publicPath: "/",
    chunkFilename: "chunk/[name].chunk.js"
  },
  //loaders
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: "babel-loader",
        exclude: /node_modules/,
        query: {
          cacheDirectory: true,
          presets: ["es2015"]
        },
        include: [path.resolve(__dirname, "../")]
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.scss$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader!sass-loader"
        })
      },
      {
        test: /\.(png|jpe?g|gif)$/,
        loader: "url-loader?limit=8192&name=img/[hash:8].[ext]"
      },
      {
        test: /\.(woff|woff2|ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: "file-loader?limit=10000&name=fonts/[hash:8].[ext]"
      }
    ]
  },
  resolve: {
    extensions: [".js", ".json", ".scss", ".css"],
    alias: {
      mod: node_dir
    }
  },
  plugins: [
    //公共文件打包
    new webpack.optimize.CommonsChunkPlugin({
      name: "vendor",
      filename: isProduction ? "js/vendor.[hash:8].js" : "js/vendor.js",
      minChunks: 3
    }),
    //提取css
    new ExtractTextPlugin(
      isProduction ? "css/[name].[hash:8].css" : "css/[name].css"
    ),
    //复制public目录
    new CopyWebpackPlugin([
      {
        from: __dirname + "/src/public",
        to: output_dir + "/public"
      }
    ]),
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
    //混淆js
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        // drop_debugger: true,
        // drop_console: true
      }
    }),
    //定义环境变量
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
      "window.jQuery": "jquery"
    }),
    //生成HTML
    ...HtmlPlugin
  ],
  devtool: isProduction ? false : "source-map"
};
