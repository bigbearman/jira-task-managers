import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/database$': '<rootDir>/src/modules/database/index',
    '^@/database/(.*)$': '<rootDir>/src/modules/database/$1',
    '^@/api/(.*)$': '<rootDir>/src/modules/api/$1',
    '^@/worker/(.*)$': '<rootDir>/src/modules/worker/$1',
    '^@/queue/(.*)$': '<rootDir>/src/modules/queue/$1',
    '^@/jira/(.*)$': '<rootDir>/src/modules/jira/$1',
    '^@/claude/(.*)$': '<rootDir>/src/modules/claude/$1',
    '^@/git/(.*)$': '<rootDir>/src/modules/git/$1',
    '^@/telegram/(.*)$': '<rootDir>/src/modules/telegram/$1',
    '^@/notification/(.*)$': '<rootDir>/src/modules/notification/$1',
    '^@/shared/(.*)$': '<rootDir>/src/shared/$1',
  },
};

export default config;
