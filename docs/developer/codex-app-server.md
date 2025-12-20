# codex app-server integration

Codex Easy runs the `codex app-server` binary as a managed Tauri child process and forwards JSON-RPC traffic to the React UI. The bridge follows the upstream guidance in the official codex docs and the Tauri-specific integration notes.

## Process lifecycle

- The Rust command `start_app_server` spawns `codex app-server` with piped stdio, validates the optional working directory, and captures stdout/stderr for streaming into the webview.
- On startup, the bridge sends `initialize` with client metadata (`codexeasy`, `Codex Easy GUI`, and the app version), waits for the response, and immediately emits an `initialized` notification as required by the protocol.【F:src-tauri/src/codex.rs†L217-L320】
- A long-lived task watches stdout line-by-line. Responses that match pending request IDs are delivered back to the original caller; notifications and server-initiated requests are emitted to the webview as `codex:server-event` events.【F:src-tauri/src/codex.rs†L66-L159】
- `stop_app_server` kills the child process and drains any pending callers so the UI can recover gracefully.【F:src-tauri/src/codex.rs†L322-L344】

## Webview data flow

- Frontend listeners (`useCodexBridge`) subscribe to `codex:server-event` to record notifications, stderr lines, and process exits in a shared Zustand store.【F:src/hooks/useCodexBridge.ts†L1-L73】
- `send_app_server_rpc` writes any JSON-RPC payload to the child process. If an `id` is provided, the caller awaits the matching response; otherwise the call is treated as a notification and the UI relies on streamed events.【F:src-tauri/src/codex.rs†L347-L365】【F:src/services/codex.ts†L18-L40】
- The React dashboard offers a JSON-RPC playground plus controls for starting/stopping the server and persisting the codex binary path and workspace directory in Preferences.【F:src/components/codex/CodexDashboard.tsx†L1-L265】

## Developer tips

- Keep the codex CLI on the user’s PATH or store an absolute binary path in Preferences. The working directory (cwd) is optional but recommended for thread/turn flows.
- Use the event log in the right sidebar to debug initialization, approvals, and streaming items without attaching a debugger.
- When upgrading the CLI version, regenerate any TypeScript bindings with `codex app-server generate-ts` to keep client-side discriminated unions aligned with the server schema.
