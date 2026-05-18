//! Graceful shutdown.
//!
//! Called from `RunEvent::ExitRequested`. Prevents the default exit
//! while we stop SMTP listeners + flush the SQLite WAL, then exits
//! explicitly. Time-bounded to 3 seconds; if `stop_all` stalls, we
//! exit anyway so the app doesn't appear to hang on quit.

use std::time::Duration;

use tauri::{AppHandle, Manager};
use tokio::time::timeout;

use crate::core::state::AppState;

const STOP_DEADLINE: Duration = Duration::from_secs(3);

/// Run `service.stop_all()` with a 3s timeout, then call `app.exit(0)`.
///
/// Spawned on the existing tokio runtime so it can `await`. Caller
/// must `api.prevent_exit()` before invoking this.
pub fn graceful_shutdown(app: AppHandle) {
    let handle = app.clone();
    tauri::async_runtime::spawn(async move {
        if let Some(state) = handle.try_state::<AppState>() {
            let service = state.service.clone();
            match timeout(STOP_DEADLINE, service.stop_all()).await {
                Ok(Ok(())) => {
                    tracing::info!(target: "postcrate::shutdown", "stop_all clean");
                }
                Ok(Err(err)) => {
                    tracing::warn!(target: "postcrate::shutdown", "stop_all error: {err}");
                }
                Err(_) => {
                    tracing::warn!(
                        target: "postcrate::shutdown",
                        "stop_all timed out after {STOP_DEADLINE:?}; exiting anyway",
                    );
                }
            }
        }
        handle.exit(0);
    });
}
