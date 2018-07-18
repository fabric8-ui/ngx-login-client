/**
 * @author: @AngularClass
 */

// Look in ./config folder for webpack.test.js
switch (process.env.NODE_ENV) {
  case 'perf':
  case 'performance':
    module.exports = require('./config/webpack.perf')({env: 'performance'});
    break;
  case 'test':
  case 'testing':
  default:
    module.exports = require('./config/webpack.test')({env: 'test'});
}
