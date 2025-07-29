// src/issue-tracker.ts
import { 
  AppConfig, 
  StoryAnalysis,
  AsyncResult,
  ShortcutStoryResponse
} from './types';
import { createShortcutStory } from './shortcut-api';
import { createJiraIssue, addIssueToSprint } from './jira-api';
import { success, failure } from './utils';

export interface CreatedIssue {
  readonly id: string | number;
  readonly url: string;
  readonly key: string;
  readonly type: string;
}

export const createIssue = async (
  analysis: StoryAnalysis,
  config: AppConfig
): AsyncResult<CreatedIssue> => {
  if (config.tracker === 'shortcut') {
    if (!config.shortcut) {
      return failure(new Error('Shortcut configuration is missing'));
    }
    
    const result = await createShortcutStory(analysis, config);
    if (!result.success) return result;
    
    return success({
      id: result.data.id,
      url: result.data.app_url,
      key: result.data.name,
      type: result.data.story_type
    });
  } else if (config.tracker === 'jira') {
    if (!config.jira) {
      return failure(new Error('JIRA configuration is missing'));
    }
    
    const result = await createJiraIssue(analysis, config);
    if (!result.success) return result;
    
    // Add to sprint if configured
    if (config.jira.sprintId) {
      const sprintResult = await addIssueToSprint(
        result.data.key,
        config.jira.sprintId,
        config
      );
      if (!sprintResult.success) {
        console.warn('⚠️  Failed to add issue to sprint:', sprintResult.error.message);
      }
    }
    
    return success({
      id: result.data.id,
      url: `${config.jira.baseUrl}/browse/${result.data.key}`,
      key: result.data.key,
      type: analysis.storyType
    });
  } else {
    return failure(new Error(`Unknown tracker type: ${config.tracker}`));
  }
};