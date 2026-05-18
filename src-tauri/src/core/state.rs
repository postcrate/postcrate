//! Per-app state managed by Tauri.
//!
//! Holds a handle to the running [`postcrate_core::Service`] plus a
//! coarse-grained `BootStatus` so the frontend can tell "ready",
//! "degraded (port conflict)", and "starting" apart.

use std::sync::{Arc, RwLock};

use postcrate_core::Service;
use serde::Serialize;

#[derive(Debug, Clone, Serialize, specta::Type)]
#[serde(tag = "kind", rename_all = "camelCase")]
pub enum BootStatus {
    Starting,
    Ready,
    /// Service failed to start. The reason is surfaced in the inbox
    /// banner; the user fixes it in Preferences → Network and calls
    /// `restart_service`.
    Degraded { reason: String },
}

pub struct AppState {
    pub service: Arc<Service>,
    pub status: RwLock<BootStatus>,
}

impl AppState {
    pub fn new(service: Arc<Service>, status: BootStatus) -> Self {
        Self {
            service,
            status: RwLock::new(status),
        }
    }

    pub fn current_status(&self) -> BootStatus {
        self.status
            .read()
            .map(|g| g.clone())
            .unwrap_or(BootStatus::Starting)
    }

    /// Reserved for the upcoming `restart_service` command, which
    /// transitions the app from `Degraded` back to `Ready` after the
    /// user changes ports in Preferences → Network.
    #[allow(dead_code)]
    pub fn set_status(&self, status: BootStatus) {
        if let Ok(mut g) = self.status.write() {
            *g = status;
        }
    }
}
