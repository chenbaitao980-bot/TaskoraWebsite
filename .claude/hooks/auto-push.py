#!/usr/bin/env python3
"""
Auto-commit and push to origin after Claude finishes a turn.
Only runs if there are actual file changes to commit.
"""
import subprocess
import sys
from datetime import datetime


def run(cmd, check=True):
    return subprocess.run(cmd, capture_output=True, text=True, check=check)


def main():
    # Check if there are any changes (staged or unstaged)
    staged = run(["git", "diff", "--staged", "--quiet"], check=False)
    unstaged = run(["git", "diff", "--quiet"], check=False)
    untracked = run(["git", "ls-files", "--others", "--exclude-standard"], check=False)

    has_staged = staged.returncode != 0
    has_unstaged = unstaged.returncode != 0
    has_untracked = bool(untracked.stdout.strip())

    if not (has_staged or has_unstaged or has_untracked):
        # Nothing to commit
        sys.exit(0)

    # Stage all changes
    run(["git", "add", "-A"])

    # Commit with timestamp
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    run(["git", "commit", "-m", f"auto: update {ts}"])

    # Push to origin
    result = run(["git", "push"], check=False)
    if result.returncode != 0:
        # Print to stderr so Claude can see it, but don't block
        print(f"[auto-push] push failed: {result.stderr.strip()}", file=sys.stderr)
        sys.exit(0)

    print(f"[auto-push] committed and pushed at {ts}")


if __name__ == "__main__":
    main()
