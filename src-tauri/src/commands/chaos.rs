use postcrate_core::ChaosConfig;
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn get_chaos(state: State<'_, AppState>, mailbox_id: String) -> IpcResult<ChaosConfig> {
    Ok(state.service.get_chaos(&mailbox_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn set_chaos(
    state: State<'_, AppState>,
    mailbox_id: String,
    cfg: ChaosConfig,
) -> IpcResult<()> {
    Ok(state.service.set_chaos(&mailbox_id, cfg).await?)
}
