/**
 * Jest配置文件
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: ['**/tests/**/*.test.js'],

  // 忽略的文件或目录
  testPathIgnorePatterns: ['/node_modules/', '/build/', '/temp/', '/library/'],

  // 覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: ['../assets/scripts/**/*.ts', '!**/node_modules/**', '!**/vendor/**'],
  coverageDirectory: 'coverage',

  // 测试超时时间
  testTimeout: 10000,

  // 测试报告格式
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: './test-results',
        outputName: 'junit.xml',
      },
    ],
  ],

  // 模块别名
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../assets/$1',
  },

  // 转换器
  transform: {
    '^.+\\.jsx?$': 'babel-jest',
  },

  // 设置全局变量
  globals: {
    'ts-jest': {
      tsconfig: '../tsconfig.json',
    },
  },

  // 在每个测试文件执行前运行的脚本
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
};
