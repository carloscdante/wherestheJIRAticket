#!/usr/bin/env node
// src/index.ts
import { HookContext, AppConfig } from './types';
import { loadConfig } from './config';
import { executeAnalysisPipeline, handlePipelineSuccess, handlePipelineError } from './pipeline';

// === Main Hook Execution ===
export const runShortcutHook = async (): Promise<void> => {
  try {
    const configResult = await loadConfig();
    
    if (!configResult.success) {
      handlePipelineError(configResult.error);
      return;
    }
    
    const context: HookContext = {
      config: configResult.data,
      workingDirectory: process.cwd(),
      timestamp: new Date()
    };

    const result = await executeAnalysisPipeline(context);
    
    if (result.success) {
      handlePipelineSuccess(result.data);
    } else {
      handlePipelineError(result.error);
    }
  } catch (error) {
    handlePipelineError(error instanceof Error ? error : new Error(String(error)));
  }
};

// === CLI Entry Point ===
if (require.main === module) {
  runShortcutHook();
}
