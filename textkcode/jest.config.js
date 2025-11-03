module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  moduleNameMapper: {
    '^@kcode/(.*)$': '<rootDir>/src/kcode/$1'
  }
};
