mod menu;
mod windows;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            if let Some(win) = app.get_webview_window("main") {
                let _ = win.show();
                let _ = win.unminimize();
                let _ = win.set_focus();
            }
        }));
    }

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|app| {
            let handle = app.handle();

            let menu = menu::build(handle)?;
            app.set_menu(menu)?;
            app.on_menu_event(menu::handle_event);

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{
                    apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
                };

                for label in ["main", "preferences"] {
                    if let Some(win) = app.get_webview_window(label) {
                        let _ = apply_vibrancy(
                            &win,
                            NSVisualEffectMaterial::Sidebar,
                            Some(NSVisualEffectState::Active),
                            Some(10.0),
                        );
                    }
                }
            }

            windows::setup_preferences_lifecycle(handle);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
