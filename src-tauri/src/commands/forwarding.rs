use postcrate_core::{CreateForwardingRule, ForwardingRule};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn list_forwarding_rules(state: State<'_, AppState>) -> IpcResult<Vec<ForwardingRule>> {
    Ok(state.service.list_forwarding_rules().await?)
}

#[tauri::command]
#[specta::specta]
pub async fn create_forwarding_rule(
    state: State<'_, AppState>,
    input: CreateForwardingRule,
) -> IpcResult<ForwardingRule> {
    Ok(state.service.create_forwarding_rule(input).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_forwarding_rule(state: State<'_, AppState>, id: String) -> IpcResult<()> {
    Ok(state.service.delete_forwarding_rule(&id).await?)
}
