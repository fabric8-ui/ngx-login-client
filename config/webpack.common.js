/**
 * Adapted from angular2-webpack-starter
 *
 * By using the name "webpack.common.js" we can have this file merged to the other
 * webpack configs, thus giving us a place for shared/common settings.
 *
 */
const webpack = require('webpack');
const helpers = require('./helpers');
var path = require('path');
var stringify = require('json-stringify');

/**
 * Webpack Plugins
 */
const CleanWebpackPlugin = require('clean-webpack-plugin');
const OptimizeJsPlugin = require('optimize-js-plugin');

/**
 * Webpack Constants
 */
const METADATA = {
  baseUrl: '/',
  isDevServer: helpers.isWebpackDevServer(),
  FABRIC8_BRANDING: process.env.FABRIC8_BRANDING || 'fabric8'
};

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = {
  /**
   * Cache generated modules and chunks to improve performance for multiple incremental builds.
   * This is enabled by default in watch mode.
   * You can pass false to disable it.
   *
   * See: http://webpack.github.io/docs/configuration.html#cache
   */
  //cache: false,

  /**
   * The entry point for the bundle
   * Our Angular.js app
   *
   * See: https://webpack.js.org/configuration/entry-context/#entry
   */
  entry: helpers.root('index.ts'),

  devtool: 'inline-source-map',

  /**
   * Options affecting the resolving of modules.
   *
   * See: https://webpack.js.org/configuration/resolve
   */
  resolve: {

    /**
     * An array that automatically resolve certain extensions.
     * Which is what enables users to leave off the extension when importing.
     *
     * See: https://webpack.js.org/configuration/resolve/#resolve-extensions
     */
    extensions: ['.ts', '.js', '.json'],
  },

  /**
   * Options affecting the normal modules.
   *
   * See: http://webpack.github.io/docs/configuration.html#module
   */
  module: {
    rules: [

      /**
       * Typescript loader support for .ts and Angular 2 async routes via .async.ts
       * Replace templateUrl and stylesUrl with require()
       *
       * See: https://github.com/s-panferov/awesome-typescript-loader
       * See: https://github.com/TheLarkInn/angular2-template-loader
       */
      // {
      //   test: /\.ts$/,
      //   enforce: 'pre',
      //   use: 'tslint-loader',
      //   exclude: [helpers.root('node_modules')]
      // },
      {
        test: /\.ts$/,
        use: [
          'ts-loader',
          'angular2-template-loader'
        ],
        exclude: [/\.(spec|e2e)\.ts$/]
      },

      /*
       * Json loader support for *.json files.
       *
       * See: https://github.com/webpack/json-loader
       */
      {
        test: /\.json$/,
        use: ['json-loader']
      }
    ]
  },

  /**
   * Add additional plugins to the compiler.
   *
   * See: http://webpack.github.io/docs/configuration.html#plugins
   */
  plugins: [
    /**
     * Plugin: ContextReplacementPlugin
     * Description: Provides context to Angular's use of System.import
     *
     * See: https://webpack.github.io/docs/list-of-plugins.html#contextreplacementplugin
     * See: https://github.com/angular/angular/issues/11580
     */
    new webpack.ContextReplacementPlugin(
      // The (\\|\/) piece accounts for path separators in *nix and Windows
      /angular(\\|\/)core(\\|\/)@angular/,
      helpers.root('./src')
    ),

    /**
     * Webpack plugin to optimize a JavaScript file for faster initial load
     * by wrapping eagerly-invoked functions.
     *
     * See: https://github.com/vigneshshanmugam/optimize-js-plugin
     */

    new OptimizeJsPlugin({
      sourceMap: false
    }),

    new HtmlWebpackPlugin(),

    new webpack.LoaderOptionsPlugin({
      options: {
        tslintLoader: {
          emitErrors: false,
          failOnHint: false
        },

      }
    }),
    // Reference: http://webpack.github.io/docs/list-of-plugins.html#noerrorsplugin
    // Only emit files when there are no errors
    new webpack.NoEmitOnErrorsPlugin(),

    // // Reference: http://webpack.github.io/docs/list-of-plugins.html#dedupeplugin
    // // Dedupe modules in the output
    // new webpack.optimize.DedupePlugin(),

    // Reference: http://webpack.github.io/docs/list-of-plugins.html#uglifyjsplugin
    // Minify all javascript, switch loaders to minimizing mode
    // new webpack.optimize.UglifyJsPlugin({sourceMap: true, mangle: { keep_fnames: true }}),

    // Copy assets from the public folder
    // Reference: https://github.com/kevlened/copy-webpack-plugin
    // new CopyWebpackPlugin([{
    //   from: helpers.root('src/public')
    // }]),

    // Reference: https://github.com/johnagan/clean-webpack-plugin
    // Removes the bundle folder before the build
    new CleanWebpackPlugin(['bundles'], {
      root: helpers.root(),
      verbose: false,
      dry: false
    })
  ],

  /**
   * Include polyfills or mocks for various node stuff
   * Description: Node configuration
   *
   * See: https://webpack.github.io/docs/configuration.html#node
   */
  node: {
    global: true,
    crypto: 'empty',
    process: true,
    module: false,
    clearImmediate: false,
    setImmediate: false
  }
};
