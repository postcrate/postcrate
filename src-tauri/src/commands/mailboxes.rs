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

/// Bring a stopped or failed mailbox's SMTP listener online and clear
/// the persistent `paused` intent. Errors propagate so the UI can show
/// why a bind failed (port in use, etc.) and revert its optimistic
/// status change.
#[tauri::command]
#[specta::specta]
pub async fn start_mailbox(state: State<'_, AppState>, id: String) -> IpcResult<()> {
    Ok(state.service.start_mailbox(&id).await?)
}

/// Tear down a mailbox's SMTP listener and remember the user intent
/// so the listener stays down across app restarts.
#[tauri::command]
#[specta::specta]
pub async fn stop_mailbox(state: State<'_, AppState>, id: String) -> IpcResult<()> {
    Ok(state.service.stop_mailbox(&id).await?)
}

/// Suggest a free SMTP port. Walks upward from `start` (default
/// 1025), skipping ports already used by another mailbox in this DB
/// and probe-binding each candidate so we also catch ports held by
/// other processes on the host. Returns the first free port.
///
/// Advisory: the actual `create_mailbox` is authoritative. If the
/// suggestion is stolen by a racing create, the create fails with
/// `PortInUse` and the UI fetches a fresh suggestion.
#[tauri::command]
#[specta::specta]
pub async fn suggest_mailbox_port(
    state: State<'_, AppState>,
    start: Option<u16>,
) -> IpcResult<u16> {
    Ok(state.service.suggest_mailbox_port(start).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn create_ephemeral(
    state: State<'_, AppState>,
    input: CreateEphemeralInput,
) -> IpcResult<EphemeralHandle> {
    Ok(state.service.create_ephemeral(input).await?)
}
