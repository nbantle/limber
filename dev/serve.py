# Local dev server with caching disabled.
import functools, http.server, sys
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
root = sys.argv[1]
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), functools.partial(H, directory=root)).serve_forever()
