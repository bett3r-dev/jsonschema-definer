/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  // preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',
  // verbose:true,
  testMatch: ['**/*test.ts'],
  moduleDirectories: [
    'node_modules',
    '<rootDir>'
  ],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }

}
