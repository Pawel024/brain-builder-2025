const { override, addWebpackResolve, addBabelPlugin } = require('customize-cra');

module.exports = override(
  addWebpackResolve({
    fallback: {
      buffer: require.resolve('buffer/'),
    },
  }),
  // Add Babel cache configuration
  (config) => {
    if (config.module) {
      const babelLoader = config.module.rules.find(rule => 
        rule.loader && rule.loader.includes('babel-loader')
      );
      if (babelLoader) {
        babelLoader.options = {
          ...babelLoader.options,
          cacheDirectory: true,
          cacheCompression: process.env.NODE_ENV === 'production',
          caller: {
            cache: true,
            name: 'babel-react-compiler',
            supportsDynamicImport: true,
            supportsStaticESM: true,
            env: process.env.NODE_ENV
          }
        };
      }
    }
    return config;
  },
  addBabelPlugin([
    'babel-plugin-react-compiler',
    {
      target: '18',
      cache: true,
      optimize: process.env.NODE_ENV === 'production',
      debug: process.env.NODE_ENV !== 'production'
    }
  ])
);