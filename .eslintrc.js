module.exports = {
  extends: [
    'react-app'
  ],
  plugins: [
    'react-compiler'
  ],
  rules: {
    'react-compiler/react-compiler': ['error', {
      target: '18'
    }]
  },
  parserOptions: {
    babelOptions: {
      plugins: [
        ['babel-plugin-react-compiler', { target: '18' }]
      ]
    }
  }
};