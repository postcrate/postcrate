use tauri::{
    menu::{Menu, MenuEvent, MenuItem, PredefinedMenuItem, Submenu},
    AppHandle, Wry,
};

use crate::windows;

mod ids {
    pub const PREFERENCES: &str = "preferences";
}

pub fn build(app: &AppHandle) -> tauri::Result<Menu<Wry>> {
    let app_submenu = build_app_submenu(app)?;
    let edit_submenu = build_edit_submenu(app)?;
    let window_submenu = build_window_submenu(app)?;
    Menu::with_items(app, &[&app_submenu, &edit_submenu, &window_submenu])
}

pub fn handle_event(app: &AppHandle, event: MenuEvent) {
    match event.id().as_ref() {
        ids::PREFERENCES => windows::show_preferences(app),
        _ => {}
    }
}

fn build_app_submenu(app: &AppHandle) -> tauri::Result<Submenu<Wry>> {
    let app_name = app.package_info().name.clone();
    let preferences = MenuItem::with_id(
        app,
        ids::PREFERENCES,
        "Preferences…",
        true,
        Some("CmdOrCtrl+,"),
    )?;

    Submenu::with_items(
        app,
        &app_name,
        true,
        &[
            &PredefinedMenuItem::about(app, Some(&app_name), None)?,
            &PredefinedMenuItem::separator(app)?,
            &preferences,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::services(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::hide(app, None)?,
            &PredefinedMenuItem::hide_others(app, None)?,
            &PredefinedMenuItem::show_all(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::quit(app, None)?,
        ],
    )
}

fn build_edit_submenu(app: &AppHandle) -> tauri::Result<Submenu<Wry>> {
    Submenu::with_items(
        app,
        "Edit",
        true,
        &[
            &PredefinedMenuItem::undo(app, None)?,
            &PredefinedMenuItem::redo(app, None)?,
            &PredefinedMenuItem::separator(app)?,
            &PredefinedMenuItem::cut(app, None)?,
            &PredefinedMenuItem::copy(app, None)?,
            &PredefinedMenuItem::paste(app, None)?,
            &PredefinedMenuItem::select_all(app, None)?,
        ],
    )
}

fn build_window_submenu(app: &AppHandle) -> tauri::Result<Submenu<Wry>> {
    Submenu::with_items(
        app,
        "Window",
        true,
        &[
            &PredefinedMenuItem::minimize(app, None)?,
            &PredefinedMenuItem::fullscreen(app, None)?,
            &PredefinedMenuItem::close_window(app, None)?,
        ],
    )
}
