/**
 * @author: @AngularClass
 */

const helpers = require('./helpers');
const webpackMerge = require('webpack-merge'); // used to merge webpack configs
/**
 * By using the name "webpack.common.js" we can have this file automatically find and merge
 * the common webpack configs, thus giving us a place for shared/common settings.
 */
const commonConfig = require('./webpack.common.js');

module.exports = function (env) {
  console.log('The env from the webpack.prod config: ' + JSON.stringify(env, null, 2));
  return webpackMerge(commonConfig, {

    /**
     * Developer tool to enhance debugging
     *
     * See: http://webpack.github.io/docs/configuration.html#devtool
     * See: https://github.com/webpack/docs/wiki/build-performance#sourcemaps
     */
    devtool: 'source-map',

    output: {
      path: helpers.root('dist'),
      publicPath: '/',
      filename: 'bundles/ngx-widgets.js',
      library: 'ngx-widgets',
      libraryTarget: 'umd',
      umdNamedDefine: true
    }
  });
};
