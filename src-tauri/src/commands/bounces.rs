use postcrate_core::BounceRule;
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn list_bounce_rules(
    state: State<'_, AppState>,
    mailbox_id: String,
) -> IpcResult<Vec<BounceRule>> {
    Ok(state.service.list_bounce_rules(&mailbox_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn upsert_bounce_rule(
    state: State<'_, AppState>,
    rule: BounceRule,
) -> IpcResult<BounceRule> {
    Ok(state.service.upsert_bounce_rule(rule).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_bounce_rule(state: State<'_, AppState>, id: String) -> IpcResult<()> {
    Ok(state.service.delete_bounce_rule(&id).await?)
}
