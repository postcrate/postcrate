//! `EventSink` implementation that forwards engine events to the
//! Tauri event bus.
//!
//! Each `CoreEvent` variant maps to a stable kebab-case event name
//! prefixed with `engine:`. Frontend listeners pick what they want.
//! Emit failures are logged and swallowed so engine state can't be
//! poisoned by a transient IPC hiccup.

use postcrate_core::{CoreEvent, EventSink};
use tauri::{AppHandle, Emitter};

pub struct TauriEventSink {
    app: AppHandle,
}

impl TauriEventSink {
    pub fn new(app: AppHandle) -> Self {
        Self { app }
    }

    fn event_name(event: &CoreEvent) -> &'static str {
        match event {
            CoreEvent::NewEmail { .. } => "engine:new-email",
            CoreEvent::MailboxStateChanged { .. } => "engine:mailbox-state-changed",
            CoreEvent::ServerStatusChanged { .. } => "engine:server-status-changed",
            CoreEvent::SettingsChanged { .. } => "engine:settings-changed",
            CoreEvent::AuditAppended { .. } => "engine:audit-appended",
        }
    }
}

impl EventSink for TauriEventSink {
    fn emit(&self, event: CoreEvent) {
        let name = Self::event_name(&event);
        if let Err(e) = self.app.emit(name, &event) {
            tracing::warn!(target: "postcrate::sink", "emit {name} failed: {e}");
        }
    }
}
