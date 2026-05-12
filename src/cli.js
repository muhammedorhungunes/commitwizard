import { Command } from 'commander';
import chalk from 'chalk';
import { loadConfig, saveConfig, getConfigPath, DEFAULTS } from './config.js';
import {
  isGitRepo, hasStagedChanges, getStagedDiff, getDiffStats,
  getRecentCommits, commitWithMessage, copyToClipboard,
} from './git.js';
import { generateSuggestions } from './ai.js';
import { selectAction, editMessage, confirmCommit } from './prompt.js';
import {
  printHeader, printStats, printSuggestions, printSuccess,
  printDryRun, printCopied, printError, printWarning, createSpinner,
} from './ui.js';

const MODEL_ALIASES = {
  haiku:  'claude-haiku-4-5',
  sonnet: 'claude-sonnet-4-6',
  opus:   'claude-opus-4-7',
};

async function generate(diff, opts) {
  const spinner = createSpinner('Asking Claude…');
  spinner.start();
  try {
    const suggestions = await generateSuggestions(diff, opts);
    spinner.stop();
    return suggestions;
  } catch (err) {
    spinner.fail(chalk.red('Generation failed'));
    if (err.status === 401 || err.message?.includes('API key')) {
      printError('Missing or invalid API key. Set ANTHROPIC_API_KEY environment variable.');
    } else {
      printError(err.message || String(err));
    }
    process.exit(1);
  }
}

async function run(cliOpts) {
  printHeader();

  if (!isGitRepo()) {
    printError('Not a git repository.');
    process.exit(1);
  }

  if (!hasStagedChanges()) {
    printWarning('No staged changes found. Run git add <file> first.');
    process.exit(1);
  }

  printStats(getDiffStats());

  const config  = loadConfig();
  const merged  = { ...config, ...Object.fromEntries(Object.entries(cliOpts).filter(([, v]) => v !== undefined)) };

  const model    = MODEL_ALIASES[merged.model] || merged.model || DEFAULTS.model;
  const count    = Math.max(1, Math.min(10, parseInt(merged.count) || DEFAULTS.count));
  const emoji    = merged.emoji    ?? DEFAULTS.emoji;
  const lang     = merged.lang     ?? DEFAULTS.lang;
  const type     = merged.type     ?? null;
  const autoYes  = merged.yes      ?? false;
  const dryRun   = merged.dryRun   ?? false;
  const copy     = merged.copy     ?? false;
  const useHist  = merged.history  !== false;

  const diff    = getStagedDiff();
  const history = useHist ? getRecentCommits(5) : [];
  const genOpts = { model, count, emoji, lang, type, history };

  // Auto-commit mode: generate once, pick first, commit
  if (autoYes) {
    const suggestions = await generate(diff, genOpts);
    if (!suggestions.length) { printError('No suggestions returned.'); process.exit(1); }
    const message = suggestions[0];
    dryRun ? printDryRun(message) : commitWithMessage(message);
    if (!dryRun) printSuccess(message);
    if (copy && copyToClipboard(message)) printCopied();
    return;
  }

  // Interactive mode
  outer: while (true) {
    const suggestions = await generate(diff, genOpts);
    if (!suggestions.length) { printError('No suggestions returned.'); process.exit(1); }

    printSuggestions(suggestions);

    while (true) {
      const result = await selectAction(suggestions);

      if (result.action === 'cancel') {
        console.log(chalk.dim('\n  Cancelled.\n'));
        return;
      }

      if (result.action === 'regenerate') {
        console.log();
        break; // break inner → re-generate
      }

      const message = result.action === 'custom'
        ? await editMessage('')
        : result.message;

      if (dryRun) {
        printDryRun(message);
        if (copy && copyToClipboard(message)) printCopied();
        break outer;
      }

      const ok = await confirmCommit(message);
      if (!ok) continue; // back to selection

      commitWithMessage(message);
      printSuccess(message);
      if (copy && copyToClipboard(message)) printCopied();
      break outer;
    }
  }
}

// ─── CLI definition ────────────────────────────────────────────────────────

const program = new Command();

program
  .name('commitwizard')
  .description('AI-powered git commit messages — works with Claude Code or API key')
  .version('1.0.0')
  .option('-y, --yes',          'auto-commit with the top suggestion')
  .option('-e, --emoji',        'include gitmoji in commit messages')
  .option('-l, --lang <lang>',  'language for the description (e.g. tr, de, fr)')
  .option('-m, --model <name>', 'model: haiku (default), sonnet, opus')
  .option('-n, --count <n>',    'number of suggestions to generate (default: 3)')
  .option('-t, --type <type>',  'force a commit type (feat, fix, docs, refactor…)')
  .option('--dry-run',          'show suggestions without committing')
  .option('--copy',             'copy selected message to clipboard')
  .option('--no-history',       'skip recent commit history context')
  .action(opts => run(opts).catch(err => { printError(err.message || err); process.exit(1); }));

// ─── config subcommand ─────────────────────────────────────────────────────

program
  .command('config')
  .description('view or update saved configuration')
  .option('--set-model <name>', 'set default model (haiku / sonnet / opus)')
  .option('--set-lang <lang>',  'set default language')
  .option('--set-count <n>',    'set default number of suggestions')
  .option('--toggle-emoji',     'toggle emoji mode on/off')
  .action(opts => {
    const anySet = opts.setModel || opts.setLang || opts.setCount || opts.toggleEmoji;
    if (!anySet) {
      const cfg = loadConfig();
      console.log('\n' + chalk.cyan.bold('  Configuration') + chalk.dim(`  (${getConfigPath()})\n`));
      for (const [k, v] of Object.entries(cfg)) {
        console.log(`  ${chalk.dim(k.padEnd(10))}  ${chalk.white(String(v))}`);
      }
      console.log();
      return;
    }
    const updates = {};
    if (opts.setModel)    updates.model = MODEL_ALIASES[opts.setModel] || opts.setModel;
    if (opts.setLang)     updates.lang  = opts.setLang;
    if (opts.setCount)    updates.count = parseInt(opts.setCount);
    if (opts.toggleEmoji) updates.emoji = !loadConfig().emoji;
    saveConfig(updates);
    console.log(chalk.green('\n  ✓ Config updated\n'));
  });

program.parse();
