use postcrate_core::{
    CreateEphemeralInput, CreateMailboxInput, EphemeralHandle, Mailbox, UpdateMailboxInput,
};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn list_mailboxes(
    state: State<'_, AppState>,
    project_id: Option<String>,
) -> IpcResult<Vec<Mailbox>> {
    Ok(state.service.list_mailboxes(project_id.as_deref()).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_mailbox(state: State<'_, AppState>, id: String) -> IpcResult<Mailbox> {
    Ok(state.service.get_mailbox(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn create_mailbox(
    state: State<'_, AppState>,
    input: CreateMailboxInput,
) -> IpcResult<Mailbox> {
    Ok(state.service.create_mailbox(input).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn update_mailbox(
    state: State<'_, AppState>,
    id: String,
    patch: UpdateMailboxInput,
) -> IpcResult<Mailbox> {
    Ok(state.service.update_mailbox(&id, patch).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_mailbox(state: State<'_, AppState>, id: String) -> IpcResult<()> {
    Ok(state.service.delete_mailbox(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn create_ephemeral(
    state: State<'_, AppState>,
    input: CreateEphemeralInput,
) -> IpcResult<EphemeralHandle> {
    Ok(state.service.create_ephemeral(input).await?)
}
