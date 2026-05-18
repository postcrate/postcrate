use postcrate_core::AuditEntry;
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn list_audit(
    state: State<'_, AppState>,
    limit: u32,
    offset: u32,
) -> IpcResult<Vec<AuditEntry>> {
    Ok(state.service.list_audit(limit, offset).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn clear_audit(
    state: State<'_, AppState>,
    older_than_days: Option<u32>,
) -> IpcResult<u64> {
    Ok(state.service.clear_audit(older_than_days).await?)
}
