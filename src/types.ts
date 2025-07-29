// src/types.ts

// === Core Domain Types ===
export type StoryType = 'feature' | 'bug' | 'chore';
export type BranchName = string & { readonly __brand: 'BranchName' };
export type CommitHash = string & { readonly __brand: 'CommitHash' };
export type StoryId = number & { readonly __brand: 'StoryId' };

// === Configuration ===
export type TrackerType = 'shortcut' | 'jira';

export interface AppConfig {
  readonly tracker: TrackerType;
  readonly shortcut?: {
    readonly token: string;
    readonly projectId?: number;
    readonly iterationId?: number;
    readonly ownerId?: string;
  };
  readonly jira?: {
    readonly baseUrl: string;
    readonly email: string;
    readonly apiToken: string;
    readonly projectKey: string;
    readonly sprintId?: number;
    readonly assigneeId?: string;
  };
  readonly openai: {
    readonly token: string;
    readonly model: 'gpt-4.1' | 'gpt-4.1-mini';
  };
  readonly git: {
    readonly baseBranch: string;
    readonly skipBranches: readonly string[];
  };
}

// === Git Analysis Data ===
export interface GitCommit {
  readonly hash: CommitHash;
  readonly message: string;
  readonly author: string;
  readonly date: Date;
}

export interface FileChange {
  readonly path: string;
  readonly additions: number;
  readonly deletions: number;
  readonly status: 'added' | 'modified' | 'deleted' | 'renamed';
}

export interface GitAnalysis {
  readonly currentBranch: BranchName;
  readonly commits: readonly GitCommit[];
  readonly fileChanges: readonly FileChange[];
  readonly diffContent: string;
  readonly totalAdditions: number;
  readonly totalDeletions: number;
}

// === AI Analysis Results ===
export interface StoryAnalysis {
  readonly title: string;
  readonly description: string;
  readonly storyType: StoryType;
  readonly estimatedPoints: 1 | 2 | 3 | 5 | 8;
  readonly suggestedLabels: readonly string[];
  readonly confidence: number; // 0-1
}

// === Shortcut API Types ===
export interface ShortcutStoryRequest {
  readonly name: string;
  readonly description: string;
  readonly story_type: StoryType;
  readonly project_id?: number;
  readonly iteration_id?: number;
  readonly owner_ids?: readonly string[];
  readonly estimate?: number;
  readonly labels?: readonly { readonly name: string }[];
}

export interface ShortcutStoryResponse {
  readonly id: StoryId;
  readonly app_url: string;
  readonly name: string;
  readonly story_type: StoryType;
}

// === Result Types ===
export type Result<T, E = Error> = 
  | { readonly success: true; readonly data: T }
  | { readonly success: false; readonly error: E };

export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

// === Hook Execution Context ===
export interface HookContext {
  readonly config: AppConfig;
  readonly workingDirectory: string;
  readonly timestamp: Date;
}

// === Analysis Pipeline Data ===
export interface AnalysisPipeline {
  readonly gitAnalysis: GitAnalysis;
  readonly storyAnalysis: StoryAnalysis;
  readonly createdStory: ShortcutStoryResponse;
  readonly updatedBranch: BranchName;
}
