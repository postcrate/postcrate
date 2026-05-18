//! IPC error contract.
//!
//! Engine errors don't `Serialize` directly. Every `#[tauri::command]`
//! returns `Result<T, IpcError>`; the frontend receives a stable
//! `{ code, message }` shape it can branch on (banner vs toast vs modal).

use serde::Serialize;

#[derive(Debug, Clone, Serialize, specta::Type, thiserror::Error)]
#[serde(rename_all = "camelCase")]
#[error("{message}")]
pub struct IpcError {
    /// Machine-readable code from `postcrate_core::Error::code()`
    /// (e.g. `"port_in_use"`, `"mailbox_not_found"`, `"invalid"`).
    pub code: String,
    /// Human-readable message suitable for surfacing to the user.
    pub message: String,
}

impl IpcError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self {
            code: code.into(),
            message: message.into(),
        }
    }

    pub fn internal(message: impl Into<String>) -> Self {
        Self::new("internal", message)
    }
}

impl From<postcrate_core::Error> for IpcError {
    fn from(err: postcrate_core::Error) -> Self {
        Self {
            code: err.code().to_string(),
            message: err.to_string(),
        }
    }
}

impl From<std::io::Error> for IpcError {
    fn from(err: std::io::Error) -> Self {
        Self::internal(err.to_string())
    }
}

pub type IpcResult<T> = std::result::Result<T, IpcError>;
