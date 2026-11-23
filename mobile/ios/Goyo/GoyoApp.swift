import AVFoundation
import ObjectiveC
import SwiftUI
import WebKit

@main
struct GoyoApp: App {
    init() {
        configureAudioSession()
    }

    var body: some Scene {
        WindowGroup {
            GoyoRootView()
                .ignoresSafeArea(.container, edges: .bottom)
        }
    }

    private func configureAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
            try session.setActive(true)
        } catch {
            print("Failed to configure AVAudioSession: \(error)")
        }
    }
}

struct GoyoRootView: View {
    @State private var mode: AppMode = .nativeMobile

    enum AppMode: String, CaseIterable {
        case nativeMobile = "Mobile UI"
        case webApp = "Web UI"

        var path: String {
            switch self {
            case .nativeMobile: return "/mobile"
            case .webApp: return "/"
            }
        }
    }

    var body: some View {
        VStack(spacing: 0) {
            GoyoWebContainer(path: mode.path)
        }
    }
}

final class GoyoBundleSchemeHandler: NSObject, WKURLSchemeHandler {
    private let wwwRoot: URL? = Bundle.main.resourceURL?.appendingPathComponent("www")

    func webView(_ webView: WKWebView, start urlSchemeTask: WKURLSchemeTask) {
        guard let root = wwwRoot, let requestURL = urlSchemeTask.request.url else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
            return
        }

        var relativePath = requestURL.path
        if relativePath.hasPrefix("/") {
            relativePath.removeFirst()
        }
        if relativePath.isEmpty {
            relativePath = "index.html"
        }

        var targetURL = root.appendingPathComponent(relativePath)
        let fm = FileManager.default
        var isDir: ObjCBool = false

        if !fm.fileExists(atPath: targetURL.path, isDirectory: &isDir) || isDir.boolValue {
            // SPA fallback for routes such as /mobile — never for audio: a
            // missing clip must not come back as index.html served with an
            // audio/mpeg content type (the player would try to decode HTML).
            if relativePath.hasPrefix("audio/") {
                urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
                return
            }
            targetURL = root.appendingPathComponent("index.html")
        }

        guard let data = try? Data(contentsOf: targetURL) else {
            urlSchemeTask.didFailWithError(URLError(.fileDoesNotExist))
            return
        }

        let mime = Self.mimeType(for: targetURL.pathExtension)
        let headers: [String: String] = [
            "Content-Type": mime,
            "Content-Length": "\(data.count)",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-cache"
        ]

        if let response = HTTPURLResponse(
            url: requestURL,
            statusCode: 200,
            httpVersion: "HTTP/1.1",
            headerFields: headers
        ) {
            urlSchemeTask.didReceive(response)
        }
        urlSchemeTask.didReceive(data)
        urlSchemeTask.didFinish()
    }

    func webView(_ webView: WKWebView, stop urlSchemeTask: WKURLSchemeTask) {}

    private static func mimeType(for ext: String) -> String {
        switch ext.lowercased() {
        case "html": return "text/html; charset=utf-8"
        case "js", "mjs": return "application/javascript; charset=utf-8"
        case "css": return "text/css; charset=utf-8"
        case "json", "webmanifest": return "application/json; charset=utf-8"
        case "mp3": return "audio/mpeg"
        case "png": return "image/png"
        case "svg": return "image/svg+xml"
        case "ico": return "image/x-icon"
        default: return "application/octet-stream"
        }
    }
}

// Stable address used as the associated-object key that carries each
// player's play token (Swift cannot add stored properties to AVAudioPlayer).
private var goyoPlayTokenKey: UInt8 = 0

final class GoyoAudioBridge: NSObject, WKScriptMessageHandler, AVAudioPlayerDelegate {
    weak var webView: WKWebView?
    var loadedPath: String = ""
    private var player: AVAudioPlayer?
    private let wwwRoot: URL? = Bundle.main.resourceURL?.appendingPathComponent("www")

