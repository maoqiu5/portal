# Portal Rail-Cost Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the portal login page and signed-in portal screens visually align with the rail-cost blue business-tool palette.

**Architecture:** Keep the existing server-rendered HTML and project navigation logic. Update only CSS theme tokens and login-page presentation styles, then add smoke assertions that protect the blue palette and background treatment.

**Tech Stack:** Node.js built-in test runner, server-rendered HTML, plain CSS in `public/styles.css`.

## Global Constraints

- Do not add frontend dependencies.
- Keep the existing login, session, permission, document center, AI config, and notification config behavior unchanged.
- Use the rail-cost palette: `#0b6bcb` as accent and `#074f96` as accent dark.
- Preserve responsive behavior on mobile.

---

### Task 1: Theme Tests

**Files:**
- Modify: `test/server.test.js`

**Interfaces:**
- Consumes: `GET /assets/styles.css`
- Produces: smoke assertions for the portal theme CSS.

- [ ] **Step 1: Write failing tests**

Add assertions to the existing CSS smoke test:

```js
assert.match(res.text, /--accent:\s*#0b6bcb;/);
assert.match(res.text, /--accent-dark:\s*#074f96;/);
assert.match(res.text, /railway|freight|container/i);
assert.match(res.text, /\.login-panel\s*\{[\s\S]*border-top:\s*4px solid var\(--accent\);/);
```

- [ ] **Step 2: Verify the tests fail**

Run:

```powershell
& 'C:\Users\12514\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/server.test.js
```

Expected: the CSS smoke test fails because the portal still uses the old green palette and old login panel styling.

- [ ] **Step 3: Update CSS**

Modify `public/styles.css`:

```css
:root {
  --bg: #f5f7fb;
  --text: #172033;
  --muted: #617089;
  --line: #dce3ee;
  --accent: #0b6bcb;
  --accent-dark: #074f96;
  --soft: #edf5ff;
}
```

Update login background and panel styling to use a freight/rail visual treatment and blue accents.

- [ ] **Step 4: Verify all related tests pass**

Run:

```powershell
& 'C:\Users\12514\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' --test test/projects.test.js test/configStore.test.js test/server.test.js
git diff --check
```

Expected: all tests pass and diff check exits 0.

- [ ] **Step 5: Commit**

```powershell
git add public/styles.css test/server.test.js docs/superpowers/plans/2026-08-08-portal-railcost-theme.md
git commit -m "style: align portal with rail-cost theme"
```
