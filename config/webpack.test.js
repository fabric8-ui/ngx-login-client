/**
 * @author: @AngularClass
 */

const helpers = require('./helpers');
const path = require('path');
const stringify = require('json-stringify');

/**
 * Webpack Plugins
 */
const webpack = require('webpack');
const ProvidePlugin = require('webpack/lib/ProvidePlugin');
const ContextReplacementPlugin = require('webpack/lib/ContextReplacementPlugin');
const DefinePlugin = require('webpack/lib/DefinePlugin');
const LoaderOptionsPlugin = require('webpack/lib/LoaderOptionsPlugin');

/**
 * Webpack Constants
 */
const ENV = process.env.ENV = process.env.NODE_ENV = 'test';
const API_URL = process.env.API_URL || (ENV == 'inmemory' ? 'app/' : 'http://localhost:8080/api/');
const FABRIC8_WIT_API_URL = process.env.FABRIC8_WIT_API_URL;
const FABRIC8_RECOMMENDER_API_URL = process.env.FABRIC8_RECOMMENDER_API_URL || 'http://api-bayesian.dev.rdu2c.fabric8.io/api/v1/';

/**
 * Webpack configuration
 *
 * See: http://webpack.github.io/docs/configuration.html#cli
 */
module.exports = function () {
  return {

    entry: {
      'app': './index.ts'
    },

    /**
     * As of Webpack 4 we need to set the mode.
     * Since this is a library and it uses gulp to build the library,
     * we only have Test and Perf.
     */
    mode: 'development',

    /**
     * Source map for Karma from the help of karma-sourcemap-loader &  karma-webpack
     *
     * Do not change, leave as is or it wont work.
     * See: https://github.com/webpack/karma-webpack#source-maps
     */
    devtool: 'inline-source-map',

    /**
     * Options affecting the resolving of modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#resolve
     */
    resolve: {

      /**
       * An array of extensions that should be used to resolve modules.
       *
       * See: http://webpack.github.io/docs/configuration.html#resolve-extensions
       */
      extensions: ['.ts', '.js']
    },

    /**
     * Options affecting the normal modules.
     *
     * See: http://webpack.github.io/docs/configuration.html#module
     */
    module: {
      /**
       * An array of automatically applied loaders.
       *
       * IMPORTANT: The loaders here are resolved relative to the resource which they are applied to.
       * This means they are not resolved relative to the configuration file.
       *
       * See: http://webpack.github.io/docs/configuration.html#module-loaders
       */
      rules: [

        /**
         * Source map loader support for *.js files
         * Extracts SourceMaps for source files that as added as sourceMappingURL comment.
         *
         * See: https://github.com/webpack/source-map-loader
         */
        // {
        //   test: /\.js$/,
        //   use: ['source-map-loader'],
        //   exclude: [
        //     // these packages have problems with their sourcemaps
        //     helpers.root('node_modules/rxjs'),
        //     helpers.root('node_modules/@angular')
        //   ]
        // },

        /**
         * Typescript loader support for .ts and Angular 2 async routes via .async.ts
         *
         * See: https://github.com/s-panferov/awesome-typescript-loader
         */
        {
          test: /\.ts$/,
          use: [
            'ts-loader',
            'angular2-template-loader'
          ],
          exclude: [/\.e2e\.ts$/]
        },

        /**
         * Json loader support for *.json files.
         *
         * See: https://github.com/webpack/json-loader
         */
        {
          test: /\.json$/,
          type: "javascript/auto",
          use: ['custom-json-loader'],
          exclude: [helpers.root('src/index.html')]
        },

        /**
           * Instruments JS files with Istanbul for subsequent code coverage reporting.
           * Instrument only testing sources.
           *
           * See: https://github.com/deepsweet/istanbul-instrumenter-loader
           */
        {
          enforce: 'post',
          test: /\.(js|ts)$/,
          loader: 'istanbul-instrumenter-loader',
          query: {
            esModules: true
          },
          include: helpers.root('src'),
          exclude: [
            /\.(e2e|spec|mock)\.ts$/,
            /node_modules/
          ]
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
       * Plugin: DefinePlugin
       * Description: Define free variables.
       * Useful for having development builds with debug logging or adding global constants.
       *
       * Environment helpers
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#defineplugin
       */
      // NOTE: when adding more properties make sure you include them in custom-typings.d.ts
      new DefinePlugin({
        'ENV': stringify(ENV),
        'HMR': false,
        'process.env': {
          'ENV': stringify(ENV),
          'API_URL': stringify(API_URL),
          'NODE_ENV': stringify(ENV),
          'HMR': false
        }
      }),

      /**
       * Plugin: ContextReplacementPlugin
       * Description: Provides context to Angular's use of System.import
       *
       * See: https://webpack.github.io/docs/list-of-plugins.html#contextreplacementplugin
       * See: https://github.com/angular/angular/issues/11580
       */
      new ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        // /angular(\\|\/)core(\\|\/)@angular/,
        /\@angular(\\|\/)core(\\|\/)fesm5/,
        helpers.root('./src')
      ),
      new ContextReplacementPlugin(
        // The (\\|\/) piece accounts for path separators in *nix and Windows
        /angular(\\|\/)core(\\|\/)@angular/,
        helpers.root('src') // location of your src
      )
    ],

    /**
     * Include polyfills or mocks for various node stuff
     * Description: Node configuration
     *
     * See: https://webpack.github.io/docs/configuration.html#node
     */
    node: {
      global: true,
      process: false,
      crypto: 'empty',
      module: false,
      clearImmediate: false,
      setImmediate: false
    }
  };
};
