// src/trackers/types.ts

import { StoryAnalysis } from '../types';

export type TrackerType = 'shortcut' | 'jira';

export interface IssueTrackerConfig {
  readonly type: TrackerType;
}

export interface ShortcutConfig extends IssueTrackerConfig {
  readonly type: 'shortcut';
  readonly token: string;
  readonly projectId?: number;
  readonly iterationId?: number;
  readonly ownerId?: string;
}

export interface JiraConfig extends IssueTrackerConfig {
  readonly type: 'jira';
  readonly baseUrl: string;
  readonly email: string;
  readonly apiToken: string;
  readonly projectKey: string;
  readonly sprintId?: number;
  readonly assigneeId?: string;
}

export type TrackerConfig = ShortcutConfig | JiraConfig;

export interface CreatedIssue {
  readonly id: string | number;
  readonly url: string;
  readonly title: string;
  readonly type: string;
}

export interface IssueTracker {
  validateAuth(): Promise<boolean>;
  createIssue(analysis: StoryAnalysis): Promise<CreatedIssue>;
}