module.exports = function(config) {
  config.set({

    basePath: '',

    frameworks: ['jasmine'],

    files: [
      'test/shim/es5-shim.js',
      'node_modules/immutable/dist/immutable.js',
      'test/shim/commonjs-shim.js',
      'src/ts/search/queryParser.js',
      'test/*.js'
    ],

    reporters: ['progress'],

    port: 9876,

    colors: true,

    logLevel: config.LOG_INFO,

    autoWatch: false,

    browsers: ['PhantomJS'],

    captureTimeout: 60000,

    singleRun: true
  });
};
