import http.server
import socketserver
import os

ZIP_PATH = "/workspace/yuzhou-crystal-inquiry.zip"
PORT = 8000


class ZipHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            with open(ZIP_PATH, "rb") as f:
                data = f.read()
        except FileNotFoundError:
            self.send_error(404, "zip not found")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/zip")
        self.send_header(
            "Content-Disposition",
            'attachment; filename="yuzhou-crystal-inquiry.zip"',
        )
        self.send_header("Content-Length", str(len(data)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *args):
        pass


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("0.0.0.0", PORT), ZipHandler) as httpd:
        httpd.serve_forever()
