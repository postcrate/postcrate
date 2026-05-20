mod commands;
mod core;
mod menu;
mod windows;

use tauri::{Manager, RunEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    let specta_builder = commands::specta_builder();

    #[cfg(debug_assertions)]
    {
        use specta_typescript::{BigIntExportBehavior, Typescript};
        specta_builder
            .export(
                Typescript::default()
                    .bigint(BigIntExportBehavior::Number)
                    .header("// @ts-nocheck\n// @generated — do not edit. Run `npm run tauri dev`.\n"),
                "../src/lib/bridge/bindings.ts",
            )
            .expect("failed to export typescript bindings");
    }

    let mut builder = tauri::Builder::default();

    #[cfg(desktop)]
    {
        builder = builder.plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            windows::reactivate(app);
        }));
    }

    let app = builder
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri_plugin_window_state::Builder::default()
                // Don't restore the last visibility — bootstrap in the
                // frontend decides whether `main` is shown, so we'd
                // otherwise flash the main window before onboarding.
                .with_state_flags(
                    tauri_plugin_window_state::StateFlags::all()
                        - tauri_plugin_window_state::StateFlags::VISIBLE,
                )
                // Onboarding is a one-shot transient window; don't let
                // it inherit any persisted size/position state.
                .skip_initial_state(windows::ONBOARDING)
                .build(),
        )
        .register_asynchronous_uri_scheme_protocol(
            core::protocol::SCHEME,
            core::protocol::handle_request,
        )
        .invoke_handler(specta_builder.invoke_handler())
        .setup(move |app| {
            let handle = app.handle();

            // Whichever window the frontend bootstrap decides to show
            // first, never let `main` flash before that decision lands.
            if let Some(main) = app.get_webview_window(windows::MAIN) {
                let _ = main.hide();
            }

            specta_builder.mount_events(app);

            let menu = menu::build(handle)?;
            app.set_menu(menu)?;
            app.on_menu_event(menu::handle_event);

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{
                    apply_vibrancy, NSVisualEffectMaterial, NSVisualEffectState,
                };

                for label in [windows::MAIN, windows::ONBOARDING, windows::PREFERENCES] {
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

            // Kick off engine boot on the existing tokio runtime so
            // setup() returns quickly. AppState lands in `app.manage()`
            // before the first command can hit it.
            let init_handle = handle.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(err) = core::boot::init_service(init_handle).await {
                    tracing::error!(target: "postcrate::boot", "init_service: {err}");
                }
            });

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|app_handle, event| {
        if let RunEvent::ExitRequested { api, .. } = event {
            api.prevent_exit();
            core::shutdown::graceful_shutdown(app_handle.clone());
        }
    });
}

fn init_tracing() {
    use tracing_subscriber::{fmt, prelude::*, EnvFilter};

    let filter = EnvFilter::try_from_env("POSTCRATE_LOG")
        .unwrap_or_else(|_| EnvFilter::new("info,postcrate=debug"));
    let _ = tracing_subscriber::registry()
        .with(filter)
        .with(fmt::layer().with_target(true))
        .try_init();
}
