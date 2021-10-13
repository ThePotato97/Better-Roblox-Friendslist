// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'development';
process.env.NODE_ENV = 'development';

const path = require('path');
const webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const env = require('./env');
const config = require('../webpack.config');

const options = config.boilerplateConfig || {};
const excludedEntriesToHotReload = options.notHotReload || [];

for (let entryName in config.entry) {
  if (excludedEntriesToHotReload.indexOf(entryName) === -1) {
    config.entry[entryName] = [
      `webpack-dev-server/client?hostname=${env.HOST}&port=${env.PORT}&hot=true`,
      'webpack/hot/dev-server',
    ].concat(config.entry[entryName]);
  }
}

delete config.boilerplateConfig;

const compiler = webpack(config);

const server = new WebpackDevServer({
  hot: false,
  liveReload: false,
  client: false,
  devMiddleware: {
    writeToDisk: true,
  },
  host: env.HOST,
  port: env.PORT,
  static: path.resolve(__dirname, '../build'),
}, compiler);

server.start(env.PORT);
