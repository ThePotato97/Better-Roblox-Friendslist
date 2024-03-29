const path = require('path');
const {
  merge,
} = require('webpack-merge');
const {
  HotModuleReplacementPlugin,
} = require('webpack');
const {
  CleanWebpackPlugin,
} = require('clean-webpack-plugin');
const AntdDayjsWebpackPlugin = require('antd-dayjs-webpack-plugin');
const LodashWebpackPlugin = require('lodash-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WebpackBarPlugin = require('webpackbar');
const FriendlyErrorsWebpackPlugin = require('@soda/friendly-errors-webpack-plugin');
const {
  BundleAnalyzerPlugin,
} = require('webpack-bundle-analyzer');
const env = require('./utils/env');

const isDevelopment = env.NODE_ENV !== 'production';
const isAnalyzer = env.ANALYZER === 'true';

let config = {
  entry: {
    background: path.resolve(__dirname, 'src/pages/Background/index.js'),
    contentScript: path.resolve(__dirname, 'src/pages/ContentScript/index.js'),
    WindowCommunication: path.resolve(__dirname, 'src/pages/WindowCommunication/inject.js'),
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
    publicPath: '/',
  },
  friendsListConfig: {
    notHotReload: ['background', 'contentScript'],
    backgroundScripts: ['background'],
    contentScrips: ['contentScript'],
  },
  module: {
    rules: [{
      test: /\.[jt]sx?$/i,
      exclude: /node_modules/,
      loader: 'babel-loader',
    },
    {
      test: /\.css$/i,
      use: ['style-loader', 'css-loader'],
    },
    {
      test: /\.s[ac]ss$/i,
      use: [
        // Creates `style` nodes from JS strings
        "style-loader",
        // Translates CSS into CommonJS
        "css-loader",
        // Compiles Sass to CSS
        "sass-loader",
      ],
    },
    {
      test: /\.less$/i,
      use: [
        'style-loader',
        'css-loader',
        {
          loader: 'less-loader',
          options: {
            lessOptions: {
              javascriptEnabled: true,
            },
          },
        },
      ],
    },
    {
      test: /\.(png|jpe?g|gif)$/i,
      use: [{
        loader: 'url-loader',
        options: {
          name: '[name]_[hash:6].[ext]',
          esModule: false,
          limit: 0,
        },
      }],
    }],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new AntdDayjsWebpackPlugin(),
    new LodashWebpackPlugin(),
    new CopyWebpackPlugin({
      patterns: [{
        from: path.resolve(__dirname, 'public'),
        to: path.resolve(__dirname, 'build'),
      }],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
  },
};

if (isDevelopment) {
  config = merge(config, {
    mode: 'development',
    stats: false,
    devtool: 'inline-cheap-module-source-map',
    plugins: [
      new FriendlyErrorsWebpackPlugin(),
      new HotModuleReplacementPlugin(),
      new ReactRefreshPlugin({
        overlay: false,
      }),
    ],
  });
} else {
  config = merge(config, {
    mode: 'production',
    module: {
      rules: [{
        test: /\.[jt]sx?$/i,
        enforce: 'pre',
        exclude: /node_modules/,
        use: [{
          loader: 'webpack-strip-block',
          options: {
            start: 'debug:start',
            end: 'debug:end',
          },
        }],
      }],
    },
    plugins: [
      new WebpackBarPlugin(),
      ...(isAnalyzer ? [
        new BundleAnalyzerPlugin({
          analyzerMode: 'server',
          analyzerHost: env.HOST,
          analyzerPort: env.PORT,
          logLevel: 'silent',
        }),
      ] : []),
    ],
    optimization: {
      minimize: false,
    },
    performance: {
      maxEntrypointSize: 4096000,
      maxAssetSize: 1024000,
    },
  });
}

module.exports = config;
