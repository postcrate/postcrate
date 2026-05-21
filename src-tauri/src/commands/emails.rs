use postcrate_core::{EmailDetail, EmailSummary};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn list_emails(
    state: State<'_, AppState>,
    mailbox_id: String,
    limit: u32,
    offset: u32,
) -> IpcResult<Vec<EmailSummary>> {
    Ok(state.service.list_emails(&mailbox_id, limit, offset).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn get_email(state: State<'_, AppState>, id: String) -> IpcResult<EmailDetail> {
    Ok(state.service.get_email(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn delete_email(state: State<'_, AppState>, id: String) -> IpcResult<()> {
    Ok(state.service.delete_email(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn mark_read(state: State<'_, AppState>, id: String, read: bool) -> IpcResult<()> {
    Ok(state.service.mark_read(&id, read).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn set_pinned(state: State<'_, AppState>, id: String, pinned: bool) -> IpcResult<()> {
    Ok(state.service.set_pinned(&id, pinned).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn set_starred(state: State<'_, AppState>, id: String, starred: bool) -> IpcResult<()> {
    Ok(state.service.set_starred(&id, starred).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn set_note(
    state: State<'_, AppState>,
    id: String,
    note: Option<String>,
) -> IpcResult<()> {
    Ok(state.service.set_note(&id, note.as_deref()).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn set_tag(
    state: State<'_, AppState>,
    id: String,
    tag: Option<String>,
) -> IpcResult<()> {
    Ok(state.service.set_tag(&id, tag.as_deref()).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn clear_mailbox(state: State<'_, AppState>, mailbox_id: String) -> IpcResult<u64> {
    Ok(state.service.clear_mailbox(&mailbox_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn purge_mailbox(state: State<'_, AppState>, mailbox_id: String) -> IpcResult<u64> {
    Ok(state.service.purge_mailbox(&mailbox_id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn search_emails(
    state: State<'_, AppState>,
    q: String,
    mailbox_id: Option<String>,
    limit: u32,
) -> IpcResult<Vec<EmailSummary>> {
    Ok(state
        .service
        .search_emails(&q, mailbox_id.as_deref(), limit)
        .await?)
}

/// Return the raw RFC 5322 bytes of an email as a UTF-8 string.
///
/// We lossy-convert because the webview boundary is UTF-8; non-UTF-8
/// byte sequences (rare in legit mail) get the U+FFFD replacement
/// character. Binary parts are still served via `attachment://` for
/// byte-fidelity.
#[tauri::command]
#[specta::specta]
pub async fn get_email_raw(state: State<'_, AppState>, id: String) -> IpcResult<String> {
    let bytes = state.service.get_email_raw(&id).await?;
    Ok(String::from_utf8_lossy(&bytes).into_owned())
}

/// Load the SMTP transcript captured at ingest time, if the
/// `Preserve SMTP transcript` pref was on when this email was
/// received. Returns `None` when the sidecar isn't on disk — the UI
/// uses that to hide the Transcript tab.
#[tauri::command]
#[specta::specta]
pub async fn get_email_smtp_transcript(
    state: State<'_, AppState>,
    id: String,
) -> IpcResult<Option<String>> {
    Ok(state.service.get_email_smtp_transcript(&id).await?)
}
