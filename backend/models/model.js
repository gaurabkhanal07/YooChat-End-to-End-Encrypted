const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.db_user,
  password: process.env.db_password,
  host: process.env.db_host,
  port: process.env.db_port,
  database: process.env.db_name,
});

// -------------------- User model functions --------------------

/**
 * Finds a user using the email.
 */
const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0];
};

/**
 * Creates a new user. Supports optional profile image.
 */
const createUser = async (username, email, hashedPassword, profileImagePath = null) => {
  const result = await pool.query(
    "INSERT INTO users (username, email, password, profile_image) VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, profile_image",
    [username, email, hashedPassword, profileImagePath]
  );
  return result.rows[0];
};

/**
 * Finds a user by username, including profile image.
 */
const findUserByUsername = async (username) => {
  const result = await pool.query(
    "SELECT user_id, username, email, profile_image FROM users WHERE username = $1",
    [username]
  );
  return result.rows[0];
};

/**
 * Gets the user ID from username.
 */
const findUserIdByUsername = async (username) => {
  const result = await pool.query("SELECT user_id FROM users WHERE username = $1", [username]);
  return result.rows[0]?.user_id;
};

// -------------------- Friendship model functions --------------------

/**
 * Checks if a friendship or pending request exists.
 */
const checkFriendshipExists = async (user1_id, user2_id) => {
  const result = await pool.query(
    `SELECT * FROM friendship 
     WHERE ((user1_id = $1 AND user2_id = $2) 
         OR (user1_id = $2 AND user2_id = $1)) 
       AND status = 'accepted'`,
    [user1_id, user2_id]
  );
  return result.rows.length > 0;
};

/**
 * Creates a new friend request.
 */
const createFriendRequest = async (user1_id, user2_id) => {
  await pool.query(
    "INSERT INTO friendship (user1_id, user2_id, status) VALUES ($1, $2, 'pending')",
    [user1_id, user2_id]
  );
};

/**
 * Checks if a pending request exists from sender to receiver.
 */
const checkPendingFriendRequest = async (sender_id, receiver_id) => {
  const result = await pool.query(
    `SELECT * FROM friendship 
     WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'`,
    [sender_id, receiver_id]
  );
  return result.rows.length > 0;
};

/**
 * Accepts a friend request.
 */
const acceptFriendRequest = async (sender_id, receiver_id) => {
  await pool.query(
    `UPDATE friendship SET status = 'accepted' 
     WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'`,
    [sender_id, receiver_id]
  );
};

/**
 * Cancels an outgoing friend request.
 * (The user (sender) cancels a request they sent to a receiver.)
 */
const cancelFriendRequest = async (sender_id, receiver_id) => {
  await pool.query(
    `DELETE FROM friendship
     WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'`,
    [sender_id, receiver_id]
  );
};

/**
 * Declines an incoming friend request.
 * (The user (receiver) declines a request sent by a sender.)
 */
const declineFriendRequest = async (sender_id, receiver_id) => {
  await pool.query(
    `DELETE FROM friendship
     WHERE user1_id = $1 AND user2_id = $2 AND status = 'pending'`,
    [sender_id, receiver_id]
  );
};

/**
 * Deletes an accepted friendship.
 */
const unfriend = async (user1_id, user2_id) => {
  await pool.query(
    `DELETE FROM friendship
     WHERE ((user1_id = $1 AND user2_id = $2)
         OR (user1_id = $2 AND user2_id = $1))
     AND status = 'accepted'`,
    [user1_id, user2_id]
  );
};

/**
 * Gets accepted friends of a user, including profile images.
 */
const getFriendList = async (user_id) => {
  const result = await pool.query(
    `SELECT u.user_id, u.username, u.email, u.profile_image
     FROM users u
     JOIN friendship f 
       ON (f.user1_id = u.user_id AND f.user2_id = $1 AND f.status = 'accepted')
       OR (f.user2_id = u.user_id AND f.user1_id = $1 AND f.status = 'accepted')`,
    [user_id]
  );
  return result.rows;
};

/**
 * Gets pending friend requests for a user.
 */
const getPendingFriendRequests = async (receiver_id) => {
  const result = await pool.query(
    `SELECT f.user1_id AS sender_id, u.username, u.email, u.profile_image
     FROM friendship f
     JOIN users u ON u.user_id = f.user1_id
     WHERE f.user2_id = $1 AND f.status = 'pending'`,
    [receiver_id]
  );
  return result.rows;
};

/**
 * Gets pending friend requests that the user (as sender) has sent.
 */
const getSentFriendRequests = async (sender_id) => {
  const result = await pool.query(
    "SELECT user2_id AS receiver_id FROM friendship WHERE user1_id = $1 AND status = 'pending'",
    [sender_id]
  );
  return result.rows;
};

// -------------------- Messaging functions --------------------

/**
 * Sends a message from one user to another.
 */
const sendMessage = async (sender_id, receiver_id, content, is_media = false) => {
  await pool.query(
    `INSERT INTO message (sender_id, receiver_id, content, is_media)
     VALUES ($1, $2, $3, $4)`,
    [sender_id, receiver_id, content, is_media]
  );
};

/**
 * Gets the conversation between two users.
 */
const getConversation = async (user1_id, user2_id) => {
  const result = await pool.query(
    `SELECT m.message_id, 
            m.sender_id, 
            m.receiver_id, 
            m.content, 
            m.message_time, 
            COALESCE(u.username, 'Unknown') AS sender_name
     FROM message m
     LEFT JOIN users u ON m.sender_id = u.user_id
     WHERE (m.sender_id = $1 AND m.receiver_id = $2)
        OR (m.sender_id = $2 AND m.receiver_id = $1)
     ORDER BY m.message_time ASC`,
    [user1_id, user2_id]
  );
  return result.rows;
};

/**
 * Finds a user's public info by user_id (used for real-time sender name).
 */
const findUserById = async (user_id) => {
  const result = await pool.query("SELECT user_id, username FROM users WHERE user_id = $1", [user_id]);
  return result.rows[0];
};

// -------------------- Exporting all functions --------------------

module.exports = {
  findUserByEmail,
  createUser,
  findUserByUsername,
  findUserIdByUsername,
  checkFriendshipExists,
  createFriendRequest,
  checkPendingFriendRequest,
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  unfriend,
  getFriendList,
  getPendingFriendRequests,
  getSentFriendRequests,
  sendMessage,
  getConversation,
  findUserById,
};