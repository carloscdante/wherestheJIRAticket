# Where's the JIRA Ticket? 🎫

A utility for engineers who want to work fast and freeform, without getting asked "where's the story?" or "where's the ticket?" Because that's annoying as hell.

## Why? 🤔

This is a bit of a self-explanatory project. It came along out of pure frustration with wanting to push fixes and always having to describe my changes in some sort of convoluted planning way, when I know exactly what to make/what to code but never what exactly to say on the JIRA ticket or story. "Why not infer that from the diff so people can stop asking me where's the ticket?" I thought. Well, LLMs sure make that easy. I don't really care much about hallucinations because what I write on a story does not capture the full picture of the diff anyway, so... yeah. It makes my job faster, and I hope it can make yours faster too.

## What It Does ✨

This git hook automatically:
- 🔍 **Analyzes your commits and code changes** using AI
- 📝 **Creates Shortcut stories** with intelligent titles and descriptions
- 🏷️ **Adds relevant labels** (frontend, backend, testing, etc.)
- 📊 **Estimates story points** based on complexity
- 🌿 **Renames your branch** to include the story ID (`sc-123-your-branch`)
- 🚀 **Does it all automatically** when you push

No more "where's the ticket?" interruptions. Just code, push, and move on.

## Installation 📦

### Global Installation
```bash
npm install -g shortcut-git-hook

### Per-Project Setup
Navigate to your git repository and run the setup wizard:

```bash
cd your-awesome-project
npx shortcut-hook setup
```

The setup wizard will ask you for:
- **Shortcut API Token** - Get it from [Shortcut Settings > API Tokens](https://app.shortcut.com/settings/api/tokens)
- **OpenAI API Token** - Get it from [OpenAI API Keys](https://platform.openai.com/api-keys)
- **Base Branch** - Usually `main` or `master` (default: `main`)
- **Skip Branches** - Branches to ignore (default: `main,master,develop,staging`)

### What Gets Installed
- ✅ `.shortcut-hook.json` config file (automatically added to `.gitignore`)
- ✅ Git pre-push hook at `.git/hooks/pre-push`
- ✅ All dependencies and TypeScript compilation

## Usage 🚀

Once installed, just work normally:

```bash
# Create a feature branch
git checkout -b fix-login-validation

# Make your changes
echo "Fixed the login validation bug" > fix.txt
git add .
git commit -m "Fix email validation regex"
git commit -m "Add error handling for edge cases"

# Push your changes - the magic happens here! ✨
git push origin fix-login-validation
```

### What Happens Automatically

1. **🔍 Git Analysis**: Analyzes your commits since the base branch
2. **🤖 AI Processing**: Uses GPT-4 to understand what you built
3. **📝 Story Creation**: Creates a Shortcut story with:
   - Smart title: "Fix email validation in login form"
   - Detailed description with context
   - Appropriate story type (feature/bug/chore)
   - Estimated points (1-8 based on complexity)
   - Relevant labels (frontend, backend, testing, etc.)
4. **🌿 Branch Rename**: Renames to `sc-456-fix-login-validation`
5. **🎉 Success**: Prints the story URL and you're done!

### Example Output
```
🔍 Analyzing git changes...
🤖 Analyzing with AI...
📝 Creating Shortcut story...
🔄 Updating branch name...

