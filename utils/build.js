process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';

const webpack = require('webpack');
const config = require('../webpack.config');

delete config.boilerplateConfig;

const compiler = webpack(config);
compiler.run((err, stats) => {
  if (err) {
    throw err;
  }
  console.log(stats.toString());
})
