use postcrate_core::RelayConfig;
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn release_email(
    state: State<'_, AppState>,
    id: String,
    to: String,
    relay: RelayConfig,
) -> IpcResult<()> {
    Ok(state.service.release_email(&id, &to, &relay).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn replay_email(
    state: State<'_, AppState>,
    id: String,
    target_mailbox_id: String,
) -> IpcResult<()> {
    Ok(state.service.replay_email(&id, &target_mailbox_id).await?)
}
