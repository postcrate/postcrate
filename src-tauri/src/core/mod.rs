pub mod boot;
pub mod error;
pub mod protocol;
pub mod shutdown;
pub mod sink;
pub mod state;

#[allow(unused_imports)]
pub use error::{IpcError, IpcResult};
pub use state::{AppState, BootStatus};
