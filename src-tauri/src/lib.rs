use enigo::{
    Axis, Button, Coordinate,
    Direction::Click,
    Enigo, Key, Keyboard, Mouse, Settings,
};
use serde::{Deserialize, Serialize};
use tauri_plugin_updater::UpdaterExt;
use url::Url;
use std::{
    process::Command,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex,
    },
    thread,
    time::Duration,
};

#[derive(Deserialize)]
struct OpenAiChatMessage {
    content: Option<String>,
}

#[derive(Deserialize)]
struct OpenAiChatChoice {
    message: OpenAiChatMessage,
}

#[derive(Deserialize)]
struct OpenAiChatResponse {
    choices: Vec<OpenAiChatChoice>,
}

#[derive(Serialize)]
struct OpenAiTextResponse {
    text: String,
}

#[derive(Default)]
struct AutomationState {
    stop_flag: Mutex<Option<Arc<AtomicBool>>>,
}

#[derive(Clone, Deserialize)]
struct ClickPoint {
    x: i32,
    y: i32,
}

#[derive(Clone, Deserialize, serde::Serialize)]
struct WindowLayout {
    x: i32,
    y: i32,
    width: u32,
    height: u32,
}

#[derive(Default)]
struct PendingUpdate(Mutex<Option<tauri_plugin_updater::Update>>);

#[derive(Serialize)]
struct UpdateCheckResult {
    available: bool,
    current_version: String,
    version: Option<String>,
    notes: Option<String>,
    message: Option<String>,
}

#[tauri::command]
fn native_status() -> &'static str {
    "ready"
}

#[tauri::command]
async fn generate_openai_text(
    api_key: String,
    model: String,
    system_prompt: String,
    user_prompt: String,
) -> Result<OpenAiTextResponse, String> {
    let key = if api_key.trim().is_empty() {
        std::env::var("OPENAI_API_KEY").map_err(|_| "Add an OpenAI API key in Settings or set OPENAI_API_KEY.".to_string())?
    } else {
        api_key
    };

    let payload = serde_json::json!({
        "model": model.trim(),
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        "temperature": 0.2,
        "store": false
    });

    let response = reqwest::Client::new()
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(key.trim())
        .json(&payload)
        .send()
        .await
        .map_err(|error| error.to_string())?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("OpenAI request failed ({status}): {body}"));
    }

    let parsed: OpenAiChatResponse = response.json().await.map_err(|error| error.to_string())?;
    let text = parsed
        .choices
        .into_iter()
        .next()
        .and_then(|choice| choice.message.content)
        .unwrap_or_default()
        .trim()
        .to_string();

    if text.is_empty() {
        return Err("OpenAI returned an empty response.".to_string());
    }

    Ok(OpenAiTextResponse { text })
}

#[tauri::command]
fn open_target(kind: String, target: String) -> Result<(), String> {
    let trimmed = target.trim();
    if trimmed.is_empty() {
        return Err("Choose something to open first.".to_string());
    }

    // TODO: replace this small OS opener with richer Tauri dialog/open APIs
    // when app, file, and folder picking are wired into the native layer.
    #[cfg(target_os = "macos")]
    let status = Command::new("open").arg(trimmed).status();

    #[cfg(target_os = "windows")]
    let status = Command::new("cmd")
        .args(["/C", "start", "", trimmed])
        .status();

    #[cfg(all(unix, not(target_os = "macos")))]
    let status = Command::new("xdg-open").arg(trimmed).status();

    status
        .map_err(|error| format!("Could not open {kind}: {error}"))
        .and_then(|exit| {
            if exit.success() {
                Ok(())
            } else {
                Err(format!("Could not open {kind}."))
            }
        })
}

#[tauri::command]
fn set_main_always_on_top(window: tauri::Window, enabled: bool) -> Result<(), String> {
    // TODO: connect this to a global hotkey once the shortcut registry is
    // promoted to Tauri's native global shortcut plugin.
    window
        .set_always_on_top(enabled)
        .map_err(|error| error.to_string())
}

#[tauri::command]
fn get_window_layout(window: tauri::Window) -> Result<WindowLayout, String> {
    let position = window.outer_position().map_err(|error| error.to_string())?;
    let size = window.outer_size().map_err(|error| error.to_string())?;
    Ok(WindowLayout {
        x: position.x,
        y: position.y,
        width: size.width,
        height: size.height,
    })
}

#[tauri::command]
fn restore_window_layout(window: tauri::Window, layout: WindowLayout) -> Result<(), String> {
    // TODO: expand this from the Quality life window to full multi-monitor
    // workspace snapshots when OS-level window enumeration is added.
    window
        .set_position(tauri::PhysicalPosition::new(layout.x, layout.y))
        .map_err(|error| error.to_string())?;
    window
        .set_size(tauri::PhysicalSize::new(layout.width, layout.height))
        .map_err(|error| error.to_string())
}

