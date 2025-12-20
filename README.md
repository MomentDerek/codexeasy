# Codex Easy

A desktop GUI for the codex CLI app-server. Codex Easy wraps `codex app-server` inside a managed Tauri shell, streams JSON-RPC traffic to the React UI, and gives you a playground to start threads, turns, and diagnostics without leaving the desktop.

## 🚀 Features

- **codex app-server bridge**: spawn and monitor `codex app-server` directly from the GUI, with initialize → initialized handshake handled for you.
- **JSON-RPC playground**: craft raw requests (e.g., `model/list`, `thread/start`) and inspect live responses and notifications.
- **Configurable CLI paths**: persist the codex binary path and workspace directory in Preferences, ready for every launch.
- **Modern Stack**: Tauri v2 + React 19 + TypeScript + Vite + shadcn/ui v4
- **State Management**: Zustand v5 + TanStack Query v5
- **Testing**: Vitest v3 + Testing Library + Rust clippy/tests
- **Quality Tools**: ESLint + Prettier + rustfmt + comprehensive CI

## 🛠 Architecture

### Command System

Centralized command palette with keyboard shortcuts and menu integration:

```typescript
// Execute commands via palette (Cmd+K), shortcuts, or menus
const commands = [
  { id: 'preferences', label: 'Open Preferences', shortcut: 'Cmd+,' },
  { id: 'toggle-sidebar', label: 'Toggle Sidebar', shortcut: 'Cmd+1' },
]
```

### State Management Onion

Layered state management approach:

- **useState**: Component-local state
- **Zustand**: App-wide UI state (sidebar visibility, themes)
- **TanStack Query**: Server state and caching (preferences, data)

### Performance Patterns

```typescript
// ✅ Use getState() to avoid render cascades
const handleAction = useCallback(() => {
  const { data, setData } = useStore.getState()
  setData(newData)
}, []) // Stable callback
```

## 📚 Documentation

- **[User Guide](docs/userguide/userguide.md)** - End-user documentation
- **[Developer Docs](docs/developer/)** - Architecture, patterns, and guides
- **[codex app-server Integration](docs/developer/codex-app-server.md)** - Bridge design and lifecycle
- **[Project Initialization](docs/developer/project-initialization.md)** - Manual steps to retarget the template to your app
- **[Testing Guide](docs/developer/testing.md)** - Testing strategies and utilities
- **[Agent Instructions](AGENTS.md)** - Codex-specific guidance for working in this repo

## 🏗 Quick Start

### Prerequisites

- [Bun](https://bun.sh/) (v1.2+)
- [Node.js](https://nodejs.org/) (v18+) for compatibility scripts
- [Rust](https://rustup.rs/) (latest stable)
- Platform-specific dependencies (see [Tauri Prerequisites](https://tauri.app/start/prerequisites/))

### Development

```bash
# Clone and install
git clone <your-repo>
cd codexeasy
bun install

# Start development server
bun run dev

# In the app, set your codex binary path and workspace,
# then click “Start server” to launch codex app-server

# Run tests and quality checks
bun run check:all

# Build for production
bun run build
```

### Project Structure

```
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── hooks/             # Custom hooks
│   ├── store/             # Zustand stores
│   └── services/          # API and external services
├── src-tauri/             # Rust backend
├── docs/                  # Documentation
│   ├── developer/         # Developer guides
│   └── userguide/         # User documentation
├── AGENTS.md              # Codex instructions for this repository
```

## 🧪 Quality Assurance

This template includes comprehensive quality gates:

```bash
bun run check:all  # Runs all checks below:
```

- ✅ TypeScript type checking
- ✅ ESLint code linting
- ✅ Prettier code formatting
- ✅ Rust formatting (cargo fmt)
- ✅ Rust linting (cargo clippy)
- ✅ React component tests
- ✅ Rust unit tests

## 🎯 What You Get

### Native Desktop Experience

- **Native menus** with keyboard shortcuts
- **System notifications** and tray integration
- **Auto-updater** with GitHub releases
- **File system access** with security validation
- **Cross-platform** builds (macOS, Windows, Linux)

### Developer Experience

- **Hot reload** in development
- **Comprehensive testing** setup
- **Type-safe** Rust ↔ React communication
- **CLI tools** for common tasks
- **AI assistants** for code generation and review

### Production Ready

- **Security best practices** built-in
- **Error handling** and logging
- **Performance optimization** patterns
- **CI/CD workflows** included
- **Documentation** for maintenance

## 🔧 Customization

### Adding New Features

1. **Commands**: Add to `src/lib/commands/`
2. **UI State**: Extend Zustand stores in `src/store/`
3. **Rust APIs**: Add Tauri commands in `src-tauri/src/lib.rs`
4. **Documentation**: Update relevant docs in `docs/`

### Configuration

- **App metadata**: `src-tauri/tauri.conf.json`
- **Build settings**: `src-tauri/Cargo.toml`
- **Dependencies**: `package.json`

## 🚀 Production Checklist

Before deploying your application to production, ensure you complete these critical steps:

### Security Requirements (CRITICAL)

- [ ] **Generate proper Ed25519 updater keys** - Replace placeholder keys in `src-tauri/tauri.conf.json`
- [ ] **Store private keys securely** - Never commit signing keys to version control
- [ ] **Review plugin permissions** - Remove unused permissions in `src-tauri/capabilities/desktop.json`

### App Configuration

- [ ] **Update app metadata** - Change productName, version, identifier, publisher in `tauri.conf.json`
- [ ] **Update package.json** - Set correct name, author, license, and copyright
- [ ] **Configure proper logging** - Set production log levels (Info, not Debug)
- [ ] **Set up error tracking** - Add Sentry, Rollbar, or similar service

### Quality Assurance

- [ ] **Run full test suite** - `bun run check:all` must pass
- [ ] **Test on all target platforms** - macOS, Windows, Linux as needed
- [ ] **Verify auto-updater flow** - Test with signed releases
- [ ] **Performance testing** - Ensure app performs well with real data

### Distribution

- [ ] **Code signing certificates** - Set up proper certificates for each platform
- [ ] **Release automation** - Configure CI/CD for automated builds and releases
- [ ] **Update server setup** - Configure server for hosting app updates
- [ ] **Analytics setup** - Add usage analytics if desired

**📖 For detailed security instructions, see [SECURITY_PRODUCTION.md](docs/SECURITY_PRODUCTION.md)**

## 📋 License

This project is licensed under the [MIT](LICENSE.md) license.

**Note:** Earlier versions incorrectly stated AGPL-3.0-or-later licensing. This was an error; all versions should be considered MIT licensed.

## 🤝 Contributing

Please read [CONTRIBUTING.md](docs/CONTRIBUTING.md) for contribution guidelines.

## 🔒 Security

For security concerns, please see [SECURITY.md](docs/SECURITY.md).

---

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
- [Cursor](https://cursor.sh/) paired with the repository `AGENTS.md` for AI-assisted development
