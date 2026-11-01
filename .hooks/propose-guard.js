// propose-guard.js — propose-only mutation guard (ships with the template).
// Registered via app/.root/.opencode/opencode.json -> synced to workspace-root
// .opencode/opencode.json (UserPromptSubmit / PreToolUse).
// Language-agnostic; applies to any agent tool call (edit/write/bash).

const EXEC_VERBS = new Set([
  "execute","implement","fix","build","run","do","go ahead","start",
  "apply","make it","create","perform","carry out","proceed","deploy"
]);

function classify(prompt) {
  const p = (prompt || "").toLowerCase();
  const propose = p.includes("propose") || p.includes("design") || p.includes("spec");
  const action = [...EXEC_VERBS].some(v => p.includes(v));
  return { propose, action, mutationAllowed: propose && action };
}

// UserPromptSubmit hook (post-prompt): set session flag.
function onUserPromptSubmit({ prompt, session }) {
  const r = classify(prompt);
  session.mutationAllowed = r.mutationAllowed;
  session.proposeOnly = r.propose && !r.action;
  return { allowed: true, mutationAllowed: r.mutationAllowed, reason: r.proposeOnly ? "propose-only: block mutation until execution verb present" : undefined };
}

// PreToolUse hook: enforce block before edit/write/bash.
function onPreToolUse({ toolName, session }) {
  if (session.proposeOnly && ["Edit","Write","Bash"].includes(toolName)) {
    return { allowed: false, reason: "propose-only guard: mutation blocked; include execution verb (e.g., implement fix) or confirm" };
  }
  return { allowed: true };
}

module.exports = { classify, onUserPromptSubmit, onPreToolUse };
