const webpack = require("webpack");
const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");

module.exports = {
    target: "electron-main",
    entry: "./main.js",
    output: {
        path: path.resolve(__dirname, "dist"),
        filename: "main.js"
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(),
        new webpack.DefinePlugin({
            "__dirname": "__dirname"
        }),
        new CopyWebpackPlugin({
            patterns: [
                { from: "views",
                    to: "views" },
                { from: "templates",
                    to: "templates" },
                { from: "tipoftheday",
                    to: "tipoftheday" },
                { from: "dlgs",
                    to: "dlgs" },
                { from: "keymaps",
                    to: "keymaps" },
                { from: "menus",
                    to: "menus" },
                { from: "preferences",
                    to: "preferences" },
                {
                    from: "*.*",
                    globOptions: {
                        ignore: ["**/*.js"]
                    }
                }
            ]
        })
    ]
};