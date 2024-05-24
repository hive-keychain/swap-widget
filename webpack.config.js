const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const dotenv = require("dotenv");
const { DefinePlugin } = require("webpack");
module.exports = {
  mode: "development",
  entry: "./src/index.tsx",
  devtool: "inline-source-map",
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "bundle.js",
  },
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
    headers: {
      "Content-Security-Policy":
        "frame-ancestors 'self' localhost:* http://* https://* chrome-extension://*;default-src 'self' 'unsafe-inline' http://* https://* chrome-extension://*; frame-src 'self' 'unsafe-inline' http://* https://* chrome-extension://*; script-src 'self' 'unsafe-inline' http://* https://* chrome-extension://*;",
    },
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
      },
      {
        test: /\.(scss|css)$/,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: { url: false },
          },
          {
            loader: "sass-loader",
          },
        ],
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.svg$/,
        use: ["@svgr/webpack"],
      },
      {
        test: /\.png$/,
        use: [
          {
            loader: "url-loader",
            options: {
              mimetype: "image/png",
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@utils": path.resolve(__dirname, "src/utils/"),
      "@api": path.resolve(__dirname, "src/api/"),
      "@interfaces": path.resolve(__dirname, "src/interfaces/"),
      "@configFile": path.resolve(__dirname, "src/config.ts"),
      "@classes": path.resolve(__dirname, "src/classes/"),
      "@common-style": path.resolve(__dirname, "src/common-style/"),
      "@components": path.resolve(__dirname, "src/components/"),
      "@common-ui": path.resolve(__dirname, "src/common-ui/"),
      "@theme-context": path.resolve(__dirname, "src/theme.context.tsx"),
      "@i18n": path.resolve(__dirname, "src/i18n/"),
      "@reference-data": path.resolve(__dirname, "src/reference-data/"),
    },
  },
  plugins: [
    new DefinePlugin({
      "process.env": JSON.stringify(dotenv.config().parsed),
    }),
    new CopyPlugin({
      patterns: [{ from: "public", to: "." }],
    }),
    new HtmlWebpackPlugin({
      template: "./src/index.html",
    }),
    new NodePolyfillPlugin(),
  ],
};
