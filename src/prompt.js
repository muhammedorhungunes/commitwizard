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

const TYPE_CHOICES = [
  { value: null,        name: chalk.cyan('  ✦  auto      ') + chalk.dim('AI decides based on the diff') },
  { value: 'feat',      name: chalk.green('  feat      ') + chalk.dim('  — new feature') },
  { value: 'fix',       name: chalk.red('  fix       ') + chalk.dim('  — bug fix') },
  { value: 'refactor',  name: chalk.yellow('  refactor  ') + chalk.dim('  — no behavior change') },
  { value: 'docs',      name: chalk.blue('  docs      ') + chalk.dim('  — documentation') },
  { value: 'chore',     name: chalk.dim('  chore       — build / deps / config') },
  { value: 'test',      name: chalk.dim('  test        — tests') },
  { value: 'perf',      name: chalk.dim('  perf        — performance') },
  { value: 'ci',        name: chalk.dim('  ci          — CI/CD') },
  { value: 'revert',    name: chalk.dim('  revert      — revert a commit') },
];

export async function selectCommitType() {
  return select({
    message: chalk.white('Commit type:'),
    choices: TYPE_CHOICES,
    loop:    false,
  });
}

export async function askTicketNumber(detected) {
  const answer = await input({
    message: chalk.white('Ticket / issue') + chalk.dim(' (optional — Enter to skip):'),
    default: detected || undefined,
  });
  return answer.trim() || null;
}

export async function confirmCommit(message) {
  return confirm({
    message: chalk.white('Commit with ') + chalk.cyan(`"${message}"`) + chalk.white('?'),
    default: true,
  });
}
