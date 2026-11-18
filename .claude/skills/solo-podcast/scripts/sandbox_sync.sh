#!/bin/bash
# usage, in the repo checkout (NOT in the sandbox):  bash .claude/skills/solo-podcast/scripts/sandbox_sync.sh [git ref]
# Prints ONE shell command. Run that command in the Higgsfield sandbox (sandbox_exec, timeout 120). It downloads this skill's
# scripts and the lo8f-tiktok-clips scripts from the public GitHub repo at one exact commit, checks every file against the
# sha256 of the copy in this checkout, and runs bootstrap.sh (fonts, face model, tool check).
#   clips scripts -> /home/user/skill/scripts      solo scripts -> /home/user/skill/solo
# The sandbox is wiped after about a day idle, so run this at the start of every job.
# The commit has to be on GitHub: push first (the default ref is HEAD). If the repo is ever made private the downloads
# answer 404 and the command says so; then write the files into those two folders with heredocs and compare sha256sum by hand.
set -e
cd "$(git rev-parse --show-toplevel)"
REF=${1:-$(git rev-parse HEAD)}
SLUG=$(git remote get-url origin | sed -E 's#\.git$##' | awk -F/ '{print $(NF-1) "/" $NF}')
git branch -r --contains "$REF" 2>/dev/null | grep -q . || echo "WARNING: $REF is not on GitHub yet. Push first, or the downloads will fail." >&2
C=.claude/skills/lo8f-tiktok-clips/scripts; S=.claude/skills/solo-podcast/scripts
CF=$(cd $C && ls | tr '\n' ' '); SF=$(cd $S && ls | grep -v '^sandbox_sync.sh$' | tr '\n' ' ')
echo "mkdir -p /home/user/skill/scripts /home/user/skill/solo && cd /home/user/skill && B=https://raw.githubusercontent.com/$SLUG/$REF/.claude/skills && for f in ${CF}; do curl -fsSL -o scripts/\$f \$B/lo8f-tiktok-clips/scripts/\$f || echo \"DOWNLOAD FAILED \$f (is the commit pushed, is the repo still public?)\"; done && for f in ${SF}; do curl -fsSL -o solo/\$f \$B/solo-podcast/scripts/\$f || echo \"DOWNLOAD FAILED \$f\"; done && sha256sum -c <<'SUMS' && bash scripts/bootstrap.sh"
(cd $C && sha256sum $CF | sed 's#  #  scripts/#'); (cd $S && sha256sum $SF | sed 's#  #  solo/#')
echo "SUMS"
