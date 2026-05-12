import { select, input, confirm } from '@inquirer/prompts';
import chalk from 'chalk';
import { colorizeCommit } from './ui.js';

export async function selectAction(suggestions) {
  const choices = [
    ...suggestions.map((s, i) => ({
      name:  `  ${chalk.dim.bold(`${i + 1}.`)} ${colorizeCommit(s)}`,
      value: { action: 'commit', message: s },
      short: s,
    })),
    { name: chalk.dim('  ↻  Regenerate suggestions'), value: { action: 'regenerate' }, short: 'Regenerate' },
    { name: chalk.dim('  ✎  Enter custom message'),   value: { action: 'custom' },     short: 'Custom'     },
    { name: chalk.dim('  ✕  Cancel'),                 value: { action: 'cancel' },     short: 'Cancel'     },
  ];

  return select({
    message:  chalk.white('Select a commit message:'),
    choices,
    pageSize: choices.length,
    loop:     false,
  });
}

export async function editMessage(initial = '') {
  return input({
    message:  chalk.white('Commit message:'),
    default:  initial || undefined,
    validate: v => v.trim().length > 0 || 'Message cannot be empty',
  });
}

export async function confirmCommit(message) {
  return confirm({
    message: chalk.white('Commit with ') + chalk.cyan(`"${message}"`) + chalk.white('?'),
    default: true,
  });
}
