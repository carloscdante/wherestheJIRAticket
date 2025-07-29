// src/shortcut-api.ts
import { 
  ShortcutStoryRequest, 
  ShortcutStoryResponse, 
  StoryAnalysis,
  AppConfig,
  AsyncResult,
  StoryId 
} from './types';
import { success, failure } from './utils';

// === HTTP Client Interface ===
interface HttpClient {
  readonly post: <T>(url: string, data: any, headers: Record<string, string>) => Promise<T>;
  readonly get: <T>(url: string, headers: Record<string, string>) => Promise<T>;
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
  }
});

// === Pure Transformation Functions ===
export const storyAnalysisToRequest = (
  analysis: StoryAnalysis,
  config: AppConfig
): ShortcutStoryRequest => ({
  name: analysis.title,
  description: analysis.description,
  story_type: analysis.storyType,
  project_id: config.shortcut?.projectId,
  iteration_id: config.shortcut?.iterationId,
  owner_ids: config.shortcut?.ownerId ? [config.shortcut.ownerId] : undefined,
  estimate: analysis.estimatedPoints,
  labels: analysis.suggestedLabels.map(name => ({ name }))
});

export const createAuthHeaders = (token: string): Record<string, string> => ({
  'Shortcut-Token': token
});

// === API Functions ===
export const validateShortcutToken = async (
  config: AppConfig,
  httpClient: HttpClient = createHttpClient()
): AsyncResult<boolean> => {
  try {
    if (!config.shortcut) {
      return failure(new Error('Shortcut configuration is missing'));
    }
    const headers = createAuthHeaders(config.shortcut.token);
    await httpClient.get('https://api.app.shortcut.com/api/v3/member', headers);
    return success(true);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

export const createShortcutStory = async (
  analysis: StoryAnalysis,
  config: AppConfig,
  httpClient: HttpClient = createHttpClient()
): AsyncResult<ShortcutStoryResponse> => {
  try {
    if (!config.shortcut) {
      return failure(new Error('Shortcut configuration is missing'));
    }
    const request = storyAnalysisToRequest(analysis, config);
    const headers = createAuthHeaders(config.shortcut.token);
    
    const response = await httpClient.post<ShortcutStoryResponse>(
      'https://api.app.shortcut.com/api/v3/stories',
      request,
      headers
    );
    
    return success({
      ...response,
      id: response.id as StoryId
    });
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};

export const getShortcutProjects = async (
  config: AppConfig,
  httpClient: HttpClient = createHttpClient()
): AsyncResult<Array<{ id: number; name: string }>> => {
  try {
    if (!config.shortcut) {
      return failure(new Error('Shortcut configuration is missing'));
    }
    const headers = createAuthHeaders(config.shortcut.token);
    const projects = await httpClient.get<Array<{ id: number; name: string }>>(
      'https://api.app.shortcut.com/api/v3/projects',
      headers
    );
    
    return success(projects);
  } catch (error) {
    return failure(error instanceof Error ? error : new Error(String(error)));
  }
};
