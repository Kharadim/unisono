use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;

#[cfg(not(debug_assertions))]
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

struct SidecarState {
    child: Mutex<Option<CommandChild>>,
}

/// Show a native error dialog and log to file.
/// Works even before the WebView is ready (uses OS-native message box via rfd).
#[cfg_attr(debug_assertions, allow(dead_code))]
fn show_error(data_dir: Option<&std::path::Path>, title: &str, message: &str) {
    eprintln!("[unisono] {}: {}", title, message);

    // Write to log file if data_dir is available
    if let Some(dir) = data_dir {
        let log_path = dir.join("unisono.log");
        let timestamp = chrono_simple_timestamp();
        let entry = format!("[{}] {}: {}\n", timestamp, title, message);
        let _ = std::fs::OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_path)
            .and_then(|mut f| std::io::Write::write_all(&mut f, entry.as_bytes()));
    }

    // Show native OS dialog
    rfd::MessageDialog::new()
        .set_level(rfd::MessageLevel::Error)
        .set_title(title)
        .set_description(message)
        .show();
}

/// Simple timestamp without chrono dependency
#[cfg_attr(debug_assertions, allow(dead_code))]
fn chrono_simple_timestamp() -> String {
    use std::time::SystemTime;
    let d = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", d.as_secs())
}

pub fn run() {
    // --- Dev Mode: Use external Python process started by dev-server.js ---
    #[cfg(debug_assertions)]
    let port: u16 = {
        let port_str = std::env::var("UNISONO_DEV_PORT").unwrap_or_else(|_| "8001".to_string());
        port_str.parse::<u16>().unwrap_or(8001)
    };

    // --- Production Mode: Pick a free port for the sidecar ---
    #[cfg(not(debug_assertions))]
    let port: u16 = portpicker::pick_unused_port().unwrap_or_else(|| {
        show_error(None, "Port-Fehler", "Kein freier Port verfuegbar. Bitte andere Programme schliessen und erneut versuchen.");
        std::process::exit(1);
    });

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState {
            child: Mutex::new(None),
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            // Resolve app data directory (production uses it for DB + logs)
            let data_dir = handle
                .path()
                .app_data_dir()
                .ok();

            if let Some(ref dir) = data_dir {
                std::fs::create_dir_all(dir).ok();
            }

            // --- Production only: Spawn the sidecar ---
            #[cfg(not(debug_assertions))]
            {
                let data_dir_str = data_dir
                    .as_ref()
                    .map(|d| d.to_string_lossy().to_string())
                    .unwrap_or_else(|| {
                        show_error(None, "Fehler", "App-Datenverzeichnis konnte nicht ermittelt werden.");
                        std::process::exit(1);
                    });
                let port_str = port.to_string();

                let shell = handle.shell();
                let sidecar_cmd = match shell.sidecar("unisono-server") {
                    Ok(cmd) => cmd,
                    Err(e) => {
                        show_error(
                            data_dir.as_deref(),
                            "Sidecar nicht gefunden",
                            &format!(
                                "Die Backend-Binary (unisono-server) wurde nicht gefunden.\n\n\
                                 Bitte Unisono neu installieren.\n\nDetails: {}",
                                e
                            ),
                        );
                        std::process::exit(1);
                    }
                };

                let (mut rx, child) = match sidecar_cmd
                    .args(["--data-dir", &data_dir_str, "--port", &port_str])
                    .spawn()
                {
                    Ok(result) => result,
                    Err(e) => {
                        show_error(
                            data_dir.as_deref(),
                            "Backend-Start fehlgeschlagen",
                            &format!(
                                "Das Backend konnte nicht gestartet werden.\n\nDetails: {}",
                                e
                            ),
                        );
                        std::process::exit(1);
                    }
                };

                // Store child process handle for shutdown
                let state = handle.state::<SidecarState>();
                *state.child.lock().unwrap() = Some(child);

                // Log sidecar output
                tauri::async_runtime::spawn(async move {
                    use tauri_plugin_shell::process::CommandEvent;
                    while let Some(event) = rx.recv().await {
                        match event {
                            CommandEvent::Stdout(line) => {
                                let s = String::from_utf8_lossy(&line);
                                eprintln!("[sidecar stdout] {}", s);
                            }
                            CommandEvent::Stderr(line) => {
                                let s = String::from_utf8_lossy(&line);
                                eprintln!("[sidecar stderr] {}", s);
                            }
                            CommandEvent::Terminated(payload) => {
                                eprintln!("[sidecar] terminated: {:?}", payload);
                                break;
                            }
                            _ => {}
                        }
                    }
                });
            }

            // --- Health check: wait for backend to be ready (both modes) ---
            let health_url = format!("http://127.0.0.1:{}/api/auth/status", port);
            let mut ready = false;
            for _ in 0..150 {
                // 150 x 200ms = 30 seconds max
                std::thread::sleep(Duration::from_millis(200));
                if let Ok(resp) = reqwest::blocking::get(&health_url) {
                    if resp.status().is_success() {
                        ready = true;
                        break;
                    }
                }
            }

            if !ready {
                let msg = format!(
                    "Das Backend antwortet nicht innerhalb von 30 Sekunden (Port {}).\n\n\
                     Bitte pruefen Sie ob ein anderes Programm den Port blockiert.",
                    port
                );
                #[cfg(not(debug_assertions))]
                show_error(data_dir.as_deref(), "Backend-Timeout", &msg);
                eprintln!("WARNING: {}", msg);
            }

            // --- Inject the port into the frontend (both modes) ---
            if let Some(main_window) = app.get_webview_window("main") {
                let js = format!("window.__UNISONO_PORT__ = {};", port);
                if let Err(e) = main_window.eval(&js) {
                    eprintln!("WARNING: Port-Injection fehlgeschlagen: {}", e);
                }
            } else {
                eprintln!("WARNING: Hauptfenster nicht gefunden fuer Port-Injection");
            }

            eprintln!("Unisono backend running on port {}", port);

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                // Inject shutdown flag before window closes — prevents
                // the frontend from reloading into "Backend wird gestartet..."
                if let Some(wv) = window.get_webview_window("main") {
                    let _ = wv.eval("window.__UNISONO_SHUTTING_DOWN__ = true");
                }
            }
            if let tauri::WindowEvent::Destroyed = event {
                // Production: Graceful shutdown of sidecar via STDIN
                // Dev: No sidecar to kill (dev-server.js handles Python)
                let state = window.state::<SidecarState>();
                let mut guard = state.child.lock().unwrap();
                if let Some(mut child) = guard.take() {
                    let _ = child.write("SHUTDOWN\n".as_bytes());
                    std::thread::sleep(Duration::from_millis(500));
                    let _ = child.kill();
                }
                drop(guard);
            }
        })
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            eprintln!("Unisono konnte nicht gestartet werden: {}", e);
        });
}
