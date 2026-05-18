use postcrate_core::{CreateWebhook, Webhook};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn list_webhooks(state: State<'_, AppState>) -> IpcResult<Vec<Webhook>> {
    Ok(state.service.list_webhooks().await?)
}

#[tauri::command]
#[specta::specta]
pub async fn create_webhook(
    state: State<'_, AppState>,
    input: CreateWebhook,
) -> IpcResult<Webhook> {
    Ok(state.service.create_webhook(input).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_webhook(state: State<'_, AppState>, id: String) -> IpcResult<()> {
    Ok(state.service.delete_webhook(&id).await?)
}
