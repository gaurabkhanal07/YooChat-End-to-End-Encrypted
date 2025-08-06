import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  Alert,
  SafeAreaView,
} from "react-native";
import io from "socket.io-client";

const ChatScreen = ({ route, navigation }) => {
  const { friendId, friendName, token } = route.params;
  const [messages, setMessages] = useState([]);
  const [textMessage, setTextMessage] = useState("");
  const [showUnfriend, setShowUnfriend] = useState(false);
  const socket = useRef(null);
  const flatListRef = useRef(null);

  const baseURL =
    Platform.OS === "android" ? "http://10.0.2.2:3000" : "http://localhost:3000";

  useEffect(() => {
    fetch(`${baseURL}/message/conversation/${friendId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setMessages(data.conversation || []))
      .catch((err) => console.error("Fetch error:", err));

    socket.current = io(baseURL, {
      auth: { token },
      transports: ["websocket"],
    });

    socket.current.on("receive_message", (message) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) =>
            m.timestamp === message.timestamp &&
            m.content === message.content &&
            m.sender_id === message.sender_id
        );
        return exists ? prev : [...prev, message];
      });
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  const handleUnfriend = async () => {
    setShowUnfriend(false);
    Alert.alert(
      `Unfriend ${friendName}`,
      "Are you sure you want to unfriend?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Unfriend",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`${baseURL}/friendship/unfriend`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ user2_id: friendId }),
              });

              const contentType = response.headers.get("content-type");

              if (contentType && contentType.includes("application/json")) {
                const result = await response.json();
                Alert.alert("Unfriended", result.message || "User has been unfriended.");
                navigation.goBack();
              } else {
                const text = await response.text();
                console.error("Unexpected response:", text);
                Alert.alert("Error", "Unexpected server response.");
              }
            } catch (error) {
              console.error("Unfriend error:", error);
              Alert.alert("Error", "Unable to unfriend user.");
            }
          },
        },
      ]
    );
  };

  const sendMessage = () => {
    if (!textMessage.trim()) return;
    socket.current.emit("send_message", {
      to: friendId,
      content: textMessage.trim(),
      is_media: false,
    });
    setTextMessage("");
  };

  const renderItem = ({ item }) => (
    <View style={styles.messageRow}>
      <Text style={styles.sender}>{item.sender_name}</Text>
      <View style={styles.messageBubble}>
        <Text style={styles.messageText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <Text style={styles.friendName}>{friendName}</Text>
        <View style={styles.menuWrapper}>
          <TouchableOpacity onPress={() => setShowUnfriend(!showUnfriend)}>
            <Text style={styles.dots}>⋮</Text>
          </TouchableOpacity>
          {showUnfriend && (
            <View style={styles.dropdownContainer}>
              <TouchableOpacity onPress={handleUnfriend} style={styles.dropdownItem}>
                <Text style={styles.dropdownText}>Unfriend</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Chat Section */}
      <KeyboardAvoidingView
        style={styles.chatSection}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.message_id}-${index}`}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={textMessage}
            onChangeText={setTextMessage}
          />
          <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    height: 60,
    borderBottomWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 1000,
  },
  friendName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  menuWrapper: {
    position: "relative",
  },
  dots: {
    fontSize: 22,
    paddingHorizontal: 8,
  },
  dropdownContainer: {
    position: "absolute",
    top: 28,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 6,
    minWidth: 120,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 999,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  dropdownText: {
    fontSize: 16,
    color: "#333",
  },
  chatSection: {
    flex: 1,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 6,
    marginHorizontal: 12,
    flexWrap: "wrap",
  },
  sender: {
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  messageBubble: {
    backgroundColor: "#F1F0F0",
    padding: 10,
    borderRadius: 10,
    maxWidth: "75%",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 10,
    borderTopWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: "#5A3EBA",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 20,
  },
  sendText: {
    color: "#fff",
    fontWeight: "bold",
  },
});