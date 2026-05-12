import { spawnSync } from 'child_process';

const MAX_BUF = 10 * 1024 * 1024; // 10 MB — handles large diffs

function git(...args) {
  return spawnSync('git', args, { encoding: 'utf-8', maxBuffer: MAX_BUF });
}

export function isGitRepo() {
  return git('rev-parse', '--is-inside-work-tree').status === 0;
}

export function hasStagedChanges() {
  // exit 1 = has changes, exit 0 = no changes
  return git('diff', '--staged', '--quiet').status === 1;
}

export function getStagedDiff() {
  const r = git('diff', '--staged');
  if (r.error) throw r.error;
  return r.stdout;
}

export function getDiffStats() {
  const r = git('diff', '--staged', '--stat');
  if (r.error) throw r.error;
  const out = r.stdout;
  const stats = { files: 0, insertions: 0, deletions: 0 };
  const m = out.match(/(\d+) files? changed(?:, (\d+) insertions?\(\+\))?(?:, (\d+) deletions?\(-\))?/);
  if (m) {
    stats.files = parseInt(m[1] || 0);
    stats.insertions = parseInt(m[2] || 0);
    stats.deletions = parseInt(m[3] || 0);
  }
  return stats;
}

export function getRecentCommits(n = 5) {
  const r = git('log', `--max-count=${n}`, '--pretty=format:%s');
  if (r.status !== 0) return [];
  return r.stdout.split('\n').filter(Boolean);
}

export function commitWithMessage(message) {
  const r = spawnSync('git', ['commit', '-m', message], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('git commit failed');
}

export function copyToClipboard(text) {
  const platform = process.platform;
  let cmd, args;

  if (platform === 'darwin') {
    cmd = 'pbcopy'; args = [];
  } else if (platform === 'win32') {
    cmd = 'clip'; args = [];
  } else {
    const r = spawnSync('xclip', ['-selection', 'clipboard'], { input: text, encoding: 'utf-8' });
    if (r.status === 0) return true;
    return spawnSync('xsel', ['--clipboard', '--input'], { input: text, encoding: 'utf-8' }).status === 0;
  }

  return spawnSync(cmd, args, { input: text, encoding: 'utf-8' }).status === 0;
}
