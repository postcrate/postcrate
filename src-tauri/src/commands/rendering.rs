//! Per-email rendering inspection: client-profile preview, HTML lint,
//! and accessibility audit.
//!
//! Thin wrappers over `Service::render_preview` / `lint_html` /
//! `audit_a11y`. The render command takes a `Profile` so the UI can
//! reuse the same command for every client preview.

use postcrate_core::{A11yReport, LintReport, Profile, RenderedPreview};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn render_message(
    state: State<'_, AppState>,
    id: String,
    profile: Profile,
) -> IpcResult<RenderedPreview> {
    Ok(state.service.render_preview(&id, profile).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn lint_message(state: State<'_, AppState>, id: String) -> IpcResult<LintReport> {
    Ok(state.service.lint_html(&id).await?)
}

#[tauri::command]
#[specta::specta]
pub async fn a11y_message(state: State<'_, AppState>, id: String) -> IpcResult<A11yReport> {
    Ok(state.service.audit_a11y(&id).await?)
}
