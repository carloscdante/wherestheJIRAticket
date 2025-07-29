// src/jira-api.ts
import { 
  StoryAnalysis,
  AppConfig,
  AsyncResult,
  Result
} from './types';
import { success, failure } from './utils';

// === JIRA API Types ===
export interface JiraIssueRequest {
  readonly fields: {
    readonly project: {
      readonly key: string;
    };
    readonly summary: string;
    readonly description: any; // Atlassian Document Format
    readonly issuetype: {
      readonly name: string;
    };
    readonly assignee?: {
      readonly id: string;
    };
    readonly labels?: readonly string[];
  };
}

export interface JiraIssueResponse {
  readonly id: string;
  readonly key: string;
  readonly self: string;
}

export interface JiraUser {
  readonly accountId: string;
  readonly displayName: string;
  readonly emailAddress: string;
}

// === HTTP Client Interface ===
interface HttpClient {
  readonly post: <T>(url: string, data: any, headers: Record<string, string>) => Promise<T>;
  readonly get: <T>(url: string, headers: Record<string, string>) => Promise<T>;
  readonly put: <T>(url: string, data: any, headers: Record<string, string>) => Promise<T>;
}

// === Fetch-based HTTP Client ===
export const createHttpClient = (): HttpClient => ({
  post: async <T>(url: string, data: any, headers: Record<string, string>): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return response.json();
  },
  
  get: async <T>(url: string, headers: Record<string, string>): Promise<T> => {
    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return response.json();
  },

  put: async <T>(url: string, data: any, headers: Record<string, string>): Promise<T> => {
    const response = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    return response.json();
  }
});

// === Pure Transformation Functions ===
export const storyAnalysisToJiraRequest = (
  analysis: StoryAnalysis,
  config: AppConfig
): JiraIssueRequest => {
  const issueType = mapStoryTypeToJiraIssueType(analysis.storyType);
  
  return {
    fields: {
      project: {
        key: config.jira!.projectKey
      },
      summary: analysis.title,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: analysis.description
              }
            ]
          }
        ]
      },
      issuetype: {
        name: issueType
      },
      assignee: config.jira!.assigneeId ? {
        id: config.jira!.assigneeId
      } : undefined,
      labels: analysis.suggestedLabels
    }
  };
};

export const mapStoryTypeToJiraIssueType = (storyType: string): string => {
  const mapping: Record<string, string> = {
    'feature': 'Story',
    'bug': 'Bug',
    'chore': 'Task'
  };
  return mapping[storyType] || 'Task';
};

export const createAuthHeaders = (email: string, apiToken: string): Record<string, string> => ({
  'Authorization': `Basic ${Buffer.from(`${email}:${apiToken}`).toString('base64')}`
});

// === API Functions ===
export const validateJiraAuth = async (
  config: AppConfig,
  httpClient: HttpClient = createHttpClient()
): AsyncResult<boolean> => {
  try {
    const headers = createAuthHeaders(config.jira!.email, config.jira!.apiToken);
    await httpClient.get(`${config.jira!.baseUrl}/rest/api/3/myself`, headers);
    return success(true);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

export const createJiraIssue = async (
  analysis: StoryAnalysis,
  config: AppConfig,
  httpClient: HttpClient = createHttpClient()
): AsyncResult<JiraIssueResponse> => {
  try {
    const request = storyAnalysisToJiraRequest(analysis, config);
    const headers = createAuthHeaders(config.jira!.email, config.jira!.apiToken);
    
    const response = await httpClient.post<JiraIssueResponse>(
      `${config.jira!.baseUrl}/rest/api/3/issue`,
      request,
      headers
    );
    
    return success(response);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

export const addIssueToSprint = async (
  issueKey: string,
  sprintId: number,
  config: AppConfig,
  httpClient: HttpClient = createHttpClient()
): AsyncResult<void> => {
  try {
    const headers = createAuthHeaders(config.jira!.email, config.jira!.apiToken);
    
    await httpClient.post(
      `${config.jira!.baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`,
      { issues: [issueKey] },
      headers
    );
    
    return success(undefined);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

export const getJiraProjects = async (
  config: AppConfig,
  httpClient: HttpClient = createHttpClient()
): AsyncResult<Array<{ id: string; key: string; name: string }>> => {
  try {
    const headers = createAuthHeaders(config.jira!.email, config.jira!.apiToken);
    const projects = await httpClient.get<Array<{ id: string; key: string; name: string }>>(
      `${config.jira!.baseUrl}/rest/api/3/project`,
      headers
    );
    
    return success(projects);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};