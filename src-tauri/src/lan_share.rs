use std::io::{Read, Write};
use std::net::{IpAddr, Ipv4Addr, TcpListener, TcpStream, UdpSocket};
use std::sync::{atomic::{AtomicBool, Ordering}, Arc, Mutex};
use std::time::Duration;

#[derive(Default)]
pub struct ShareState(Mutex<Option<Arc<AtomicBool>>>);

fn lan_address() -> Result<Ipv4Addr, String> {
    let socket = UdpSocket::bind((Ipv4Addr::UNSPECIFIED, 0)).map_err(|e| e.to_string())?;
    for destination in ["1.1.1.1:80", "192.168.1.1:80", "10.0.0.1:80"] {
        if socket.connect(destination).is_ok() {
            if let Ok(IpAddr::V4(address)) = socket.local_addr().map(|a| a.ip()) {
                if !address.is_loopback() && !address.is_link_local() { return Ok(address); }
            }
        }
    }
    Err("未找到局域网地址，请连接 Wi-Fi 或有线网络".into())
}

fn respond(mut stream: TcpStream, token: &str, html: &[u8]) {
    let _ = stream.set_read_timeout(Some(Duration::from_secs(3)));
    let _ = stream.set_write_timeout(Some(Duration::from_secs(3)));
    let mut request = [0u8; 4096];
    let Ok(size) = stream.read(&mut request) else { return };
    let first_line = String::from_utf8_lossy(&request[..size]);
    let valid_path = format!("/{token}");
    let method = first_line.starts_with(&format!("GET {valid_path} HTTP/"))
        || first_line.starts_with(&format!("HEAD {valid_path} HTTP/"));
    let body: &[u8] = if method { html } else { b"Not found" };
    let status = if method { "200 OK" } else { "404 Not Found" };
    let header = format!("HTTP/1.1 {status}\r\nContent-Type: {}\r\nContent-Length: {}\r\nCache-Control: no-store\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n", if method { "text/html; charset=utf-8" } else { "text/plain; charset=utf-8" }, body.len());
    let _ = stream.write_all(header.as_bytes());
    if !first_line.starts_with("HEAD ") { let _ = stream.write_all(body); }
}

#[tauri::command]
pub fn start_lan_share(state: tauri::State<'_, ShareState>, html: String, token: String) -> Result<String, String> {
    if token.len() != 64 || !token.bytes().all(|c| c.is_ascii_hexdigit()) { return Err("分享地址无效".into()); }
    if html.len() > 32 * 1024 * 1024 { return Err("文件或图片过大，无法生成分享页面".into()); }
    let address = lan_address()?;
    let listener = TcpListener::bind((Ipv4Addr::UNSPECIFIED, 0)).map_err(|e| format!("无法启动局域网分享：{e}"))?;
    listener.set_nonblocking(true).map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    let active = Arc::new(AtomicBool::new(true));
    if let Some(previous) = state.0.lock().map_err(|e| e.to_string())?.replace(active.clone()) {
        previous.store(false, Ordering::Relaxed);
    }
    let url = format!("http://{address}:{port}/{token}");
    std::thread::spawn(move || {
        let bytes = html.into_bytes();
        while active.load(Ordering::Relaxed) {
            match listener.accept() {
                Ok((stream, _)) => respond(stream, &token, &bytes),
                Err(e) if e.kind() == std::io::ErrorKind::WouldBlock => std::thread::sleep(Duration::from_millis(50)),
                Err(_) => break,
            }
        }
    });
    Ok(url)
}

#[tauri::command]
pub fn stop_lan_share(state: tauri::State<'_, ShareState>) {
    if let Ok(mut current) = state.0.lock() {
        if let Some(active) = current.take() { active.store(false, Ordering::Relaxed); }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn request(path: &str) -> String {
        let listener = TcpListener::bind("127.0.0.1:0").unwrap();
        let address = listener.local_addr().unwrap();
        let worker = std::thread::spawn(move || {
            let (stream, _) = listener.accept().unwrap();
            respond(stream, "secret", b"<h1>Document</h1>");
        });
        let mut client = TcpStream::connect(address).unwrap();
        client.write_all(format!("GET {path} HTTP/1.1\r\nHost: localhost\r\n\r\n").as_bytes()).unwrap();
        let mut response = String::new();
        client.read_to_string(&mut response).unwrap();
        worker.join().unwrap();
        response
    }

    #[test]
    fn only_token_url_serves_document() {
        let allowed = request("/secret");
        assert!(allowed.starts_with("HTTP/1.1 200 OK"));
        assert!(allowed.ends_with("<h1>Document</h1>"));
        assert!(request("/other").starts_with("HTTP/1.1 404 Not Found"));
    }
}
