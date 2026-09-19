# Run this in a second terminal:
# python tracker-server.py
#
# It accepts the demo requests at http://localhost:5501/track and /collect.
# The server does not save the posted values.

from http.server import BaseHTTPRequestHandler, HTTPServer

class Handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        length = int(self.headers.get("Content-Length", "0"))
        _ = self.rfile.read(length)  # read, but do not store

        if self.path == "/track":
            print("ConsentGap demo tracker received a tracking-only request")
        elif self.path == "/collect":
            print("ConsentGap demo tracker received a data-bearing request")
        else:
            print("ConsentGap demo tracker received a request")

        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def log_message(self, format, *args):
        return

HTTPServer(("localhost", 5501), Handler).serve_forever()
