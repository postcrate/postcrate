use tauri::{AppHandle, Manager, WindowEvent};

pub const PREFERENCES: &str = "preferences";

pub fn show_preferences(app: &AppHandle) {
    if let Some(window) = app.get_webview_window(PREFERENCES) {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

/// Make the preferences window hide on close instead of being destroyed,
/// so subsequent opens reuse the same instance.
pub fn setup_preferences_lifecycle(app: &AppHandle) {
    let Some(prefs) = app.get_webview_window(PREFERENCES) else {
        return;
    };
    let win = prefs.clone();
    prefs.on_window_event(move |event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();
            let _ = win.hide();
        }
    });
}
