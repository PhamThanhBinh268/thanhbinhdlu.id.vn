const net = require("net");
const port = 8080;
const server = net.createServer();
server.on("error", (err) => {
  console.error("[NET SERVER ERROR]", err);
});
server.listen(port, () => {
  console.log("Raw net server listening on", port);
});
setTimeout(() => {
  console.log("Still alive after 5s");
}, 5000);
