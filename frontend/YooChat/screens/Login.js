import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Alert,
  Image,
} from "react-native";
import axios from "axios";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in email and password");
      return;
    }

    try {
      const response = await axios.post("http://10.0.2.2:3000/login", {
        email,
        password,
      });
    console.log("TOKEN:", response.data.token);

      if (response.data.token) {
        Alert.alert("Success", "Login successful!");

        // Store profile image in state
        setProfileImage(response.data.profileImage);

        // Navigate to home screen, passing profileImage as a parameter
        navigation.navigate("Home", {
  profileImage: response.data.profileImage,
  username: response.data.username,      
  userEmail: response.data.email,       
  token: response.data.token,            
});
      }
    } catch (error) {
      if (error.response) {
        Alert.alert("Login failed", error.response.data.message || "Invalid credentials");
      } else {
        Alert.alert("Login failed", "Server error");
      }
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.brandRow}>
        <Text style={styles.brandPurple}>यो</Text>
        <Text style={styles.brandBlack}>Chat</Text>
      </View>

      <Text style={styles.heading}>Login To Your Account</Text>

      {/* Profile Image (if exists) */}
      {profileImage && (
        <Image
          source={{ uri: profileImage }}
          style={{ width: 100, height: 100, borderRadius: 50, alignSelf: "center", marginBottom: 20 }}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        placeholderTextColor="#aaa"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        placeholderTextColor="#aaa"
        secureTextEntry
      />

      <TouchableOpacity style={styles.primaryBtn} onPress={handleLogin}>
        <Text style={styles.primaryBtnTxt}>Login</Text>
      </TouchableOpacity>

      <Text style={styles.footerTxt}>
        Don’t have an account?
        <Pressable onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.linkTxt}> Sign up</Text>
        </Pressable>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  brandRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 40 },
  brandPurple: { fontSize: 40, fontWeight: "900", color: "#8948C2" },
  brandBlack: { fontSize: 40, fontWeight: "900", color: "#000" },
  heading: { fontSize: 16, fontWeight: "600", marginBottom: 20, color: "#4b5563" },

  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: "#8948C2",
    height: 50,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
  },
  primaryBtnTxt: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footerTxt: { textAlign: "center", color: "#6b7280" },
  linkTxt: { color: "#8948C2", fontWeight: "600" },
});






