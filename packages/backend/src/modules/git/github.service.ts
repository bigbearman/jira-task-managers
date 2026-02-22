import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface PrCreateResult {
  success: boolean;
  prNumber: number | null;
  prUrl: string | null;
  output: string;
}

@Injectable()
export class GithubService {
  private readonly logger = new Logger(GithubService.name);
  private readonly ghCliPath: string;
  private readonly baseBranch: string;

  constructor(private readonly configService: ConfigService) {
    this.ghCliPath = this.configService.get('git.ghCliPath', 'gh');
    this.baseBranch = this.configService.get('git.defaultBaseBranch', 'develop');
  }

  async createPullRequest(options: {
    title: string;
    body: string;
    branch: string;
    baseBranch?: string;
    projectPath: string;
  }): Promise<PrCreateResult> {
    const base = options.baseBranch ?? this.baseBranch;
    this.logger.log(`Creating PR: ${options.branch} → ${base}`);

    const escapedTitle = options.title.replace(/"/g, '\\"');
    const escapedBody = options.body.replace(/"/g, '\\"');

    const command = [
      this.ghCliPath,
      'pr', 'create',
      '--title', `"${escapedTitle}"`,
      '--body', `"${escapedBody}"`,
      '--base', base,
      '--head', options.branch,
    ].join(' ');

    try {
      const { stdout } = await execAsync(command, {
        cwd: options.projectPath,
        timeout: 30000,
      });

      const output = stdout.trim();
      // gh pr create outputs the PR URL
      const urlMatch = output.match(/https:\/\/github\.com\/[^\s]+\/pull\/(\d+)/);
      const prUrl = urlMatch?.[0] ?? output;
      const prNumber = urlMatch?.[1] ? parseInt(urlMatch[1], 10) : null;

      this.logger.log(`PR created: ${prUrl}`);

      return { success: true, prNumber, prUrl, output };
    } catch (error: any) {
      this.logger.error(`Failed to create PR: ${error.message}`);
      return {
        success: false,
        prNumber: null,
        prUrl: null,
        output: error.stderr ?? error.message,
      };
    }
  }

  async getPrStatus(prNumber: number, projectPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `${this.ghCliPath} pr view ${prNumber} --json state -q .state`,
        { cwd: projectPath, timeout: 15000 },
      );
      return stdout.trim();
    } catch {
      return 'unknown';
    }
  }

  async getPrChecks(prNumber: number, projectPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync(
        `${this.ghCliPath} pr checks ${prNumber}`,
        { cwd: projectPath, timeout: 15000 },
      );
      return stdout.trim();
    } catch (error: any) {
      return error.stdout?.trim() ?? 'no checks';
    }
  }
}
