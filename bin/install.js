#!/usr/bin/env node
// bin/install.js
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

async function setup() {
  console.log(chalk.blue("🚀 Setting up Where's the JIRA - Git Hook for Issue Tracking\n"));

  // Check if we're in a git repo
  if (!fs.existsSync('.git')) {
    console.error(chalk.red('❌ Not in a git repository'));
    process.exit(1);
  }

  // First, ask for tracker type
  const { tracker } = await inquirer.prompt([
    {
      type: 'list',
      name: 'tracker',
      message: 'Which issue tracker are you using?',
      choices: [
        { name: 'Shortcut', value: 'shortcut' },
        { name: 'JIRA', value: 'jira' }
      ]
    }
  ]);

  // Get tracker-specific configuration
  let trackerConfig = {};
  if (tracker === 'shortcut') {
    trackerConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'shortcutToken',
        message: 'Shortcut API Token:',
        validate: input => input.length > 0 || 'Token is required'
      },
      {
        type: 'input',
        name: 'projectId',
        message: 'Shortcut Project ID:',
        validate: input => {
          const num = parseInt(input, 10);
          return (!isNaN(num) && num > 0) || 'Project ID must be a positive number';
        },
        filter: input => parseInt(input, 10)
      },
      {
        type: 'input',
        name: 'iterationId',
        message: 'Shortcut Iteration ID (optional):',
        validate: input => {
          if (!input) return true; // Optional field
          const num = parseInt(input, 10);
          return (!isNaN(num) && num > 0) || 'Iteration ID must be a positive number';
        },
        filter: input => input ? parseInt(input, 10) : undefined
      },
      {
        type: 'input',
        name: 'ownerId',
        message: 'Shortcut Owner ID (optional, UUID):',
        validate: input => {
          if (!input) return true; // Optional field
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          return uuidRegex.test(input) || 'Owner ID must be a valid UUID';
        }
      }
    ]);
  } else {
    trackerConfig = await inquirer.prompt([
      {
        type: 'input',
        name: 'jiraBaseUrl',
        message: 'JIRA Base URL (e.g., https://yourcompany.atlassian.net):',
        validate: input => {
          try {
            new URL(input);
            return true;
          } catch {
            return 'Please enter a valid URL';
          }
        }
      },
      {
        type: 'input',
        name: 'jiraEmail',
        message: 'JIRA Email:',
        validate: input => input.includes('@') || 'Please enter a valid email'
      },
      {
        type: 'input',
        name: 'jiraApiToken',
        message: 'JIRA API Token:',
        validate: input => input.length > 0 || 'Token is required'
      },
      {
        type: 'input',
        name: 'jiraProjectKey',
        message: 'JIRA Project Key (e.g., PROJ):',
        validate: input => /^[A-Z]+$/.test(input) || 'Project key must be uppercase letters'
      },
      {
        type: 'input',
        name: 'jiraSprintId',
        message: 'JIRA Sprint ID (optional):',
        validate: input => {
          if (!input) return true; // Optional field
          const num = parseInt(input, 10);
          return (!isNaN(num) && num > 0) || 'Sprint ID must be a positive number';
        },
        filter: input => input ? parseInt(input, 10) : undefined
      },
      {
        type: 'input',
        name: 'jiraAssigneeId',
        message: 'JIRA Assignee Account ID (optional):',
        validate: input => {
          if (!input) return true; // Optional field
          return input.length > 0;
        }
      }
    ]);
  }

  // Get common configuration
  const commonAnswers = await inquirer.prompt([
    {
      type: 'input',
      name: 'openaiToken',
      message: 'OpenAI API Token:',
      validate: input => input.length > 0 || 'Token is required'
    },
    {
      type: 'input',
      name: 'baseBranch',
      message: 'Base branch for comparison:',
      default: 'main'
    },
    {
      type: 'input',
      name: 'skipBranches',
      message: 'Branches to skip (comma-separated):',
      default: 'main,master,develop,staging',
      filter: input => input.split(',').map(s => s.trim())
    }
  ]);

  // Save config
  const config = {
    tracker,
    ...trackerConfig,
    ...commonAnswers
  };

  fs.writeFileSync('.wtj-config.json', JSON.stringify(config, null, 2));
  
  // Add to .gitignore
  const gitignorePath = '.gitignore';
  let gitignore = '';
  if (fs.existsSync(gitignorePath)) {
    gitignore = fs.readFileSync(gitignorePath, 'utf8');
  }
  
  if (!gitignore.includes('.wtj-config.json')) {
    fs.appendFileSync(gitignorePath, '\n.wtj-config.json\n');
  }

  // Create git hook
  const hookPath = '.git/hooks/pre-push';
  const hookContent = `#!/bin/bash
# Where's the JIRA - Git Hook
wtj-run
`;

  fs.writeFileSync(hookPath, hookContent);
  fs.chmodSync(hookPath, '755');

  console.log(chalk.green('\n✅ Setup complete!'));
  console.log(chalk.yellow('📝 Config saved to .wtj-config.json (added to .gitignore)'));
  console.log(chalk.yellow('🪝 Git hook installed at .git/hooks/pre-push'));
  console.log(chalk.blue('\n🚀 Now when you push, issues will be auto-created!'));
}

if (require.main === module) {
  setup().catch(console.error);
}