#[tauri::command]
async fn check_for_updates(
    app: tauri::AppHandle,
    state: tauri::State<'_, PendingUpdate>,
    endpoint: String,
) -> Result<UpdateCheckResult, String> {
    let endpoint = endpoint.trim();
    if endpoint.is_empty() {
        return Ok(UpdateCheckResult {
            available: false,
            current_version: app.package_info().version.to_string(),
            version: None,
            notes: None,
            message: Some("No update feed is configured yet.".to_string()),
        });
    }

    let update = app
        .updater_builder()
        .endpoints(vec![endpoint.parse::<Url>().map_err(|error| error.to_string())?])
        .map_err(|error| error.to_string())?
        .build()
        .map_err(|error| error.to_string())?
        .check()
        .await
        .map_err(|error| error.to_string())?;

    let current_version = app.package_info().version.to_string();
    let result = if let Some(update) = update {
        let version = update.version.clone();
        let notes = update.body.clone().unwrap_or_default();
        *state.0.lock().expect("pending update state poisoned") = Some(update);
        UpdateCheckResult {
            available: true,
            current_version,
            version: Some(version),
            notes: Some(notes),
            message: None,
        }
    } else {
        *state.0.lock().expect("pending update state poisoned") = None;
        UpdateCheckResult {
            available: false,
            current_version,
            version: None,
            notes: None,
            message: Some("No update is available right now.".to_string()),
        }
    };

    Ok(result)
}

#[tauri::command]
async fn install_pending_update(
    app: tauri::AppHandle,
    state: tauri::State<'_, PendingUpdate>,
) -> Result<(), String> {
    let update = state
        .0
        .lock()
        .expect("pending update state poisoned")
        .take()
        .ok_or_else(|| "No pending update is ready to install.".to_string())?;

    update
        .download_and_install(|_, _| {
            // Progress events can be bridged to the UI later if needed.
        }, || {})
        .await
        .map_err(|error| error.to_string())?;

    app.restart();
}

#[tauri::command]
fn stop_automation(state: tauri::State<'_, AutomationState>) -> Result<(), String> {
    stop_current(&state);
    Ok(())
}

#[tauri::command]
fn start_auto_clicker(
    state: tauri::State<'_, AutomationState>,
    interval_ms: u64,
    click_mode: String,
    start_delay_ms: u64,
) -> Result<(), String> {
    let mut enigo = new_enigo()?;
    let flag = replace_job(&state);
    let interval = Duration::from_millis(interval_ms.max(1));
    let start_delay = Duration::from_millis(start_delay_ms);
    let double_click = click_mode == "double";

    thread::spawn(move || {
        thread::sleep(start_delay);
        while !flag.load(Ordering::SeqCst) {
            let _ = enigo.button(Button::Left, Click);
            if double_click {
                thread::sleep(Duration::from_millis(45));
                let _ = enigo.button(Button::Left, Click);
            }
            thread::sleep(interval);
        }
    });

    Ok(())
}

#[tauri::command]
fn start_multi_clicker(
    state: tauri::State<'_, AutomationState>,
    points: Vec<ClickPoint>,
    interval_ms: u64,
    start_delay_ms: u64,
) -> Result<(), String> {
    if points.is_empty() {
        return Err("Add at least one click point first.".to_string());
    }

    let mut enigo = new_enigo()?;
    let flag = replace_job(&state);
    let interval = Duration::from_millis(interval_ms.max(25));
    let start_delay = Duration::from_millis(start_delay_ms);

    thread::spawn(move || {
        thread::sleep(start_delay);
        while !flag.load(Ordering::SeqCst) {
            for point in &points {
                if flag.load(Ordering::SeqCst) {
                    break;
                }
                let _ = enigo.move_mouse(point.x, point.y, Coordinate::Abs);
                let _ = enigo.button(Button::Left, Click);
                thread::sleep(interval);
            }
        }
    });

    Ok(())
}

#[tauri::command]
fn start_mouse_jiggler(
    state: tauri::State<'_, AutomationState>,
    interval_ms: u64,
    distance: i32,
    start_delay_ms: u64,
) -> Result<(), String> {
    let mut enigo = new_enigo()?;
    let flag = replace_job(&state);
    let interval = Duration::from_millis(interval_ms.max(250));
    let distance = distance.clamp(1, 100);
    let start_delay = Duration::from_millis(start_delay_ms);

    thread::spawn(move || {
        thread::sleep(start_delay);
        while !flag.load(Ordering::SeqCst) {
            let _ = enigo.move_mouse(distance, 0, Coordinate::Rel);
            thread::sleep(Duration::from_millis(60));
            let _ = enigo.move_mouse(-distance, 0, Coordinate::Rel);
            thread::sleep(interval);
        }
    });

    Ok(())
}

