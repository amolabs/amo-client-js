module.exports = {
  moduleFileExtensions: [
    'js'
  ],
  transform: {
    '^.+\\.js?$': '<rootDir>/node_modules/babel-jest'
  },
  testEnvironment: 'node',
  transformIgnorePatterns: ['<rootDir>/node_modules/']
}
