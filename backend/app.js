require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// 👉 Serve uploaded images
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"))
);

// Routes
const routes = require("./routes/routes");
app.use("/", routes);

// Root route
app.get("/", (req, res) => {
  res.send("YoChat API is running!");
});

// --- Socket.IO Setup ---
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Socket event handling
require("./sockets/chat")(io);

server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});