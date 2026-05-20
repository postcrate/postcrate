//! Per-email deliverability + safety analyses.
//!
//! Thin wrappers over `Service::analyze_*` — same shape as the HTTP
//! routes at `/api/v1/messages/{id}/scenarios/*`. Each returns a
//! structured report the UI can render directly.

use postcrate_core::{AuthReport, LinkReport, SpamReport, UnsubReport};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn spam_report(state: State<'_, AppState>, id: String) -> IpcResult<SpamReport> {
    Ok(state.service.analyze_spam(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn link_report(state: State<'_, AppState>, id: String) -> IpcResult<LinkReport> {
    Ok(state.service.analyze_links(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn auth_report(state: State<'_, AppState>, id: String) -> IpcResult<AuthReport> {
    Ok(state.service.analyze_auth(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn unsub_report(state: State<'_, AppState>, id: String) -> IpcResult<UnsubReport> {
    Ok(state.service.analyze_list_unsub(&id).await?)
}
