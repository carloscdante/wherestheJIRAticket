// src/git.ts
import simpleGit, { SimpleGit, LogResult } from 'simple-git';
import { 
  GitAnalysis, 
  GitCommit, 
  FileChange, 
  BranchName, 
  CommitHash,
  AsyncResult,
  AppConfig 
} from './types';
import { success, failure, validateNonEmpty, sanitizeBranchName } from './utils';

// === Git Repository Interface ===
interface GitRepository {
  readonly getCurrentBranch: () => Promise<string>;
  readonly getCommitsSince: (baseBranch: string) => Promise<LogResult>;
  readonly getDiffSince: (baseBranch: string) => Promise<string>;
  readonly getDiffSummary: (baseBranch: string) => Promise<any>;
  readonly createBranch: (newBranch: string, fromBranch: string) => Promise<void>;
  readonly deleteBranch: (branch: string) => Promise<void>;
  readonly pushBranch: (branch: string, setUpstream: boolean) => Promise<void>;
  readonly deleteRemoteBranch: (branch: string) => Promise<void>;
}

// === Git Repository Implementation ===
export const createGitRepository = (): GitRepository => {
  const git: SimpleGit = simpleGit();
  
  return {
    getCurrentBranch: () => git.revparse(['--abbrev-ref', 'HEAD']),
    getCommitsSince: (baseBranch: string) => 
      git.log({ from: `origin/${baseBranch}`, to: 'HEAD' }),
    getDiffSince: (baseBranch: string) => 
      git.diff([`origin/${baseBranch}..HEAD`]),
    getDiffSummary: (baseBranch: string) => 
      git.diffSummary([`origin/${baseBranch}..HEAD`]),
    createBranch: (newBranch: string, fromBranch: string) => 
      git.checkoutBranch(newBranch, fromBranch),
    deleteBranch: async (branch: string) => {
      await git.deleteLocalBranch(branch);
    },
    pushBranch: async (branch: string, setUpstream: boolean) => {
      await (setUpstream 
        ? git.push(['--set-upstream', 'origin', branch])
        : git.push(['origin', branch]));
    },
    deleteRemoteBranch: async (branch: string) => {
      await git.push(['origin', '--delete', branch]);
    }
  };
};

// === Pure Analysis Functions ===
export const shouldSkipBranch = (
  branch: BranchName,
  skipBranches: readonly string[]
): boolean => {
  // Skip if already has story ID (sc-123 format for Shortcut)
  if (/^sc-\d+/.test(branch)) return true;
  
  // Skip if already has JIRA issue key (PROJ-123 format)
  if (/^[A-Z]+-\d+/.test(branch)) return true;
  
  // Skip if in skip list
  if (skipBranches.includes(branch)) return true;
  
  return false;
};

export const parseCommits = (logResult: LogResult): readonly GitCommit[] =>
  logResult.all.map(commit => ({
    hash: commit.hash.substring(0, 7) as CommitHash,
    message: commit.message,
    author: commit.author_name,
    date: new Date(commit.date)
  }));

export const parseFileChanges = (diffSummary: any): readonly FileChange[] =>
  diffSummary.files.map((file: any) => ({
    path: file.file,
    additions: file.insertions || 0,
    deletions: file.deletions || 0,
    status: file.binary ? 'modified' : 'modified' // Simplified for now
  }));

export const calculateTotals = (fileChanges: readonly FileChange[]) => ({
  totalAdditions: fileChanges.reduce((sum, file) => sum + file.additions, 0),
  totalDeletions: fileChanges.reduce((sum, file) => sum + file.deletions, 0)
});

// === Main Git Analysis Function ===
export const analyzeGitChanges = async (
  config: AppConfig,
  repository: GitRepository = createGitRepository()
): AsyncResult<GitAnalysis> => {
  try {
    const currentBranch = await repository.getCurrentBranch() as BranchName;
    
    // Check if we should skip this branch
    if (shouldSkipBranch(currentBranch, config.git.skipBranches)) {
      return failure(new Error(`Branch ${currentBranch} should be skipped`));
    }

    const [logResult, diffResult, diffSummary] = await Promise.all([
      repository.getCommitsSince(config.git.baseBranch),
      repository.getDiffSince(config.git.baseBranch),
      repository.getDiffSummary(config.git.baseBranch)
    ]);

    const commits = parseCommits(logResult);
    const fileChanges = parseFileChanges(diffSummary);
    const { totalAdditions, totalDeletions } = calculateTotals(fileChanges);

    if (commits.length === 0) {
      return failure(new Error('No commits found since base branch'));
    }

    const analysis: GitAnalysis = {
      currentBranch,
      commits,
      fileChanges,
      diffContent: (diffResult as string).substring(0, 8000), // Limit for AI
      totalAdditions,
      totalDeletions
    };

    return success(analysis);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

// === Branch Management ===
export const createStoryBranch = async (
  currentBranch: BranchName,
  storyId: number | string,
  repository: GitRepository = createGitRepository()
): AsyncResult<BranchName> => {
  try {
    const prefix = typeof storyId === 'string' ? storyId : `sc-${storyId}`;
    const newBranchName = `${prefix}-${sanitizeBranchName(currentBranch)}` as BranchName;
    
    // Create and checkout new branch
    await repository.createBranch(newBranchName, currentBranch);
    
    // Push the new branch to remote with upstream tracking
    await repository.pushBranch(newBranchName, true);
    
    // Delete the old local branch (we're now on the new branch)
    try {
      await repository.deleteBranch(currentBranch);
    } catch (e) {
      // If delete fails, it's ok - might be protected or have uncommitted changes
      console.warn(`Could not delete old branch ${currentBranch}: ${e}`);
    }
    
    // Try to delete the old remote branch if it exists
    try {
      await repository.deleteRemoteBranch(currentBranch);
    } catch (e) {
      // If remote delete fails, it's ok - might not exist or be protected
      console.warn(`Could not delete remote branch ${currentBranch}: ${e}`);
    }
    
    return success(newBranchName);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};
