const express = require("express");
const app = express();
app.get("/", (req, res) => res.json({ ok: true, time: Date.now() }));
const port = process.env.PORT || 8080;
app.listen(port, () => console.log("Test server listening on", port));
