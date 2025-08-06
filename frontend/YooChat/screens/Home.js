import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Platform,
  StatusBar,
  Modal,
  StyleSheet,
} from "react-native";
import axios from "axios";

const Home = ({ navigation, route }) => {
  const { profileImage, username, userEmail, token, userId } = route.params || {};
  const normalizedUsername = username ? username.trim().toLowerCase() : "";

  console.log("UserId:", userId);
  console.log("Normalized username:", normalizedUsername);
  console.log("Token:", token);

  // States for tabs and data
  const [activeTab, setActiveTab] = useState("Friends");
  const [friends, setFriends] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [menuVisible, setMenuVisible] = useState(false);

  // Create axios instance with proper baseURL value.
  const baseURL =
    Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";
  const api = axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` },
  });

  // Load initial data on mount
  useEffect(() => {
    if (!normalizedUsername) {
      Alert.alert("Error", "Username is missing. Please log in again.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } else {
      loadFriends();
      loadPending();
      if (activeTab === "Search") {
        loadSentRequests();
      }
    }
  }, [normalizedUsername, token]);

  useEffect(() => {
    if (activeTab === "Search") {
      loadSentRequests();
    }
  }, [activeTab]);

  useEffect(() => {
    console.log("Updated sentRequests:", sentRequests);
  }, [sentRequests]);

  // --- Data Loading Functions ---
  const loadFriends = async () => {
    try {
      const res = await api.get(
        `/friendship/list/${encodeURIComponent(username)}`
      );
      // Expect each friend to have: username, profile_image, last_message, and message_time.
      const data = (res.data.friends || []).map((u) => ({
        id: u.user_id ? u.user_id.toString() : u.id.toString(),
        username: u.username,
        profileImage: u.profile_image,
        lastMessage: u.last_message || "No recent messages",
        messageTime: u.message_time || "",
      }));
      setFriends(data);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to load friends: " + (err.response?.data?.message || err.message)
      );
    }
  };

  const loadPending = async () => {
    try {
      const res = await api.get("/friendship/pendingRequests");
      const data = (res.data.pending_requests || []).map((r) => ({
        id: r.sender_id ? r.sender_id.toString() : r.id.toString(),
        username: r.username,
        profileImage: r.profile_image || null,
      }));
      setPendingRequests(data);
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to load pending requests: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const loadSentRequests = async () => {
    try {
      const res = await api.get("/friendship/sentRequests");
      const outgoing = (res.data.sent_requests || []).map(
        (req) => req.receiver_id.toString()
      );
      setSentRequests(outgoing);
    } catch (err) {
      console.error(
        "Error loading sent friend requests:",
        err.response?.data || err.message
      );
    }
  };

  const handleSearch = async (text) => {
    setSearchText(text);
    if (!text.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await api.get(`/users/${encodeURIComponent(text.trim())}`);
      const result = {
        id: res.data.user_id ? res.data.user_id.toString() : res.data.id.toString(),
        username: res.data.username,
        profileImage: res.data.profile_image,
      };
      setSearchResults([result]);
    } catch (err) {
      setSearchResults([]);
    }
  };

  // --- Action Functions for Friend Requests ---
  const handleSendRequest = async (receiverId) => {
    if (receiverId === userId) {
      Alert.alert("Error", "You cannot send a friend request to yourself!");
      return;
    }
    try {
      await api.post("/friendship/sendRequest", { receiver_id: receiverId });
      Alert.alert("Success", "Friend request sent");
      setSentRequests((prev) => [...prev, receiverId.toString()]);
      loadPending();
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to send friend request: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleCancelRequest = async (receiverId) => {
    try {
      await api.post("/friendship/cancelRequest", { receiver_id: receiverId });
      Alert.alert("Success", "Friend request cancelled successfully");
      setSentRequests((prev) =>
        prev.filter((id) => id !== receiverId.toString())
      );
      loadPending();
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to cancel friend request: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleAcceptRequest = async (senderId) => {
    try {
      await api.post("/friendship/acceptRequest", { sender_id: senderId });
      Alert.alert("Success", "Friend request accepted");
      setTimeout(() => {
        loadFriends();
      }, 500);
      loadPending();
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to accept friend request: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  const handleDeclineRequest = async (senderId) => {
    try {
      await api.post("/friendship/declineRequest", { sender_id: senderId });
      Alert.alert("Success", "Friend request declined successfully");
      loadPending();
    } catch (err) {
      Alert.alert(
        "Error",
        "Failed to decline friend request: " +
          (err.response?.data?.message || err.message)
      );
    }
  };

  // --- Render Function for Items ---
  const renderItem = ({ item }) => {
    if (activeTab === "Friends") {
      // Friends tab: show chat preview (profile image, username, last message, timestamp)
      return (
        <TouchableOpacity
          style={styles.itemContainer}
          onPress={() =>
            navigation.navigate("ChatScreen", {
              friendId: item.id,
              friendName: item.username,
              friendProfileImage: item.profileImage,
              token,
              userId,
            })
          }
        >
          <Image source={{ uri: item.profileImage }} style={styles.itemImage} />
          <View style={styles.itemData}>
            <Text style={styles.itemText}>{item.username}</Text>
            <Text style={styles.messagePreview} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          <Text style={styles.messageTime}>{item.messageTime}</Text>
        </TouchableOpacity>
      );
    }

    // For "Requests" and "Search" tabs
    let actionBtn = null;
    if (activeTab === "Requests") {
      actionBtn = (
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => handleAcceptRequest(item.id)}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={() => handleDeclineRequest(item.id)}
          >
            <Text style={styles.buttonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      );
    } else if (activeTab === "Search") {
      if (item.id === userId) {
        // If the search result is yourself, show a message.
        actionBtn = <Text style={styles.selfText}>It's You!</Text>;
      } else {
        const alreadySent = sentRequests.includes(item.id.toString());
        actionBtn = alreadySent ? (
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => handleCancelRequest(item.id)}
          >
            <Text style={styles.buttonText}>Cancel Request</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.addFriendButton}
            onPress={() => handleSendRequest(item.id)}
          >
            <Text style={styles.buttonText}>Add Friend</Text>
          </TouchableOpacity>
        );
      }
    }

    return (
      <View style={styles.itemContainer}>
        <Image source={{ uri: item.profileImage }} style={styles.itemImage} />
        <View style={styles.nameContainer}>
          <Text style={styles.itemText}>{item.username}</Text>
        </View>
        {actionBtn}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with YoChat and three-dot menu */}
      <View style={styles.header}>
        <Text style={styles.brandText}>YoChat</Text>
        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuVisible(true)}>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* Modal for three-dot menu with Profile and Logout */}
      <Modal
        transparent={true}
        animationType="fade"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setMenuVisible(false)}
        >
          <View style={styles.modalContainer}>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Profile", { profileImage, username, userEmail });
              }}
            >
              <Text style={styles.modalText}>My Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setMenuVisible(false);
                navigation.replace("Logout");
              }}
            >
              <Text style={styles.modalText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Toggle Tabs */}
      <View style={styles.toggleBar}>
        {["Friends", "Requests", "Search"].map((tab) => (
          <TouchableOpacity key={tab} style={styles.toggleItem} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.toggleText, activeTab === tab && styles.activeToggleText]}>{tab}</Text>
            {activeTab === tab && <View style={styles.indicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input (visible only in Search tab) */}
      {activeTab === "Search" && (
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username..."
          placeholderTextColor="#888"
          value={searchText}
          onChangeText={handleSearch}
          autoCapitalize="none"
        />
      )}

      {/* Main List */}
      <FlatList
        data={
          activeTab === "Friends"
            ? friends
            : activeTab === "Requests"
            ? pendingRequests
            : searchResults
        }
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No {activeTab} found.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  brandText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#8948C2",
  },
  menuButton: {
    padding: 5,
  },
  menuIcon: {
    fontSize: 24,
    color: "#8948C2",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 5,
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight + 10 : 40,
    marginRight: 10,
    width: 150,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  modalItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalText: {
    fontSize: 16,
    color: "#444",
  },
  toggleBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 10,
  },
  toggleItem: {
    alignItems: "center",
    paddingVertical: 10,
  },
  toggleText: {
    fontSize: 16,
    color: "#666",
  },
  activeToggleText: {
    color: "#000",
    fontWeight: "bold",
  },
  indicator: {
    height: 3,
    width: "60%",
    backgroundColor: "#8948C2",
    borderRadius: 2,
    marginTop: 4,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    color: "#000",
  },
  listContainer: {
    paddingBottom: 100,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  itemData: {
    flex: 1,
  },
  itemText: {
    fontSize: 16,
    color: "#000",
    fontWeight: "bold",
  },
  messagePreview: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 12,
    color: "#888",
  },
  // For Requests and Search tabs, additional spacing around the name.
  nameContainer: {
    flex: 1,
    marginLeft: 10,
  },
  buttonRow: {
    flexDirection: "row",
  },
  acceptButton: {
    backgroundColor: "green",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
    marginRight: 5,
  },
  declineButton: {
    backgroundColor: "red",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  addFriendButton: {
    backgroundColor: "#8948C2",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
  selfText: {
    color: "#444",
    fontSize: 14,
    fontStyle: "italic",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
  },
});

export default Home;
