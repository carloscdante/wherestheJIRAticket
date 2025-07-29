// src/pipeline.ts
import { 
  AppConfig, 
  AnalysisPipeline, 
  HookContext,
  AsyncResult 
} from './types';
import { 
  success, 
  failure, 
  mapAsyncResult 
} from './utils';
import { analyzeGitChanges, createStoryBranch } from './git';
import { analyzeWithAI } from './ai-analysis';
import { createIssue } from './issue-tracker';

// === Pipeline Steps ===
export const executeAnalysisPipeline = async (
  context: HookContext
): AsyncResult<AnalysisPipeline> => {
  console.log('🔍 Analyzing git changes...');
  const gitResult = await analyzeGitChanges(context.config);
  if (!gitResult.success) return gitResult;

  console.log('🤖 Analyzing with AI...');
  const aiResult = await analyzeWithAI(gitResult.data, context.config);
  if (!aiResult.success) return aiResult;

  const trackerName = context.config.tracker === 'jira' ? 'JIRA issue' : 'Shortcut story';
  console.log(`📝 Creating ${trackerName}...`);
  const issueResult = await createIssue(aiResult.data, context.config);
  if (!issueResult.success) return issueResult;

  console.log('🔄 Updating branch name...');
  const branchResult = await createStoryBranch(
    gitResult.data.currentBranch, 
    typeof issueResult.data.id === 'number' ? issueResult.data.id : parseInt(issueResult.data.id as string, 10)
  );
  if (!branchResult.success) return branchResult;

  const pipeline: AnalysisPipeline = {
    gitAnalysis: gitResult.data,
    storyAnalysis: aiResult.data,
    createdStory: {
      id: issueResult.data.id as any,
      app_url: issueResult.data.url,
      name: issueResult.data.key,
      story_type: issueResult.data.type as any
    },
    updatedBranch: branchResult.data
  };

  return success(pipeline);
};

// === Pipeline Result Handlers ===
export const handlePipelineSuccess = (pipeline: AnalysisPipeline): void => {
  console.log('✅ Issue created successfully!');
  console.log(`📋 Issue: ${pipeline.createdStory.app_url}`);
  console.log(`🌿 Branch renamed to: ${pipeline.updatedBranch}`);
  console.log(`🎯 Confidence: ${Math.round(pipeline.storyAnalysis.confidence * 100)}%`);
  console.log('\n⚠️  Push aborted to complete branch rename.');
  console.log('📌 Please run "git push" again to push the renamed branch.');
  
  // Exit with non-zero to abort the current push
  process.exit(1);
};

export const handlePipelineError = (error: Error): void => {
  console.error('❌ Pipeline failed:', error.message);
  
  if (error.message.includes('should be skipped')) {
    console.log('⏭️  Branch skipped - no action needed');
    return;
  }
  
  if (error.message.includes('No commits found')) {
    console.log('⏭️  No new commits - no action needed');
    return;
  }
  
  console.error('💥 Unexpected error occurred');
  process.exit(1);
};
