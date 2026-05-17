mod menu;
mod windows;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let handle = app.handle();

            let menu = menu::build(handle)?;
            app.set_menu(menu)?;
            app.on_menu_event(menu::handle_event);

            windows::setup_preferences_lifecycle(handle);

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
