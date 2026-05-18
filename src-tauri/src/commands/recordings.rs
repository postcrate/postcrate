use postcrate_core::Recording;
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn export_recording(
    state: State<'_, AppState>,
    mailbox_id: String,
    label: Option<String>,
) -> IpcResult<Recording> {
    Ok(state.service.export_recording(&mailbox_id, label).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn replay_recording(
    state: State<'_, AppState>,
    mailbox_id: String,
    recording: Recording,
) -> IpcResult<u64> {
    Ok(state
        .service
        .replay_recording(&mailbox_id, &recording)
        .await?)
}
