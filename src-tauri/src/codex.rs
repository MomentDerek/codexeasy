use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, State};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::{Child, Command, Stdio};
use tokio::sync::{oneshot, Mutex};
use tokio::time::sleep;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClientInfo {
    pub name: String,
    pub title: String,
    pub version: String,
}

impl Default for ClientInfo {
    fn default() -> Self {
        Self {
            name: "codexeasy".to_string(),
            title: "Codex Easy GUI".to_string(),
            version: "0.1.0".to_string(),
        }
    }
}

#[derive(Debug, Default)]
pub struct AppServerState {
    process: Arc<Mutex<Option<AppServerProcess>>>,
}

#[derive(Clone)]
struct AppServerProcess {
    child: Arc<Mutex<Child>>,
    stdin: Arc<Mutex<tokio::process::ChildStdin>>,
    pending: Arc<Mutex<HashMap<String, oneshot::Sender<Value>>>>,
}

#[derive(Debug, Serialize)]
#[serde(tag = "type")]
enum FrontendEvent {
    #[serde(rename = "rpc")]
    Rpc { message: Value },
    #[serde(rename = "stderr")]
    Stderr { line: String },
    #[serde(rename = "exit")]
    Exit {
        code: Option<i32>,
        signal: Option<i32>,
    },
}

#[derive(Debug, Serialize)]
pub struct StartResult {
    pub user_agent: Option<String>,
    pub binary_path: String,
    pub working_directory: Option<String>,
}

fn extract_id(value: &Value) -> Option<String> {
    value.get("id").map(ToString::to_string)
}

async fn write_message(handle: &AppServerProcess, message: &Value) -> Result<(), String> {
    let line =
        serde_json::to_string(message).map_err(|e| format!("Failed to serialize message: {e}"))?;
    let mut stdin = handle.stdin.lock().await;
    stdin
        .write_all(line.as_bytes())
        .await
        .map_err(|e| format!("Failed to write to codex stdin: {e}"))?;
    stdin
        .write_all(b"\n")
        .await
        .map_err(|e| format!("Failed to write newline to codex stdin: {e}"))?;
    stdin
        .flush()
        .await
        .map_err(|e| format!("Failed to flush codex stdin: {e}"))
}

async fn send_request_and_wait(handle: &AppServerProcess, payload: Value) -> Result<Value, String> {
    let Some(id) = extract_id(&payload) else {
        return Err("RPC payload must include an id when awaiting a response".to_string());
    };

    let (sender, receiver) = oneshot::channel::<Value>();

    {
        let mut pending = handle.pending.lock().await;
        pending.insert(id, sender);
    }

    write_message(handle, &payload).await?;

    receiver
        .await
        .map_err(|_| "codex app-server closed before sending a response".to_string())
}

async fn forward_stdout(
    app: AppHandle,
    pending: Arc<Mutex<HashMap<String, oneshot::Sender<Value>>>>,
    stdout: tokio::process::ChildStdout,
) {
    let reader = BufReader::new(stdout);
    let mut lines = reader.lines();

    while let Ok(Some(line)) = lines.next_line().await {
        if line.trim().is_empty() {
            continue;
        }

        match serde_json::from_str::<Value>(&line) {
            Ok(message) => {
                if let Some(id) = extract_id(&message) {
                    let sender = {
                        let mut pending_map = pending.lock().await;
                        pending_map.remove(&id)
                    };

                    if let Some(sender) = sender {
                        let _ = sender.send(message.clone());
                        continue;
                    }
                }

                let _ = app.emit("codex:server-event", FrontendEvent::Rpc { message });
            }
            Err(error) => {
                let _ = app.emit(
                    "codex:server-event",
                    FrontendEvent::Stderr {
                        line: format!("Failed to parse codex output: {error} | line: {line}"),
                    },
                );
            }
        }
    }
}

async fn forward_stderr(app: AppHandle, stderr: tokio::process::ChildStderr) {
    let reader = BufReader::new(stderr);
    let mut lines = reader.lines();

    while let Ok(Some(line)) = lines.next_line().await {
        let _ = app.emit(
            "codex:server-event",
            FrontendEvent::Stderr { line: line.clone() },
        );
    }
}

