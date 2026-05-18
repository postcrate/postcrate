use std::time::Duration;

use postcrate_core::{EmailPredicate, MatchResult, WaitOutcome};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn wait_for_email(
    state: State<'_, AppState>,
    predicate: EmailPredicate,
    timeout_seconds: u32,
) -> IpcResult<WaitOutcome> {
    let secs = u64::from(timeout_seconds.clamp(1, 300));
    Ok(state
        .service
        .wait_for_email(predicate, Duration::from_secs(secs))
        .await?)
}

#[tauri::command]
#[specta::specta]
pub async fn assert_email_matches(
    state: State<'_, AppState>,
    id: String,
    predicate: EmailPredicate,
) -> IpcResult<MatchResult> {
    Ok(state.service.assert_email_matches(&id, &predicate).await?)
}
