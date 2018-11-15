module.exports = {
  extends: [
    'dollarshaveclub',
  ],
  rules: {
    'no-console': 0,
  },
  plugins: ['jest'],
  env: {
    'jest/globals': true,
  },
  globals: {
    WebAssembly: false
  }
}