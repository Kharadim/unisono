use std::sync::Mutex;
use std::time::Duration;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;
use tauri_plugin_shell::process::CommandChild;

struct SidecarState {
    child: Mutex<Option<CommandChild>>,
}

pub fn run() {
    // Pick a free port for the backend
    let port = portpicker::pick_unused_port().expect("No free port available");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(SidecarState {
            child: Mutex::new(None),
        })
        .setup(move |app| {
            let handle = app.handle().clone();

            // Resolve app data directory
            let data_dir = handle
                .path()
                .app_data_dir()
                .expect("Failed to resolve app data dir");

            // Ensure data directory exists
            std::fs::create_dir_all(&data_dir).ok();

            let data_dir_str = data_dir.to_string_lossy().to_string();
            let port_str = port.to_string();

            // Spawn the sidecar
            let shell = handle.shell();
            let (mut rx, child) = shell
                .sidecar("unisono-server")
                .expect("Failed to find sidecar binary")
                .args(["--data-dir", &data_dir_str, "--port", &port_str])
                .spawn()
                .expect("Failed to spawn sidecar");

            // Store child process handle for shutdown
            let state = handle.state::<SidecarState>();
            *state.child.lock().unwrap() = Some(child);

            // Log sidecar output in debug mode
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

            // Health check: wait for backend to be ready
            let health_url = format!("http://localhost:{}/api/auth/status", port);
            let mut ready = false;
            for _ in 0..150 {
                // 150 × 200ms = 30 seconds max
                std::thread::sleep(Duration::from_millis(200));
                if let Ok(resp) = reqwest::blocking::get(&health_url) {
                    if resp.status().is_success() {
                        ready = true;
                        break;
                    }
                }
            }

            if !ready {
                eprintln!("WARNING: Backend did not become ready within 30 seconds");
            }

            // Inject the port into the frontend
            let main_window = app.get_webview_window("main").expect("No main window");
            let js = format!("window.__UNISONO_PORT__ = {};", port);
            main_window
                .eval(&js)
                .expect("Failed to inject port into frontend");

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
                // Graceful shutdown: send SHUTDOWN to sidecar STDIN
                let state = window.state::<SidecarState>();
                let mut guard = state.child.lock().unwrap();
                if let Some(mut child) = guard.take() {
                    // Try graceful shutdown via STDIN
                    let _ = child.write("SHUTDOWN\n".as_bytes());
                    // Give it a moment, then force kill
                    std::thread::sleep(Duration::from_millis(500));
                    let _ = child.kill();
                }
                drop(guard);
            }
        })
        .run(tauri::generate_context!())
        .expect("Error while running Unisono");
}
