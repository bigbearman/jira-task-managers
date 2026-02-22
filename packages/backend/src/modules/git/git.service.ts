import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface GitExecResult {
  success: boolean;
  output: string;
  exitCode: number;
}

@Injectable()
export class GitService {
  private readonly logger = new Logger(GitService.name);
  private readonly baseBranch: string;
  private readonly branchPrefix: string;

  constructor(private readonly configService: ConfigService) {
    this.baseBranch = this.configService.get('git.defaultBaseBranch', 'develop');
    this.branchPrefix = this.configService.get('git.branchPrefix', 'feature/');
  }

  async createBranch(ticketKey: string, projectPath: string): Promise<GitExecResult> {
    const branchName = `${this.branchPrefix}${ticketKey.toLowerCase()}`;
    this.logger.log(`Creating branch ${branchName} from ${this.baseBranch} in ${projectPath}`);

    try {
      // Fetch latest, checkout base, create new branch
      await this.execGit(`git fetch origin`, projectPath);
      await this.execGit(`git checkout ${this.baseBranch}`, projectPath);
      await this.execGit(`git pull origin ${this.baseBranch}`, projectPath);

      const result = await this.execGit(`git checkout -b ${branchName}`, projectPath);
      return { success: true, output: result, exitCode: 0 };
    } catch (error: any) {
      // Branch may already exist — try switching to it
      try {
        const result = await this.execGit(`git checkout ${branchName}`, projectPath);
        this.logger.warn(`Branch ${branchName} already exists, switched to it`);
        return { success: true, output: result, exitCode: 0 };
      } catch {
        return { success: false, output: error.message, exitCode: 1 };
      }
    }
  }

  async getChangedFiles(projectPath: string): Promise<string[]> {
    try {
      const output = await this.execGit(`git diff --name-only HEAD`, projectPath);
      const staged = await this.execGit(`git diff --cached --name-only`, projectPath);
      const untracked = await this.execGit(`git ls-files --others --exclude-standard`, projectPath);

      const allFiles = [output, staged, untracked]
        .join('\n')
        .split('\n')
        .map((f) => f.trim())
        .filter(Boolean);

      return Array.from(new Set(allFiles));
    } catch {
      return [];
    }
  }

  async runTests(projectPath: string, testCommand?: string): Promise<GitExecResult> {
    const cmd = testCommand ?? 'npm test -- --forceExit';
    this.logger.log(`Running tests: ${cmd} in ${projectPath}`);

    try {
      const output = await this.execGit(cmd, projectPath, 600000); // 10 min timeout
      return { success: true, output, exitCode: 0 };
    } catch (error: any) {
      return {
        success: false,
        output: error.stdout ?? error.message,
        exitCode: error.code ?? 1,
      };
    }
  }

  async commitAll(message: string, projectPath: string): Promise<GitExecResult> {
    this.logger.log(`Committing all changes in ${projectPath}`);

    try {
      await this.execGit(`git add -A`, projectPath);
      const output = await this.execGit(
        `git commit -m "${message.replace(/"/g, '\\"')}"`,
        projectPath,
      );
      return { success: true, output, exitCode: 0 };
    } catch (error: any) {
      return { success: false, output: error.message, exitCode: 1 };
    }
  }

  async push(branchName: string, projectPath: string): Promise<GitExecResult> {
    this.logger.log(`Pushing ${branchName} to origin`);

    try {
      const output = await this.execGit(
        `git push -u origin ${branchName}`,
        projectPath,
      );
      return { success: true, output, exitCode: 0 };
    } catch (error: any) {
      return { success: false, output: error.message, exitCode: 1 };
    }
  }

  async getLatestCommitSha(projectPath: string): Promise<string | null> {
    try {
      const sha = await this.execGit(`git rev-parse HEAD`, projectPath);
      return sha.trim();
    } catch {
      return null;
    }
  }

  async getCurrentBranch(projectPath: string): Promise<string | null> {
    try {
      const branch = await this.execGit(`git rev-parse --abbrev-ref HEAD`, projectPath);
      return branch.trim();
    } catch {
      return null;
    }
  }

  getBranchName(ticketKey: string): string {
    return `${this.branchPrefix}${ticketKey.toLowerCase()}`;
  }

  private async execGit(command: string, cwd: string, timeout = 60000): Promise<string> {
    const { stdout } = await execAsync(command, {
      cwd,
      timeout,
      maxBuffer: 5 * 1024 * 1024,
    });
    return stdout.trim();
  }
}
