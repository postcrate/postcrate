use postcrate_core::{
    AdvancedPrefs, AgentPrefs, BackendSettings, InboxPrefs, NetworkPrefs, SettingsPatch,
};
use tauri::State;

use crate::core::{AppState, IpcResult};

#[tauri::command]
#[specta::specta]
pub async fn get_settings(state: State<'_, AppState>) -> IpcResult<BackendSettings> {
    Ok(state.service.get_settings().await?)
}

#[tauri::command]
#[specta::specta]
pub async fn update_network_settings(
    state: State<'_, AppState>,
    prefs: NetworkPrefs,
) -> IpcResult<()> {
    Ok(state
        .service
        .update_settings(SettingsPatch::Network(prefs))
        .await?)
}

#[tauri::command]
#[specta::specta]
pub async fn update_agent_settings(
    state: State<'_, AppState>,
    prefs: AgentPrefs,
) -> IpcResult<()> {
    Ok(state
        .service
        .update_settings(SettingsPatch::Agents(prefs))
        .await?)
}

#[tauri::command]
#[specta::specta]
pub async fn update_inbox_settings(
    state: State<'_, AppState>,
    prefs: InboxPrefs,
) -> IpcResult<()> {
    Ok(state
        .service
        .update_settings(SettingsPatch::Inbox(prefs))
        .await?)
}

#[tauri::command]
#[specta::specta]
pub async fn update_advanced_settings(
    state: State<'_, AppState>,
    prefs: AdvancedPrefs,
) -> IpcResult<()> {
    Ok(state
        .service
        .update_settings(SettingsPatch::Advanced(prefs))
        .await?)
}
