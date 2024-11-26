module.exports = {
  // transformIgnorePatterns: [
  //   'node_modules/@defra/(?!(smart-incident-reporting)/)'
  // ],
  collectCoverage: true,
  coverageReporters: [
    'lcov',
    'text'
  ],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  coveragePathIgnorePatterns: [
    '__test-helpers__'
  ],
  setupFiles: [
    '<rootDir>/.jest/test.env.js'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/.jest/setup.js'
  ],
  testPathIgnorePatterns: [
    '__test-helpers__'
  ]
}
