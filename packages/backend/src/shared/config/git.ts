import { registerAs } from '@nestjs/config';

export const configGit = registerAs('git', () => ({
  defaultBaseBranch: process.env.GIT_DEFAULT_BASE_BRANCH || 'develop',
  branchPrefix: process.env.GIT_BRANCH_PREFIX || 'feature/',
  autoCommit: process.env.GIT_AUTO_COMMIT !== 'false',
  autoPush: process.env.GIT_AUTO_PUSH !== 'false',
  autoCreatePr: process.env.GIT_AUTO_CREATE_PR !== 'false',
  ghCliPath: process.env.GH_CLI_PATH || 'gh',
}));
