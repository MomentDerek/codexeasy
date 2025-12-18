# Project Initialization Guide

Use this guide to retarget the template for your application now that the automated `/init` command is gone. Work through the checklist in order so names, identifiers, and release settings stay consistent across the stack.

## 1) Collect details

- **App name**: Final product name (e.g., "Notes Pro").
- **Short description**: One or two sentences describing what the app does.
- **GitHub owner**: Your GitHub username or organization (for identifiers and updater URLs).

> Tip: You can grab the owner from `git config user.name` or `gh api user --jq .login`.

## 2) Update application metadata

- `package.json`: Set `name`, `productName` (if present), and `description` to match your app.
- `index.html`: Update the `<title>` tag to the new app name.
- `README.md`: Replace the template title/intro with your app name and description.
- `AGENTS.md`: If you add repo-specific automation rules, keep them here so agents stay in sync.

## 3) Align Tauri configuration

- `src-tauri/tauri.conf.json`:
  - `productName`: App name.
  - `identifier`: Use `com.<github-owner>.<kebab-app-name>`.
  - `bundle.shortDescription` and `bundle.longDescription`: Use the cleaned-up description.
  - `bundle.publisher`: GitHub owner or company name.
  - `windows[].title`: App name.
  - Updater endpoints: Point to your GitHub repo releases if you ship updates.
- `src-tauri/Cargo.toml`:
  - `package.name`: Kebab-case app name.
  - `package.description`: App description.
  - `package.authors`: Your GitHub owner or team.

## 4) CI/CD and release metadata

- `.github/workflows/release.yml`: Rename the workflow, release title, and any references to the template to use your app name/repo.
- `LICENSE.md`: Confirm the correct author/publisher if you need to adjust licensing text.

## 5) Security and signing

- Generate a Tauri updater keypair if you plan to ship updates: `bunx tauri signer generate` (or the equivalent via `cargo tauri signer`).
- Add the **public key** to `src-tauri/tauri.conf.json`.
- Store the **private key** and **password** as GitHub Actions secrets (`TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`).

## 6) Quality checks

- Install dependencies: `bun install` (if not already installed).
- Run the full suite before your first release: `bun run check:all`.
- For iterative changes, run the most relevant subset (e.g., `bun run lint`, `bun run typecheck`, `bun run test:run`, `bun run rust:fmt:check`, `bun run rust:clippy`, `bun run rust:test`).

## 7) Final review

- Verify names, identifiers, and updater URLs match across `package.json`, `tauri.conf.json`, and `Cargo.toml`.
- Ensure `README.md` and any marketing copy reflect the new app identity.
- Remove any leftover template references that don’t apply to your product.
