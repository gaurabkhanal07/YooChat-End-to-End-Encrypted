const { encryptHill, decryptHill } = require("../Cryptography/Hill_Cipher");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/model");
const hillKey = process.env.HILL_KEY;
if (!hillKey) {
  throw new Error("HILL_KEY is not defined in environment variables");
}

// -------------------- AUTH --------------------

const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Missing username, email, or password" });
    }

    const existingUser = await userModel.findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let profileImagePath = null;
    // If a file is uploaded, store its path, otherwise leave it as null.
    if (req.file) {
      profileImagePath = req.file.path;
    }

    const user = await userModel.createUser(
      username,
      email,
      hashedPassword,
      profileImagePath
    );
    res
      .status(201)
      .json({ message: "User registered successfully", user });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Missing email or password" });
    }

    const user = await userModel.findUserByEmail(email);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { user_id: user.user_id },
      process.env.secret_key,
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      userId: user.user_id,
      username: user.username,
      profileImage: user.profile_image, // This will be null if no image was uploaded
      userEmail: user.email,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- USER --------------------

const getUserByUsername = async (req, res) => {
  try {
    const { username } = req.params;
    const user = await userModel.findUserByUsername(username);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- FRIENDSHIP --------------------

const sendFriendRequest = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ message: "Missing receiver_id" });
    }

    if (sender_id === receiver_id) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
    }

    const existing = await userModel.checkFriendshipExists(sender_id, receiver_id);
    if (existing) {
      return res
        .status(400)
        .json({ message: "Friendship already exists or pending" });
    }

    await userModel.createFriendRequest(sender_id, receiver_id);
    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (err) {
    console.error("Error sending friend request:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const acceptFriendRequest = async (req, res) => {
  try {
    const receiver_id = req.user.user_id;
    const { sender_id } = req.body;

    if (!sender_id) {
      return res.status(400).json({ message: "Missing sender_id" });
    }

    const pending = await userModel.checkPendingFriendRequest(sender_id, receiver_id);
    if (!pending) {
      return res.status(400).json({ message: "No pending friend request found" });
    }

    await userModel.acceptFriendRequest(sender_id, receiver_id);
    res.status(200).json({ message: "Friend request accepted" });
  } catch (err) {
    console.error("Error accepting friend request:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const declineFriendRequest = async (req, res) => {
  try {
    const receiver_id = req.user.user_id;
    const { sender_id } = req.body;
    if (!sender_id) {
      return res.status(400).json({ message: "Missing sender_id" });
    }

    const pending = await userModel.checkPendingFriendRequest(sender_id, receiver_id);
    if (!pending) {
      return res.status(400).json({
        message: "No pending friend request found to decline",
      });
    }

    await userModel.declineFriendRequest(sender_id, receiver_id);
    res
      .status(200)
      .json({ message: "Friend request declined successfully" });
  } catch (err) {
    console.error("Error declining friend request:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const listFriends = async (req, res) => {
  try {
    const { username } = req.params;
    const user_id = await userModel.findUserIdByUsername(username);

    if (!user_id) {
      return res.status(404).json({ message: "User not found" });
    }

    const friends = await userModel.getFriendList(user_id);
    res.status(200).json({
      message: friends.length > 0 ? "Friends list fetched" : "No friends found",
      friends,
    });
  } catch (err) {
    console.error("Error listing friends:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
};

const listPendingRequests = async (req, res) => {
  try {
    const receiver_id = req.user.user_id;
    const pending = await userModel.getPendingFriendRequests(receiver_id);
    res.status(200).json({ pending_requests: pending });
  } catch (err) {
    console.error("Error listing pending friend requests:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getSentRequests = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const sent = await userModel.getSentFriendRequests(sender_id);
    res.status(200).json({ sent_requests: sent });
  } catch (err) {
    console.error("Error fetching sent friend requests:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const cancelFriendRequest = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id } = req.body;

    if (!receiver_id) {
      return res.status(400).json({ message: "Missing receiver_id" });
    }

    const pending = await userModel.checkPendingFriendRequest(sender_id, receiver_id);
    if (!pending) {
      return res
        .status(400)
        .json({ message: "No pending friend request found to cancel" });
    }

    await userModel.cancelFriendRequest(sender_id, receiver_id);
    res
      .status(200)
      .json({ message: "Friend request cancelled successfully" });
  } catch (err) {
    console.error("Error cancelling friend request:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const unfriend = async (req, res) => {
  try {
    const user1_id = req.user.user_id;
    const { user2_id } = req.body;
    console.log(`Unfriend request: user1_id=${user1_id}, user2_id=${user2_id}`);
    if (!user2_id) {
      return res.status(400).json({ message: "Missing user2_id" });
    }
    const existing = await userModel.checkFriendshipExists(user1_id, user2_id);
    if (!existing) {
      return res.status(400).json({ message: "No friendship found to unfriend" });
    }
    await userModel.unfriend(user1_id, user2_id);
    res.status(200).json({ message: "Unfriended successfully" });
  } catch (err) {
    console.error("Error unfriending:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
// -------------------- MESSAGING --------------------

const sendMessage = async (req, res) => {
  try {
    const sender_id = req.user.user_id;
    const { receiver_id, content, is_media } = req.body;

    if (!receiver_id || !content) {
      return res.status(400).json({ message: "Missing receiver_id or content" });
    }

    const friendship = await userModel.checkFriendshipExists(sender_id, receiver_id);
    if (!friendship) {
      return res.status(403).json({ message: "You are not friends with this user" });
    }

    const encryptedMessage = encryptHill(content, hillKey);
    await userModel.sendMessage(sender_id, receiver_id, encryptedMessage, is_media);
    res.status(200).json({ message: "Message sent successfully" });
  } catch (err) {
    console.error("Error sending message:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

const getConversation = async (req, res) => {
  try {
    const user1_id = req.user.user_id;
    const friend_id = parseInt(req.params.friend_id);

    const friendship = await userModel.checkFriendshipExists(user1_id, friend_id);
    if (!friendship) {
      return res.status(403).json({ message: "You are not friends with this user" });
    }

    const conversation = await userModel.getConversation(user1_id, friend_id);
    const decryptedConversation = conversation.map(msg => ({
      message_id: msg.message_id,
      sender_id: msg.sender_id,
      sender_name: msg.sender_name,
      receiver_id: msg.receiver_id,
      content: decryptHill(msg.content, hillKey),
      timestamp: msg.message_time,
    }));

    res.status(200).json({ conversation: decryptedConversation });
  } catch (err) {
    console.error("Error getting conversation:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// -------------------- EXPORTS --------------------

module.exports = {
  register,
  login,
  getUserByUsername,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  listFriends,
  listPendingRequests,
  getSentRequests,
  cancelFriendRequest,
  unfriend,
  sendMessage,
  getConversation,
};