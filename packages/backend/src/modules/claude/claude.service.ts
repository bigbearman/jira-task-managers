import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  ClaudeExecOptions,
  ClaudeExecResult,
  TicketAnalysisResult,
} from './claude.types';

const execAsync = promisify(exec);

@Injectable()
export class ClaudeService {
  private readonly logger = new Logger(ClaudeService.name);
  private readonly cliPath: string;
  private readonly defaultModel: string;
  private readonly maxTokens: number;
  private readonly timeout: number;
  private readonly allowedTools: string[];

  constructor(private readonly configService: ConfigService) {
    this.cliPath = this.configService.get('claude.cliPath', 'claude');
    this.defaultModel = this.configService.get('claude.defaultModel', 'sonnet');
    this.maxTokens = this.configService.get('claude.maxTokens', 8192);
    this.timeout = this.configService.get('claude.timeout', 300000);
    this.allowedTools = this.configService.get('claude.allowedTools', [
      'Edit', 'Write', 'Bash', 'Read', 'Glob', 'Grep',
    ]);
  }

  async execClaude(options: ClaudeExecOptions): Promise<ClaudeExecResult> {
    const model = options.model ?? this.defaultModel;
    const timeout = options.timeout ?? this.timeout;
    const tools = options.allowedTools ?? this.allowedTools;

    const args: string[] = [
      '-p', this.escapeShellArg(options.prompt),
      '--model', model,
      '--max-turns', '20',
      '--output-format', 'text',
    ];

    if (tools.length > 0) {
      args.push('--allowedTools', tools.join(','));
    }

    if (options.systemPrompt) {
      args.push('--system-prompt', this.escapeShellArg(options.systemPrompt));
    }

    const command = `${this.cliPath} ${args.join(' ')}`;
    const cwd = options.workingDir ?? process.cwd();

    this.logger.log(`Executing Claude CLI (model: ${model}, cwd: ${cwd})`);
    this.logger.debug(`Command: ${command.substring(0, 200)}...`);

    const startTime = Date.now();

    try {
      const { stdout, stderr } = await execAsync(command, {
        cwd,
        timeout,
        maxBuffer: 10 * 1024 * 1024, // 10MB
        env: { ...process.env },
      });

      const durationMs = Date.now() - startTime;

      if (stderr && !stderr.includes('warning')) {
        this.logger.warn(`Claude CLI stderr: ${stderr.substring(0, 500)}`);
      }

      this.logger.log(`Claude CLI completed in ${durationMs}ms`);

      return {
        success: true,
        output: stdout.trim(),
        exitCode: 0,
        durationMs,
        model,
      };
    } catch (error: any) {
      const durationMs = Date.now() - startTime;
      this.logger.error(`Claude CLI failed after ${durationMs}ms: ${error.message}`);

      return {
        success: false,
        output: error.stdout?.trim() ?? '',
        exitCode: error.code ?? 1,
        durationMs,
        model,
      };
    }
  }

  async analyzeTicket(ticket: {
    key: string;
    summary: string;
    description: string | null;
    issueType: string | null;
    priority: string | null;
    labels: string[] | null;
    components: string[] | null;
  }, customPrompt?: string): Promise<{ result: TicketAnalysisResult; raw: ClaudeExecResult }> {
    const prompt = this.buildAnalysisPrompt(ticket, customPrompt);

    const raw = await this.execClaude({
      prompt,
      allowedTools: [], // Analysis only, no file tools needed
    });

    const result = this.parseAnalysisResponse(raw.output);

    return { result, raw };
  }

  async applyCode(
    approach: string,
    projectPath: string,
    ticketContext: string,
  ): Promise<ClaudeExecResult> {
    const prompt = [
      'You are implementing a code change based on the following ticket and approach.',
      '',
      '## Ticket Context',
      ticketContext,
      '',
      '## Approach',
      approach,
      '',
      '## Instructions',
      '- Implement the changes described in the approach',
      '- Follow existing code patterns and conventions in the project',
      '- Write clean, maintainable code',
      '- Do NOT run tests or commit - just make the code changes',
      '- Keep changes minimal and focused on the task',
    ].join('\n');

    return this.execClaude({
      prompt,
      workingDir: projectPath,
      allowedTools: ['Edit', 'Write', 'Read', 'Glob', 'Grep', 'Bash'],
    });
  }

  async generateTests(
    changedFiles: string[],
    projectPath: string,
  ): Promise<ClaudeExecResult> {
    const prompt = [
      'Generate unit tests for the following changed files:',
      '',
      ...changedFiles.map((f) => `- ${f}`),
      '',
      '## Instructions',
      '- Read each changed file to understand what was modified',
      '- Write comprehensive unit tests covering the changes',
      '- Follow existing test patterns in the project',
      '- Place tests in the appropriate test directory',
      '- Do NOT run the tests - just write them',
    ].join('\n');

    return this.execClaude({
      prompt,
      workingDir: projectPath,
      allowedTools: ['Edit', 'Write', 'Read', 'Glob', 'Grep'],
    });
  }

  private buildAnalysisPrompt(
    ticket: {
      key: string;
      summary: string;
      description: string | null;
      issueType: string | null;
      priority: string | null;
      labels: string[] | null;
      components: string[] | null;
    },
    customPrompt?: string,
  ): string {
    const lines = [
      `Analyze the following Jira ticket and provide a structured analysis.`,
      '',
      `## Ticket: ${ticket.key}`,
      `**Summary:** ${ticket.summary}`,
      `**Type:** ${ticket.issueType ?? 'Unknown'}`,
      `**Priority:** ${ticket.priority ?? 'Unknown'}`,
    ];

    if (ticket.labels?.length) lines.push(`**Labels:** ${ticket.labels.join(', ')}`);
    if (ticket.components?.length) lines.push(`**Components:** ${ticket.components.join(', ')}`);

    if (ticket.description) {
      lines.push('', '**Description:**', ticket.description);
    }

    if (customPrompt) {
      lines.push('', '## Additional Context', customPrompt);
    }

    lines.push(
      '',
      '## Required Output Format',
      'Respond with ONLY a JSON object (no markdown code blocks) with these fields:',
      '- "summary": Brief summary of what needs to be done (1-2 sentences)',
      '- "solution": Detailed solution approach (paragraph)',
      '- "approach": Step-by-step implementation plan (numbered list as string)',
      '- "estimatedComplexity": "low", "medium", or "high"',
      '- "suggestedFiles": Array of file paths that likely need changes (can be empty)',
      '- "risks": Array of potential risks or concerns (can be empty)',
    );

    return lines.join('\n');
  }

  private parseAnalysisResponse(output: string): TicketAnalysisResult {
    try {
      // Try to extract JSON from the response
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          summary: parsed.summary ?? output.substring(0, 200),
          solution: parsed.solution ?? output,
          approach: parsed.approach ?? '',
          estimatedComplexity: parsed.estimatedComplexity ?? 'medium',
          suggestedFiles: parsed.suggestedFiles ?? [],
          risks: parsed.risks ?? [],
        };
      }
    } catch {
      // JSON parse failed, fall through to text parsing
    }

    // Fallback: treat the whole output as a text analysis
    return {
      summary: output.substring(0, 200),
      solution: output,
      approach: '',
      estimatedComplexity: 'medium',
      suggestedFiles: [],
      risks: [],
    };
  }

  private escapeShellArg(arg: string): string {
    return `"${arg.replace(/"/g, '\\"').replace(/\$/g, '\\$').replace(/`/g, '\\`')}"`;
  }
}