✅ Story created successfully!
📋 Story: https://app.shortcut.com/your-team/story/456
🌿 Branch: sc-456-fix-login-validation  
🎯 Confidence: 87%
```

## Configuration ⚙️

### Config File (`.shortcut-hook.json`)
```json
{
  "shortcutToken": "your-shortcut-token",
  "openaiToken": "your-openai-token", 
  "openaiModel": "gpt-4",
  "projectId": 123,
  "baseBranch": "main",
  "skipBranches": ["main", "master", "develop", "staging"]
}
```

### Environment Variables (Alternative)
```bash
export SHORTCUT_TOKEN="your-token"
export OPENAI_TOKEN="your-token"
```

### Advanced Configuration
- **`projectId`**: Specific Shortcut project (optional, uses default if not set)
- **`openaiModel`**: AI model to use (`gpt-4` or `gpt-3.5-turbo`)
- **`baseBranch`**: Branch to compare changes against
- **`skipBranches`**: Branches that won't trigger story creation

## Smart Features 🧠

### Branch Detection
- **Skips branches** that already have story IDs (`sc-123-feature`)
- **Ignores main branches** (main, master, develop, staging)
- **Handles custom skip patterns** from your config

### AI Analysis
- **Understands context** from commit messages and code diffs
- **Detects story types**: 
  - `feature` for new functionality
  - `bug` for fixes and patches  
  - `chore` for refactoring and maintenance
- **Estimates complexity** based on files changed and diff size
- **Suggests labels** based on file types and patterns

### Error Handling
- **Graceful fallbacks** if AI fails (uses rule-based analysis)
- **Validation** of all inputs and API responses
- **Helpful error messages** with actionable suggestions
- **Confidence scoring** so you know how sure the AI is

## Troubleshooting 🔧

### Common Issues

**"Config file not found"**
```bash
# Run setup in your git repository
npx shortcut-hook setup
```

**"No commits found since base branch"**
```bash
# Make sure you have commits that aren't on main
git log origin/main..HEAD
```

**"Branch should be skipped"**
- Branch already has story ID (`sc-123-*`)
- Branch is in skip list (main, master, etc.)
- This is expected behavior!

**"AI analysis failed"**
- Check your OpenAI token and credits
- The tool will fall back to rule-based analysis
- Story will still be created, just with lower confidence

### Debug Mode
```bash
# Run manually to see detailed output
npx shortcut-git-hook
```

### Reset Configuration
```bash
# Delete config and re-run setup
rm .shortcut-hook.json
npx shortcut-hook setup
```

## API Tokens 🔑

### Shortcut API Token
1. Go to [Shortcut Settings > API Tokens](https://app.shortcut.com/settings/api/tokens)
2. Click "Generate New Token"
3. Give it a name like "Git Hook"
4. Copy the token (starts with `shortcut-`)

### OpenAI API Token  
1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys)
2. Click "Create new secret key"
3. Give it a name like "Shortcut Git Hook"
4. Copy the token (starts with `sk-`)

**💡 Pro tip**: Add these to your shell profile so you don't have to enter them for each project:
```bash
# Add to ~/.bashrc or ~/.zshrc
export SHORTCUT_TOKEN="your-shortcut-token"
export OPENAI_TOKEN="your-openai-token"
```

## Contributing 🤝

We love contributions! This tool is built with functional programming principles and strong TypeScript types.

### Development Setup
```bash
# Clone the repo
git clone https://github.com/your-username/shortcut-git-hook.git
cd shortcut-git-hook

# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

### Project Structure
```
src/
├── types.ts              # Core type definitions (the backbone!)
├── utils.ts              # Pure utility functions & Result helpers
├── pipeline.ts           # Main execution flow
├── git/                  # Git operations (pure functions)
├── ai/                   # AI analysis (pure functions)  
├── shortcut/             # Shortcut API (pure functions)
└── cli/                  # CLI setup and display
```

### Code Style
- **Functional programming**: Pure functions, no classes
- **Data-driven design**: Immutable data structures
- **Type-first**: Types are the backbone, everything else follows
- **Result types**: Explicit error handling with `Result<T, E>`
- **No side effects**: All external dependencies are injected

### Adding Features

**Want to add a new AI provider?**
1. Implement the `AIClient` interface in `src/ai/client.ts`
2. Add configuration options to `AppConfig` in `src/types.ts`
3. Update the setup wizard in `src/cli/setup.ts`

**Want to add a new project management tool?**
1. Create a new module like `src/linear/` or `src/jira/`
2. Implement similar interfaces to the Shortcut module
3. Add it to the pipeline in `src/pipeline.ts`

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode  
npm run test:watch

# Run specific test file
npm test -- git/analysis.test.ts
```

### Pull Request Guidelines
1. **Add tests** for new functionality
2. **Update types** if you change data structures  
3. **Keep functions pure** - no side effects
4. **Update documentation** if you change APIs
5. **Follow the functional style** - no classes!

### Issues and Feature Requests
- 🐛 **Bug reports**: Include your config (without tokens!) and error output
- 💡 **Feature requests**: Explain the use case and why it's useful
- 🤔 **Questions**: Check the troubleshooting section first

## License 📄

MIT License - see [LICENSE](LICENSE) file for details.

## Acknowledgments 🙏

- **OpenAI** for making AI analysis possible
- **Shortcut** for having a great API
- **Every developer** who's tired of being asked "where's the ticket?"

---

**Made with ❤️ and frustration by developers, for developers.**

*Stop explaining what you're building. Just build it.* 🚀
```
