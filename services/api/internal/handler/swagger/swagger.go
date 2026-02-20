package swagger

import (
	"fmt"
	"net/http"
	"os"
	"path"
	"path/filepath"
	"strings"
)

// Handler serves the Swagger UI HTML page.
type Handler struct {
	specURL string
}

// NewHandler creates a new Swagger UI handler.
func NewHandler(specURL string) *Handler {
	return &Handler{specURL: specURL}
}

// ServeHTTP implements the http.Handler interface.
func (h *Handler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/docs/v1" && r.URL.Path != "/docs/v1/" {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>SchoolERP API Documentation</title>
    <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
    <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5/favicon-32x32.png" sizes="32x32">
    <style>
      html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
      *, *:before, *:after { box-sizing: inherit; }
      body { margin: 0; background: #fafafa; }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "%s",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      });
      window.ui = ui;
    };
    </script>
  </body>
</html>
`, h.specURL)
}

// FS returns an http.Handler for serving the openapi folder.
func FS(dir string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Prevent directory listing
		if strings.HasSuffix(r.URL.Path, "/") {
			http.NotFound(w, r)
			return
		}
		http.StripPrefix("/docs/v1/openapi/", http.FileServer(http.Dir(dir))).ServeHTTP(w, r)
	})
}

// StorybookFS serves a built Storybook static directory.
// It falls back to index.html for non-file paths so client-side navigation works.
func StorybookFS(dir string) http.Handler {
	fileServer := http.FileServer(http.Dir(dir))

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestPath := path.Clean("/" + strings.TrimSpace(r.URL.Path))
		if requestPath == "/" || requestPath == "." {
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/index.html"
			fileServer.ServeHTTP(w, r2)
			return
		}

		relative := strings.TrimPrefix(requestPath, "/")
		fullPath := filepath.Join(dir, relative)

		if info, err := os.Stat(fullPath); err == nil {
			// Serve existing files and directories normally.
			if info.IsDir() {
				r2 := r.Clone(r.Context())
				r2.URL.Path = path.Join(requestPath, "index.html")
				fileServer.ServeHTTP(w, r2)
				return
			}
			fileServer.ServeHTTP(w, r)
			return
		}

		// If path looks like an app route (no extension), serve Storybook index.
		if !strings.Contains(path.Base(requestPath), ".") {
			r2 := r.Clone(r.Context())
			r2.URL.Path = "/index.html"
			fileServer.ServeHTTP(w, r2)
			return
		}

		http.NotFound(w, r)
	})
}
