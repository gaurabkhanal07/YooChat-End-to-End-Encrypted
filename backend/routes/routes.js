const express = require("express");
const router = express.Router();
const multer = require("multer");
const controller = require("../controllers/controller");
const verifyToken = require("../verifytoken");

// Configure Multer storage. Files will be saved in the "uploads/" directory.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },  
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Public routes
router.post("/register", upload.single("profileImage"), controller.register);
router.post("/login", controller.login);
router.get("/users/:username", controller.getUserByUsername);

// Friendship routes (protected)
router.post("/friendship/sendRequest", verifyToken, controller.sendFriendRequest);
router.post("/friendship/acceptRequest", verifyToken, controller.acceptFriendRequest);
router.get("/friendship/list/:username", verifyToken, controller.listFriends);
router.get("/friendship/pendingRequests", verifyToken, controller.listPendingRequests);
router.get("/friendship/sentRequests", verifyToken, controller.getSentRequests);
router.post("/friendship/cancelRequest", verifyToken, controller.cancelFriendRequest);
router.post("/friendship/unfriend", verifyToken, controller.unfriend);
router.post("/friendship/declineRequest", verifyToken, controller.declineFriendRequest);

// Messaging routes (protected)
router.post("/message/send", verifyToken, controller.sendMessage);
router.get("/message/conversation/:friend_id", verifyToken, controller.getConversation);

module.exports = router;