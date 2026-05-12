# commitwizard ✦

> AI-powered git commit messages. Works with your **Claude Code account** — no API key needed.

Stage your changes, run `commitwizard`, and pick from smart suggestions following the [Conventional Commits](https://www.conventionalcommits.org/) specification.

```
  ✦ commitwizard  ·  AI-powered git commit messages

  3 files  ·  +87  ·  -12

  ╌╌╌ Suggestions ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
  
  1. feat(auth): add JWT refresh token rotation
  2. feat(auth): implement silent token renewal on expiry
  3. refactor(auth): extract token lifecycle into dedicated service

? Select a commit message: › …
```

## Features

- **Zero config** — works out of the box if you have [Claude Code](https://claude.ai/code) installed
- **Multiple suggestions** — pick the best one, or regenerate
- **Conventional Commits** — `feat`, `fix`, `docs`, `refactor`, `chore`, and more
- **Breaking change detection** — automatically uses `feat!:` notation
- **Gitmoji support** — `--emoji` flag adds relevant emojis
- **Multi-language** — write commit messages in any language
- **Style matching** — reads recent commits to match your project's style
- **Auto-commit mode** — `--yes` for scripting and hooks
- **Dry-run mode** — preview without committing
- **Clipboard copy** — `--copy` sends the message to your clipboard
- **Configurable model** — Haiku (fast/cheap), Sonnet, or Opus

## Install

```bash
npm install -g @gunesmuhammedorhun/commitwizard
```

## Requirements

**One of the following:**

| Option | Setup |
|---|---|
| ✅ [Claude Code](https://claude.ai/code) installed | Nothing — just works |
| 🔑 Anthropic API key | `export ANTHROPIC_API_KEY=sk-ant-...` |

## Usage

```bash
git add .
commitwizard
```

### Options

| Flag | Description |
|---|---|
| `-y, --yes` | Auto-commit with the top suggestion |
| `-e, --emoji` | Add gitmoji to the description |
| `-l, --lang <lang>` | Language: `tr`, `de`, `fr`, `es`… |
| `-m, --model <name>` | `haiku` (default), `sonnet`, `opus` |
| `-n, --count <n>` | Number of suggestions (default: 3) |
| `-t, --type <type>` | Force a type: `feat`, `fix`, `docs`… |
| `--dry-run` | Generate without committing |
| `--copy` | Copy selected message to clipboard |
| `--no-history` | Skip recent commit history context |

### Examples

```bash
# Interactive (default)
commitwizard

# Auto-commit the best suggestion
commitwizard --yes

# Use Sonnet for harder diffs
commitwizard --model sonnet

# Commit message in Turkish with emojis
commitwizard --lang tr --emoji

# Force fix type
commitwizard --type fix

# Preview only
commitwizard --dry-run
```

### Configuration

```bash
commitwizard config              # show current config
commitwizard config --set-model sonnet
commitwizard config --set-lang tr
commitwizard config --set-count 5
commitwizard config --toggle-emoji
```

Config is saved at `~/.config/ai-commit/config.json`. Add `.ai-commitrc.json` to any project root for project-specific defaults.

### Git hook

Auto-launch on every commit by adding to `.git/hooks/prepare-commit-msg`:

```bash
#!/bin/sh
exec < /dev/tty
commitwizard
```

## Models

| Name | Model | Speed | Cost |
|---|---|---|---|
| `haiku` *(default)* | claude-haiku-4-5 | ⚡ Fast | $ Low |
| `sonnet` | claude-sonnet-4-6 | ◈ Balanced | $$ Medium |
| `opus` | claude-opus-4-7 | ◉ Best quality | $$$ Higher |

> When using Claude Code (no API key), the model flag is ignored — Claude Code handles routing automatically.
