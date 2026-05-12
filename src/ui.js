import chalk from 'chalk';
import ora from 'ora';

const TYPE_COLORS = {
  feat:     chalk.green,
  fix:      chalk.red,
  docs:     chalk.blue,
  style:    chalk.magenta,
  refactor: chalk.yellow,
  perf:     chalk.cyan,
  test:     chalk.hex('#ff9900'),
  chore:    chalk.gray,
  ci:       chalk.cyan,
  revert:   chalk.red,
  build:    chalk.white,
};

export function printHeader() {
  console.log(
    '\n' +
    chalk.cyan('  ✦ ') + chalk.cyan.bold('ai-commit') +
    chalk.dim('  ·  AI-powered git commit messages') +
    '\n',
  );
}

export function colorizeCommit(msg) {
  return msg.replace(
    /^(\w+)(!)?\(([^)]+)\)(!)?:/,
    (_, type, b1, scope, b2) => {
      const fn = TYPE_COLORS[type] || chalk.white;
      return fn.bold(type) + (b1 || b2 ? chalk.red('!') : '') + chalk.dim(`(${scope})`) + chalk.dim(':');
    },
  ).replace(
    /^(\w+)(!)?: /,
    (_, type, bang) => {
      const fn = TYPE_COLORS[type] || chalk.white;
      return fn.bold(type) + (bang ? chalk.red('!') : '') + chalk.dim(': ');
    },
  );
}

export function printSuggestions(suggestions) {
  console.log(chalk.dim('  ╌╌╌ Suggestions ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌\n'));
  for (const [i, s] of suggestions.entries()) {
    console.log('  ' + chalk.dim.bold(`${i + 1}.`) + ' ' + colorizeCommit(s));
  }
  console.log();
}

export function printStats(stats) {
  const parts = [];
  if (stats.files)      parts.push(chalk.white.bold(stats.files) + chalk.dim(` file${stats.files !== 1 ? 's' : ''}`));
  if (stats.insertions) parts.push(chalk.green(`+${stats.insertions}`));
  if (stats.deletions)  parts.push(chalk.red(`-${stats.deletions}`));
  if (parts.length) console.log(chalk.dim('  ') + parts.join(chalk.dim('  ·  ')) + '\n');
}

export function printSuccess(message) {
  console.log('\n' + chalk.green('  ✓ ') + chalk.white.bold('Committed') + chalk.dim(': ') + chalk.cyan(message) + '\n');
}

export function printDryRun(message) {
  console.log('\n' + chalk.yellow('  ~ ') + chalk.dim('[dry-run] Would commit: ') + chalk.cyan(message) + '\n');
}

export function printCopied() {
  console.log(chalk.dim('  ✓ Copied to clipboard\n'));
}

export function printError(msg) {
  console.error('\n' + chalk.red('  ✗ ') + chalk.white(msg) + '\n');
}

export function printWarning(msg) {
  console.warn('\n' + chalk.yellow('  ⚠  ') + chalk.white(msg) + '\n');
}

export function createSpinner(text) {
  return ora({ text: chalk.dim(text), color: 'cyan', spinner: 'dots' });
}
