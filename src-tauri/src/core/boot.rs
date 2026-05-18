//! Service bootstrap. Resolves data dir via Tauri's path API, builds
//! [`postcrate_core::Service`] with a [`TauriEventSink`], and stores it
//! in app state.
//!
//! Failures during `start_all` are non-fatal: the app launches in a
//! `Degraded` state so the user can open Preferences → Network to
//! adjust ports and call `restart_service`.

use std::sync::Arc;

use postcrate_core::{CoreConfig, Service};
use tauri::{AppHandle, Manager};

use crate::core::sink::TauriEventSink;
use crate::core::state::{AppState, BootStatus};

/// Resolve the per-user data directory the engine should use.
///
/// Falls back to `CoreConfig::default_data_dir()` if Tauri's path API
/// is unavailable (e.g. in headless test harnesses).
fn resolve_data_dir(app: &AppHandle) -> std::path::PathBuf {
    app.path()
        .app_data_dir()
        .ok()
        .or_else(|| CoreConfig::default_data_dir().ok())
        .unwrap_or_else(|| std::path::PathBuf::from("./postcrate-data"))
}

/// Build and start the engine. Always installs `AppState` in
/// `app.manage()` — when boot fails, the state's status is
/// `Degraded` and the service handle points at a Service whose
/// listeners aren't bound (so commands still respond, they just
/// report empty state until `restart_service` recovers).
pub async fn init_service(app: AppHandle) -> postcrate_core::Result<()> {
    let data_dir = resolve_data_dir(&app);
    tracing::info!(target: "postcrate::boot", data_dir = %data_dir.display(), "engine boot");

    let cfg = CoreConfig::for_data_dir(data_dir)?;
    let sink = Arc::new(TauriEventSink::new(app.clone()));
    let service = Service::build(cfg, sink).await?;
    let service = Arc::new(service);

    let status = match service.start_all().await {
        Ok(()) => BootStatus::Ready,
        Err(err) => {
            tracing::error!(target: "postcrate::boot", "start_all failed: {err}");
            BootStatus::Degraded {
                reason: err.to_string(),
            }
        }
    };

    app.manage(AppState::new(service, status));
    Ok(())
}
