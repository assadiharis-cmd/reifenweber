const http = require("http");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.url === "/" || req.url === "/health") {
    res.statusCode = 200;
    res.end(JSON.stringify({
      status: "ok",
      service: "reifen-weber-api",
      message: "Backend läuft"
    }));
    return;
  }

  res.statusCode = 404;
  res.end(JSON.stringify({
    error: "Route nicht gefunden"
  }));
});

server.listen(PORT, () => {
  console.log(`Reifen Weber API läuft auf Port ${PORT}`);
});
