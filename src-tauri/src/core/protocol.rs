//! Custom URI scheme for attachment binary serving.
//!
//! Frontend constructs URLs like `attachment://<email-id>/<attachment-id>`
//! and embeds them in `<a href>` or `<img src>` directly. This avoids
//! base64-round-tripping multi-megabyte attachments through `invoke`
//! and gives the webview's HTTP cache a chance to dedupe.
//!
//! Path layout is `/<email-id>/<attachment-id>` — `email-id` is
//! advisory (we look up by attachment id only) but is part of the URL
//! so attachments inherit the email's privacy scope semantically.

use tauri::http::{Response, StatusCode};
use tauri::{Manager, UriSchemeContext, UriSchemeResponder};

use crate::core::state::AppState;

pub const SCHEME: &str = "attachment";

/// Spawn the attachment handler. Replies asynchronously so we can
/// fetch the blob from the engine without blocking the webview's
/// request thread.
pub fn handle_request<R: tauri::Runtime>(
    ctx: UriSchemeContext<'_, R>,
    request: tauri::http::Request<Vec<u8>>,
    responder: UriSchemeResponder,
) {
    let app = ctx.app_handle().clone();
    let uri = request.uri().clone();

    tauri::async_runtime::spawn(async move {
        let response = match resolve(&app, &uri).await {
            Ok((bytes, content_type, filename)) => {
                let mut builder = Response::builder()
                    .status(StatusCode::OK)
                    .header("Content-Type", content_type.as_deref().unwrap_or("application/octet-stream"))
                    .header("Cache-Control", "private, max-age=86400");
                if let Some(name) = filename {
                    builder = builder.header(
                        "Content-Disposition",
                        format!("inline; filename=\"{}\"", sanitize_filename(&name)),
                    );
                }
                builder.body(bytes).unwrap_or_else(error_response)
            }
            Err(status) => Response::builder()
                .status(status)
                .body(Vec::new())
                .unwrap_or_else(error_response),
        };
        responder.respond(response);
    });
}

/// Fetch the blob via the engine. Returns (bytes, content_type, filename)
/// on success, or an HTTP status code on failure.
async fn resolve<R: tauri::Runtime>(
    app: &tauri::AppHandle<R>,
    uri: &tauri::http::Uri,
) -> Result<(Vec<u8>, Option<String>, Option<String>), StatusCode> {
    let state = app.try_state::<AppState>().ok_or(StatusCode::SERVICE_UNAVAILABLE)?;
    let id = attachment_id(uri).ok_or(StatusCode::BAD_REQUEST)?;
    state
        .service
        .get_attachment_blob(&id)
        .await
        .map_err(|e| {
            tracing::warn!(target: "postcrate::attachment", "fetch failed: {e}");
            match e {
                postcrate_core::Error::AttachmentNotFound(_) => StatusCode::NOT_FOUND,
                _ => StatusCode::INTERNAL_SERVER_ERROR,
            }
        })
}

/// Extract `<attachment-id>` from `attachment://<email-id>/<attachment-id>`.
fn attachment_id(uri: &tauri::http::Uri) -> Option<String> {
    // The webview rewrites custom-scheme URLs as
    // `http://<scheme>.localhost/<path>` on Windows and as
    // `<scheme>://localhost/<path>` on macOS/Linux. Either way the
    // path() is `/<email-id>/<attachment-id>`.
    let path = uri.path();
    let segments: Vec<&str> = path
        .trim_start_matches('/')
        .split('/')
        .filter(|s| !s.is_empty())
        .collect();
    segments.get(1).map(|s| (*s).to_string())
}

fn sanitize_filename(name: &str) -> String {
    name.chars()
        .filter(|c| !matches!(*c, '"' | '\\' | '\n' | '\r'))
        .take(200)
        .collect()
}

fn error_response(_e: tauri::http::Error) -> Response<Vec<u8>> {
    Response::new(Vec::new())
}
