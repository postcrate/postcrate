use postcrate_core::ServerStatus;
use tauri::State;

use crate::core::{AppState, BootStatus, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn server_status(state: State<'_, AppState>) -> IpcResult<ServerStatus> {
    Ok(state.service.status())
}

#[tauri::command]
#[specta::specta]
pub async fn boot_status(state: State<'_, AppState>) -> IpcResult<BootStatus> {
    Ok(state.current_status())
}