    func userContentController(
        _ userContentController: WKUserContentController,
        didReceive message: WKScriptMessage
    ) {
        guard let body = message.body as? [String: Any],
              let action = body["action"] as? String else { return }

        if action == "stop" {
            player?.stop()
            player = nil
            return
        }

        guard action == "play",
              let token = body["token"] as? Int,
              let rawPath = body["path"] as? String,
              let root = wwwRoot else { return }

        player?.stop()

        var cleanPath = rawPath
        if let qIndex = cleanPath.firstIndex(of: "?") {
            cleanPath = String(cleanPath[..<qIndex])
        }
        if cleanPath.hasPrefix("/") {
            cleanPath.removeFirst()
        }

        let fileURL = root.appendingPathComponent(cleanPath)
        do {
            try AVAudioSession.sharedInstance().setActive(true)
            let audioPlayer = try AVAudioPlayer(contentsOf: fileURL)
            audioPlayer.delegate = self
            // The token rides on the player instance, so a late delegate
            // callback from a superseded player settles its own promise and
            // never the newer clip's.
            objc_setAssociatedObject(
                audioPlayer,
                &goyoPlayTokenKey,
                token,
                .OBJC_ASSOCIATION_RETAIN_NONATOMIC
            )
            // Match the web player's slowed narration rate (client/src/lib/
            // audioElement.ts sets playbackRate 0.9).
            audioPlayer.enableRate = true
            audioPlayer.rate = 0.9
            audioPlayer.prepareToPlay()
            audioPlayer.play()
            self.player = audioPlayer
        } catch {
            notifyWeb(token: token, ok: false)
        }
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        guard let token = playToken(for: player) else { return }
        notifyWeb(token: token, ok: flag)
    }

    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        guard let token = playToken(for: player) else { return }
        notifyWeb(token: token, ok: false)
    }

    private func playToken(for player: AVAudioPlayer) -> Int? {
        objc_getAssociatedObject(player, &goyoPlayTokenKey) as? Int
    }

    private func notifyWeb(token: Int, ok: Bool) {
        let js = "window.__goyoNativeAudioDone && window.__goyoNativeAudioDone(\(token), \(ok ? "true" : "false"));"
        DispatchQueue.main.async { [weak self] in
            self?.webView?.evaluateJavaScript(js, completionHandler: nil)
        }
    }
}

struct GoyoWebContainer: UIViewRepresentable {
    let path: String

    func makeCoordinator() -> GoyoAudioBridge {
        GoyoAudioBridge()
    }

    func makeUIView(context: Context) -> WKWebView {
        let config = WKWebViewConfiguration()
        config.setURLSchemeHandler(GoyoBundleSchemeHandler(), forURLScheme: "goyo")
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []

        let bridgeScript = """
        (function() {
          var seq = 0;
          var pending = {};
          function settle(token, ok) {
            var entry = pending[token];
            if (!entry) return;
            delete pending[token];
            if (ok) {
              entry.el.dispatchEvent(new Event('ended'));
              entry.resolve();
            } else {
              entry.el.dispatchEvent(new Event('error'));
              entry.reject(new Error('Native audio failed'));
            }
          }
          window.__goyoNativeAudioDone = function(token, ok) {
            settle(token, ok);
          };
          var origPlay = HTMLAudioElement.prototype.play;
          var origPause = HTMLAudioElement.prototype.pause;
          HTMLAudioElement.prototype.play = function() {
            var src = this.currentSrc || this.src || '';
            var idx = src.indexOf('/audio/');
            if (idx !== -1 && window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.goyoAudio) {
              var audioPath = src.slice(idx);
              var token = ++seq;
              var el = this;
              this.__goyoToken = token;
              // A new clip replaces any pending one: settle it as ended (the
              // old clip was replaced, it did not fail) so no promise dangles.
              Object.keys(pending).forEach(function(oldToken) {
                settle(Number(oldToken), true);
              });
              return new Promise(function(resolve, reject) {
                pending[token] = { el: el, resolve: resolve, reject: reject };
                window.webkit.messageHandlers.goyoAudio.postMessage({
                  action: 'play',
                  token: token,
                  path: audioPath
                });
              });
            }
            return origPlay.apply(this, arguments);
          };
          HTMLAudioElement.prototype.pause = function() {
            if (this.__goyoToken && pending[this.__goyoToken]) {
              // Settle the pending promise rather than deleting the entry:
              // the caller awaiting play() must not hang on a pause/stop.
              settle(this.__goyoToken, true);
              if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.goyoAudio) {
                window.webkit.messageHandlers.goyoAudio.postMessage({ action: 'stop' });
              }
            }
            return origPause.apply(this, arguments);
          };
        })();
        """

        let userScript = WKUserScript(
            source: bridgeScript,
            injectionTime: .atDocumentStart,
            forMainFrameOnly: false
        )
        config.userContentController.addUserScript(userScript)
        config.userContentController.add(context.coordinator, name: "goyoAudio")

        let webView = WKWebView(frame: .zero, configuration: config)
        webView.scrollView.contentInsetAdjustmentBehavior = .never
        webView.isOpaque = true
        webView.backgroundColor = .systemBackground
        webView.scrollView.backgroundColor = .systemBackground
        context.coordinator.webView = webView

        if let url = URL(string: "goyo://app\(path)") {
            context.coordinator.loadedPath = path
            webView.load(URLRequest(url: url))
        }
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {
        guard context.coordinator.loadedPath != path,
              let url = URL(string: "goyo://app\(path)") else { return }
        context.coordinator.loadedPath = path
        webView.load(URLRequest(url: url))
    }
}
