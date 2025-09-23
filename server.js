const { createServer: createHttpsServer } = require("https");
const { createServer: createHttpServer } = require("http");
const { parse } = require("url");
const next = require("next");
const fs = require("fs");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// SSL certificates (generated with mkcert or similar)
const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "aahaar-key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "aahaar.pem")),
};

app.prepare().then(() => {
  // HTTP server (redirect only)
  const httpServer = createHttpServer((req, res) => {
    res.writeHead(301, {
      Location: "https://" + req.headers.host + req.url,
    });
    res.end();
  });

  httpServer.listen(80, "0.0.0.0", (err) => {
    if (err) throw err;
    console.log("> HTTP Redirecting to HTTPS on: http://aahaar");
  });

  // HTTPS server (port 443)
  const httpsServer = createHttpsServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  httpsServer.listen(443, "0.0.0.0", (err) => {
    if (err) throw err;
    console.log("> HTTPS Ready on: https://aahaar");
  });
});
