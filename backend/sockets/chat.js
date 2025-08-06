const jwt = require("jsonwebtoken");
const { encryptHill } = require("../Cryptography/Hill_Cipher");
const userModel = require("../models/model");

module.exports = (io) => {
  // Authenticate each socket connection via the token provided in handshake auth.
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication failed: No token"));

    try {
      const decoded = jwt.verify(token, process.env.secret_key);
      socket.user = decoded;
      next();
    } catch (err) {
      return next(new Error("Authentication failed: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.user_id;
    console.log(`🔌 User connected: ${userId}`);
    // Join a room specific to this user so you can target messages easily.
    socket.join(`user_${userId}`);

    socket.on("send_message", async ({ to, content, is_media }) => {
      try {
        if (!to || !content) return;

        // Check if the sender and receiver are friends.
        const isFriend = await userModel.checkFriendshipExists(userId, to);
        if (!isFriend) {
          console.warn(`Blocked message: ${userId} is not friends with ${to}`);
          return; // Abort if they are not friends.
        }

        // Encrypt the message before saving.
        const encryptedContent = encryptHill(content, process.env.HILL_KEY);
        await userModel.sendMessage(userId, to, encryptedContent, is_media);

        // Get the sender's public info to include in the message.
        const sender = await userModel.findUserById(userId);

        const message = {
          sender_id: userId,
          sender_name: sender.username,
          content,
          is_media,
          timestamp: new Date().toISOString(),
        };

        // Emit the message to both recipient and sender rooms.
        io.to(`user_${to}`).emit("receive_message", message);
        io.to(`user_${userId}`).emit("receive_message", message);
      } catch (err) {
        console.error("Error sending message:", err.message);
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${userId}`);
    });
  });
};