#[tauri::command]
fn start_key_spammer(
    state: tauri::State<'_, AutomationState>,
    key_text: String,
    rate_per_second: u64,
    start_delay_ms: u64,
) -> Result<(), String> {
    let key = parse_key(&key_text).ok_or_else(|| {
        "Use one character or a supported key name like Space, Enter, Tab, Escape, Up, Down, Left, Right."
            .to_string()
    })?;
    let mut enigo = new_enigo()?;
    let flag = replace_job(&state);
    let interval = Duration::from_millis((1000 / rate_per_second.max(1)).max(20));
    let start_delay = Duration::from_millis(start_delay_ms);

    thread::spawn(move || {
        thread::sleep(start_delay);
        while !flag.load(Ordering::SeqCst) {
            let _ = enigo.key(key, Click);
            thread::sleep(interval);
        }
    });

    Ok(())
}

#[tauri::command]
fn start_auto_typer(
    state: tauri::State<'_, AutomationState>,
    text: String,
    delay_ms: u64,
    start_delay_ms: u64,
) -> Result<(), String> {
    let mut enigo = new_enigo()?;
    let flag = replace_job(&state);
    let delay = Duration::from_millis(delay_ms.max(5));
    let start_delay = Duration::from_millis(start_delay_ms);

    thread::spawn(move || {
        thread::sleep(start_delay);
        for character in text.chars() {
            if flag.load(Ordering::SeqCst) {
                break;
            }
            let _ = enigo.text(&character.to_string());
            thread::sleep(delay);
        }
    });

    Ok(())
}

#[tauri::command]
fn start_auto_scroll(
    state: tauri::State<'_, AutomationState>,
    amount: i32,
    interval_ms: u64,
    start_delay_ms: u64,
) -> Result<(), String> {
    let mut enigo = new_enigo()?;
    let flag = replace_job(&state);
    let interval = Duration::from_millis(interval_ms.max(40));
    let amount = amount.clamp(-25, 25);
    let start_delay = Duration::from_millis(start_delay_ms);

    thread::spawn(move || {
        thread::sleep(start_delay);
        while !flag.load(Ordering::SeqCst) {
            let _ = enigo.scroll(amount, Axis::Vertical);
            thread::sleep(interval);
        }
    });

    Ok(())
}

fn new_enigo() -> Result<Enigo, String> {
    Enigo::new(&Settings::default()).map_err(|error| format!("{error:?}"))
}

fn replace_job(state: &tauri::State<'_, AutomationState>) -> Arc<AtomicBool> {
    stop_current(state);
    let flag = Arc::new(AtomicBool::new(false));
    *state.stop_flag.lock().expect("automation state poisoned") = Some(flag.clone());
    flag
}

fn stop_current(state: &tauri::State<'_, AutomationState>) {
    if let Some(flag) = state
        .stop_flag
        .lock()
        .expect("automation state poisoned")
        .take()
    {
        flag.store(true, Ordering::SeqCst);
    }
}

fn parse_key(input: &str) -> Option<Key> {
    let key = input.trim();
    let lower = key.to_lowercase();
    match lower.as_str() {
        "space" => Some(Key::Space),
        "enter" | "return" => Some(Key::Return),
        "tab" => Some(Key::Tab),
        "escape" | "esc" => Some(Key::Escape),
        "backspace" => Some(Key::Backspace),
        "delete" => Some(Key::Delete),
        "up" | "uparrow" | "arrowup" => Some(Key::UpArrow),
        "down" | "downarrow" | "arrowdown" => Some(Key::DownArrow),
        "left" | "leftarrow" | "arrowleft" => Some(Key::LeftArrow),
        "right" | "rightarrow" | "arrowright" => Some(Key::RightArrow),
        _ => {
            let mut chars = key.chars();
            let first = chars.next()?;
            if chars.next().is_none() {
                Some(Key::Unicode(first))
            } else {
                None
            }
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AutomationState::default())
        .manage(PendingUpdate::default())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        // Future native integrations belong here: global hotkeys, system sleep
        // blockers, startup behavior, window pinning, filesystem scanners,
        // screen capture, and higher-level permission guidance.
        .invoke_handler(tauri::generate_handler![
            native_status,
            generate_openai_text,
            open_target,
            set_main_always_on_top,
            get_window_layout,
            restore_window_layout,
            stop_automation,
            start_auto_clicker,
            start_multi_clicker,
            start_mouse_jiggler,
            start_key_spammer,
            start_auto_typer,
            start_auto_scroll,
            check_for_updates,
            install_pending_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running Quality life");
}
