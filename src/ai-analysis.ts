// src/ai-analysis.ts
import OpenAI from 'openai';
import { 
  GitAnalysis, 
  StoryAnalysis, 
  StoryType, 
  AppConfig,
  AsyncResult,
  Result
} from './types';
import { success, failure, truncate, validateNonEmpty } from './utils';

// === AI Analysis Interface ===
interface AIClient {
  readonly analyze: (prompt: string) => Promise<string>;
}

// === OpenAI Client Implementation ===
export const createOpenAIClient = (config: AppConfig): AIClient => {
  const openai = new OpenAI({ apiKey: config.openai.token });
  
  return {
    analyze: async (prompt: string) => {
      const response = await openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that analyzes git commits and code changes to create Shortcut stories. Always respond with valid JSON.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }
      
      return content;
    }
  };
};

// === Prompt Generation (Pure Functions) ===
export const buildAnalysisPrompt = (analysis: GitAnalysis): string => {
  const commitSummary = analysis.commits
    .map(c => `${c.hash}: ${c.message}`)
    .join('\n');
    
  const filesSummary = analysis.fileChanges
    .map(f => `${f.status}: ${f.path} (+${f.additions}/-${f.deletions})`)
    .join('\n');

  return `
Analyze these git changes and create a Shortcut story:

BRANCH: ${analysis.currentBranch}

COMMITS (${analysis.commits.length}):
${commitSummary}

FILES CHANGED (${analysis.fileChanges.length}):
${filesSummary}

TOTAL CHANGES: +${analysis.totalAdditions}/-${analysis.totalDeletions}

CODE DIFF (truncated):
${analysis.diffContent}

Based on this information, create a Shortcut story. Respond with JSON in this exact format:
{
  "title": "Brief, descriptive title (max 100 chars)",
  "description": "Detailed description of what was done/needs to be done",
  "storyType": "feature|bug|chore",
  "estimatedPoints": 1|2|3|5|8,
  "suggestedLabels": ["label1", "label2"],
  "confidence": 0.85
}

Guidelines:
- Title should be clear and actionable
- Description should explain the context and changes
- Choose story type based on the nature of changes:
  - "feature" for new functionality
  - "bug" for fixes
  - "chore" for maintenance/refactoring
- Estimate points based on complexity (1=trivial, 8=very complex)
- Add relevant labels like "frontend", "backend", "api", etc.
- Confidence should reflect how certain you are about the analysis (0-1)
`;
};

// === Response Parsing (Pure Functions) ===
export const parseAIResponse = (response: string): Result<StoryAnalysis, Error> => {
  try {
    const parsed = JSON.parse(response);
    
    // Validate required fields
    const titleResult = validateNonEmpty(parsed.title, 'title');
    if (!titleResult.success) return titleResult;
    
    const descriptionResult = validateNonEmpty(parsed.description, 'description');
    if (!descriptionResult.success) return descriptionResult;
    
    if (!['feature', 'bug', 'chore'].includes(parsed.storyType)) {
      return failure(new Error('Invalid story type'));
    }
    
    if (![1, 2, 3, 5, 8].includes(parsed.estimatedPoints)) {
      return failure(new Error('Invalid estimated points'));
    }

    const analysis: StoryAnalysis = {
      title: truncate(parsed.title, 100),
      description: parsed.description,
      storyType: parsed.storyType as StoryType,
      estimatedPoints: parsed.estimatedPoints,
      suggestedLabels: Array.isArray(parsed.suggestedLabels) ? parsed.suggestedLabels : [],
      confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5))
    };

    return success(analysis);
  } catch (error) {
    return failure(new Error(`Failed to parse AI response: ${error}`));
  }
};

// === Fallback Analysis (Pure Function) ===
export const createFallbackAnalysis = (gitAnalysis: GitAnalysis): StoryAnalysis => {
  const hasTest = gitAnalysis.fileChanges.some(f => 
    f.path.includes('test') || f.path.includes('spec')
  );
  const hasUI = gitAnalysis.fileChanges.some(f => 
    f.path.includes('.tsx') || f.path.includes('.vue') || f.path.includes('.jsx')
  );
  const hasAPI = gitAnalysis.fileChanges.some(f => 
    f.path.includes('api') || f.path.includes('controller')
  );
  
  const isBugFix = gitAnalysis.commits.some(c => 
    c.message.toLowerCase().includes('fix')
  );
  
  const complexity = gitAnalysis.fileChanges.length > 10 ? 5 :
                    gitAnalysis.fileChanges.length > 5 ? 3 : 1;

  return {
    title: `Work on ${gitAnalysis.currentBranch}`,
    description: `Changes made in branch ${gitAnalysis.currentBranch}\n\nFiles changed:\n${gitAnalysis.fileChanges.map(f => f.path).join('\n')}\n\nCommits:\n${gitAnalysis.commits.map(c => `${c.hash}: ${c.message}`).join('\n')}`,
    storyType: isBugFix ? 'bug' : 'feature',
    estimatedPoints: complexity as 1 | 2 | 3 | 5 | 8,
    suggestedLabels: [
      ...(hasUI ? ['frontend'] : []),
      ...(hasAPI ? ['backend'] : []),
      ...(hasTest ? ['testing'] : [])
    ],
    confidence: 0.3 // Low confidence for fallback
  };
};

// === Main AI Analysis Function ===
export const analyzeWithAI = async (
  gitAnalysis: GitAnalysis,
  config: AppConfig,
  aiClient: AIClient = createOpenAIClient(config)
): AsyncResult<StoryAnalysis> => {
  try {
    const prompt = buildAnalysisPrompt(gitAnalysis);
    const response = await aiClient.analyze(prompt);
    const parseResult = parseAIResponse(response);
    
    if (parseResult.success) {
      return success(parseResult.data);
    } else {
      // Fall back to rule-based analysis
      console.warn('AI analysis failed, using fallback:', parseResult.error.message);
      return success(createFallbackAnalysis(gitAnalysis));
    }
  } catch (error) {
    console.warn('AI analysis error, using fallback:', error);
    return success(createFallbackAnalysis(gitAnalysis));
  }
};
