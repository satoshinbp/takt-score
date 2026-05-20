#!/usr/bin/env bash
# PostToolUse hook: format the file Claude just edited with prettier.
# Receives the tool-call payload on stdin; $CLAUDE_PROJECT_DIR is set by Claude Code.

set -u

file=$(jq -r '.tool_input.file_path // empty')

[ -z "$file" ] && exit 0
[ "$file" = "$CLAUDE_PROJECT_DIR/data/scores.json" ] && exit 0

cd "$CLAUDE_PROJECT_DIR" || exit 0
pnpm exec prettier --write --ignore-unknown --log-level=warn "$file" >/dev/null 2>&1
