const path = require('path');
const srcJsDir = path.resolve(__dirname, 'src/js');

const sourceModuleMapper = {};
const fs = require('fs');
if (fs.existsSync(srcJsDir)) {
  fs.readdirSync(srcJsDir).forEach(function(file) {
    if (file.endsWith('.ts')) {
      const baseName = file.replace(/\.ts$/, '');
      sourceModuleMapper['^\\.\\/' + baseName + '\\.js$'] = '<rootDir>/src/js/' + baseName + '.ts';
    }
  });
}

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  moduleNameMapper: sourceModuleMapper,
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
};
