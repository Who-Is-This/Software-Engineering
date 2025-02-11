from http.server import HTTPServer, SimpleHTTPRequestHandler
import json

class CORSRequestHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_POST(self):
        if self.path == "/save-routes":
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            try:
                route_nodes = json.loads(post_data)
                
                # Save data to a file
                with open("routesCoordinates.json", "w") as file:
                    json.dump(route_nodes, file, indent=4)
                
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(b"Routes successfully saved!")
            except json.JSONDecodeError:
                self.send_response(400)
                self.end_headers()
                self.wfile.write(b"Invalid JSON data!")


if __name__ == '__main__':
    port = 8000
    print(f"serving on {port}...")
    httpd = HTTPServer(('localhost', port), CORSRequestHandler)
    httpd.serve_forever()

