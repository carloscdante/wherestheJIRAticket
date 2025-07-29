// src/config.ts
import * as fs from 'fs';
import * as path from 'path';
import { AppConfig, AsyncResult, Result, TrackerType } from './types';
import { success, failure, validateNonEmpty } from './utils';

// === Configuration Loading ===
export const loadConfig = async (): AsyncResult<AppConfig> => {
  const configPath = path.join(process.cwd(), '.wtj-config.json');
  
  if (!fs.existsSync(configPath)) {
    return failure(new Error(`Config file not found: ${configPath}\nRun 'wtj' first to set up`));
  }

  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const validationResult = validateConfig(configData);
    
    return validationResult.success 
      ? success(validationResult.data)
      : validationResult;
  } catch (error) {
    return failure(new Error(`Invalid config file: ${error}`));
  }
};

// === Configuration Validation ===
export const validateConfig = (data: any): Result<AppConfig, Error> => {
  const trackerResult = validateNonEmpty(data.tracker, 'tracker');
  if (!trackerResult.success) return trackerResult;
  
  const openaiResult = validateNonEmpty(data.openaiToken, 'openaiToken');
  if (!openaiResult.success) return openaiResult;
  
  const baseBranchResult = validateNonEmpty(data.baseBranch || 'main', 'baseBranch');
  if (!baseBranchResult.success) return baseBranchResult;

  const config: AppConfig = {
    tracker: trackerResult.data as TrackerType,
    openai: {
      token: openaiResult.data,
      model: data.openaiModel || 'gpt-4.1'
    },
    git: {
      baseBranch: baseBranchResult.data,
      skipBranches: Array.isArray(data.skipBranches) ? data.skipBranches : ['main', 'master', 'develop', 'staging']
    }
  } as AppConfig;

  // Add tracker-specific configuration
  if (data.tracker === 'shortcut') {
    const tokenResult = validateNonEmpty(data.shortcutToken, 'shortcutToken');
    if (!tokenResult.success) return tokenResult;
    
    (config as any).shortcut = {
      token: tokenResult.data,
      projectId: data.projectId,
      iterationId: data.iterationId,
      ownerId: data.ownerId
    };
  } else if (data.tracker === 'jira') {
    const baseUrlResult = validateNonEmpty(data.jiraBaseUrl, 'jiraBaseUrl');
    if (!baseUrlResult.success) return baseUrlResult;
    
    const emailResult = validateNonEmpty(data.jiraEmail, 'jiraEmail');
    if (!emailResult.success) return emailResult;
    
    const apiTokenResult = validateNonEmpty(data.jiraApiToken, 'jiraApiToken');
    if (!apiTokenResult.success) return apiTokenResult;
    
    const projectKeyResult = validateNonEmpty(data.jiraProjectKey, 'jiraProjectKey');
    if (!projectKeyResult.success) return projectKeyResult;
    
    (config as any).jira = {
      baseUrl: baseUrlResult.data,
      email: emailResult.data,
      apiToken: apiTokenResult.data,
      projectKey: projectKeyResult.data,
      sprintId: data.jiraSprintId,
      assigneeId: data.jiraAssigneeId
    };
  }

  return success(config);
};