async fn watch_child_exit(app: AppHandle, state: Arc<Mutex<Option<AppServerProcess>>>) {
    loop {
        let exit_status = {
            let mut guard = state.lock().await;
            let Some(handle) = guard.as_ref() else {
                return;
            };

            let mut child = handle.child.lock().await;
            match child.try_wait() {
                Ok(Some(status)) => Some(status),
                Ok(None) => None,
                Err(error) => {
                    log::error!("Failed to poll codex app-server process: {error}");
                    None
                }
            }
        };

        if let Some(status) = exit_status {
            {
                let mut guard = state.lock().await;
                *guard = None;
            }

            let code = status.code();
            #[cfg(unix)]
            let signal = status.signal();
            #[cfg(not(unix))]
            let signal = None;

            let _ = app.emit("codex:server-event", FrontendEvent::Exit { code, signal });
            break;
        }

        sleep(Duration::from_millis(500)).await;
    }
}

fn validate_working_directory(path: &Option<String>) -> Result<(), String> {
    if let Some(dir) = path {
        let path_buf = PathBuf::from(dir);
        if !path_buf.exists() {
            return Err(format!("Workspace path does not exist: {dir}"));
        }
        if !path_buf.is_dir() {
            return Err(format!("Workspace path is not a directory: {dir}"));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn start_app_server(
    app: AppHandle,
    state: State<'_, AppServerState>,
    binary_path: Option<String>,
    working_directory: Option<String>,
    client_info: Option<ClientInfo>,
) -> Result<StartResult, String> {
    log::info!("Starting codex app-server");

    {
        let existing = state.process.lock().await;
        if existing.is_some() {
            return Err("codex app-server is already running".to_string());
        }
    }

    validate_working_directory(&working_directory)?;

    let resolved_binary = binary_path
        .filter(|p| !p.trim().is_empty())
        .unwrap_or_else(|| "codex".to_string());

    let mut command = Command::new(&resolved_binary);
    command.arg("app-server");
    command.stdin(Stdio::piped());
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    if let Some(dir) = &working_directory {
        command.current_dir(dir);
    }

    let mut child = command
        .spawn()
        .map_err(|e| format!("Failed to start codex app-server: {e}"))?;

    let stdout = child
        .stdout
        .take()
        .ok_or("Failed to capture codex stdout")?;
    let stderr = child
        .stderr
        .take()
        .ok_or("Failed to capture codex stderr")?;
    let stdin = child.stdin.take().ok_or("Failed to capture codex stdin")?;

    let process = AppServerProcess {
        child: Arc::new(Mutex::new(child)),
        stdin: Arc::new(Mutex::new(stdin)),
        pending: Arc::new(Mutex::new(HashMap::new())),
    };

    let stdout_pending = process.pending.clone();
    tauri::async_runtime::spawn(forward_stdout(app.clone(), stdout_pending, stdout));
    tauri::async_runtime::spawn(forward_stderr(app.clone(), stderr));

    {
        let mut guard = state.process.lock().await;
        *guard = Some(process.clone());
    }

    let shared_state = state.process.clone();
    tauri::async_runtime::spawn(watch_child_exit(app.clone(), shared_state));

    let client = client_info.unwrap_or_default();
    let init_request = json!({
        "id": 0,
        "method": "initialize",
        "params": {
            "clientInfo": {
                "name": client.name,
                "title": client.title,
                "version": client.version,
            }
        }
    });

    let response = send_request_and_wait(&process, init_request).await?;
    let user_agent = response
        .get("result")
        .and_then(|value| value.get("userAgent"))
        .and_then(|value| value.as_str())
        .map(|value| value.to_string());

    let initialized_notification = json!({
        "method": "initialized",
        "params": {}
    });
    write_message(&process, &initialized_notification).await?;

    Ok(StartResult {
        user_agent,
        binary_path: resolved_binary,
        working_directory,
    })
}

#[tauri::command]
pub async fn stop_app_server(state: State<'_, AppServerState>) -> Result<(), String> {
    let mut guard = state.process.lock().await;
    if let Some(handle) = guard.take() {
        log::info!("Stopping codex app-server");
        {
            let mut child = handle.child.lock().await;
            child
                .start_kill()
                .map_err(|e| format!("Failed to stop codex app-server: {e}"))?;
            let _ = child.wait().await;
        }

        let mut pending = handle.pending.lock().await;
        for (_, sender) in pending.drain() {
            let _ = sender.send(json!({
                "error": { "message": "codex app-server stopped" }
            }));
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn send_app_server_rpc(
    state: State<'_, AppServerState>,
    payload: Value,
) -> Result<Option<Value>, String> {
    let handle = {
        let guard = state.process.lock().await;
        guard
            .as_ref()
            .cloned()
            .ok_or_else(|| "codex app-server is not running".to_string())?
    };

    if payload.get("id").is_some() {
        let response = send_request_and_wait(&handle, payload).await?;
        Ok(Some(response))
    } else {
        write_message(&handle, &payload).await?;
        Ok(None)
    }
}
