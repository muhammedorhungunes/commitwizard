import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.config', 'ai-commit');
const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

export const DEFAULTS = {
  model: 'claude-haiku-4-5',
  count: 3,
  emoji: false,
  lang: 'en',
};

export function loadConfig() {
  const localPath = join(process.cwd(), '.ai-commitrc.json');
  let config = { ...DEFAULTS };

  if (existsSync(CONFIG_PATH)) {
    try {
      Object.assign(config, JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')));
    } catch { /* ignore malformed config */ }
  }

  if (existsSync(localPath)) {
    try {
      Object.assign(config, JSON.parse(readFileSync(localPath, 'utf-8')));
    } catch { /* ignore malformed config */ }
  }

  return config;
}

export function saveConfig(updates) {
  mkdirSync(CONFIG_DIR, { recursive: true });
  const current = loadConfig();
  const merged = { ...current, ...updates };

  const toSave = {};
  for (const [k, v] of Object.entries(merged)) {
    if (DEFAULTS[k] === undefined || v !== DEFAULTS[k]) toSave[k] = v;
  }

  writeFileSync(CONFIG_PATH, JSON.stringify(toSave, null, 2) + '\n');
  return toSave;
}

export function getConfigPath() {
  return CONFIG_PATH;
}
