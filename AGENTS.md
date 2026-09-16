# Shortcuts Widget

This workspace contains the widget library (`widget/`) and its demo (`app/`).
Build the widget before the demo because the demo consumes its `dist` exports.

Reusable agent instructions live in `.agents/skills/`. Edit the canonical
`add-new-chain` skill there; `.claude/skills/add-new-chain/SKILL.md` points Claude
to those instructions. Keep workflow instructions model- and tool-agnostic.
