//! Live-reloadable tracing filter.
//!
//! `tracing_subscriber::registry()` is a one-shot global init, so the
//! desktop app stamps it down at process startup with a
//! `reload::Layer<EnvFilter>`. The reload handle gets stashed in a
//! `OnceLock` so other modules (notably `core::boot`) can hand a
//! controller closure to `postcrate_core::Service`.
//!
//! When the user flips `Preferences → Advanced → Debug logging`, the
//! engine emits a `SettingsChanged(Advanced)` event and invokes the
//! installed controller, which calls `handle.reload(...)` here — no
//! restart needed, the very next log line uses the new filter.
//!
//! Falls back gracefully: if reload fails (e.g. handle dropped), we
//! log a warning to the existing subscriber and keep running.

use std::sync::Arc;
use std::sync::OnceLock;

use tracing_subscriber::reload;
use tracing_subscriber::{fmt, prelude::*, EnvFilter, Registry};

/// The reload handle for the global subscriber. The concrete subscriber
/// type is opaque to callers — they only need the bool callback below.
static LOG_HANDLE: OnceLock<
    reload::Handle<EnvFilter, Registry>,
> = OnceLock::new();

/// Stamp down the global subscriber. Idempotent on best-effort —
/// `try_init` swallows the error if some other crate already installed
/// a subscriber (e.g. during tests).
pub fn install_subscriber() {
    let filter = base_filter();
    let (layer, handle) = reload::Layer::new(filter);

    let _ = Registry::default()
        .with(layer)
        .with(fmt::layer().with_target(true))
        .try_init();

    let _ = LOG_HANDLE.set(handle);
}

/// Build a controller suitable for handing to
/// `postcrate_core::Service::set_log_level_controller`. Returns `None`
/// when the subscriber wasn't installed (test harness, etc.) — the
/// engine treats that as a no-op.
///
/// The closure flips between a verbose preset (`debug,postcrate=trace`)
/// when the toggle is on, and the env-driven baseline when it's off.
pub fn controller() -> Option<Arc<dyn Fn(bool) + Send + Sync>> {
    let handle = LOG_HANDLE.get()?.clone();
    Some(Arc::new(move |verbose: bool| {
        let next = if verbose {
            EnvFilter::new("debug,postcrate=trace")
        } else {
            base_filter()
        };
        if let Err(err) = handle.reload(next) {
            tracing::warn!(target: "postcrate::log", error = %err, "tracing filter reload failed");
        } else {
            tracing::debug!(target: "postcrate::log", verbose, "tracing filter reloaded");
        }
    }))
}

/// The filter applied at boot and whenever debug-logging is off. Honors
/// `POSTCRATE_LOG` env override so developers can still tighten or
/// widen the baseline without touching the UI.
fn base_filter() -> EnvFilter {
    EnvFilter::try_from_env("POSTCRATE_LOG")
        .unwrap_or_else(|_| EnvFilter::new("info,postcrate=debug"))
}
