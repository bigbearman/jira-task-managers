export interface ClaudeExecOptions {
  prompt: string;
  model?: string;
  maxTokens?: number;
  timeout?: number;
  allowedTools?: string[];
  workingDir?: string;
  systemPrompt?: string;
}

export interface ClaudeExecResult {
  success: boolean;
  output: string;
  exitCode: number;
  durationMs: number;
  model: string;
}

export interface TicketAnalysisResult {
  summary: string;
  solution: string;
  approach: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  suggestedFiles?: string[];
  risks?: string[];
}

export interface CodeApplyResult {
  filesChanged: string[];
  output: string;
  success: boolean;
}

export interface TestGenerationResult {
  testsGenerated: string[];
  output: string;
  success: boolean;
}
