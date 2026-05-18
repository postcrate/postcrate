/**
 * URL for the `attachment://` URI scheme registered in
 * `src-tauri/src/core/protocol.rs`. Use in `<img src>`, `<a href>`,
 * `<iframe>` etc. — the webview routes it back to the engine.
 */
export function attachmentUrl(emailId: string, attachmentId: string): string {
  return `attachment://localhost/${encodeURIComponent(emailId)}/${encodeURIComponent(attachmentId)}`;
}
