import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome";
import axios from "axios";
import * as ImagePicker from "react-native-image-picker";

export default function SignUp({ navigation }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPw] = useState("");
  const [imageUri, setImageUri] = useState(null);

  const pickImage = () => {
    ImagePicker.launchImageLibrary({}, (response) => {
      if (!response.didCancel) {
        setImageUri(response.assets[0].uri);
      }
    });
  };

  const handleSignUp = async () => {
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    const formData = new FormData();
    formData.append("username", username);
    formData.append("email", email);
    formData.append("password", password);
    if (imageUri) {
      formData.append("profileImage", {
        uri: imageUri,
        type: "image/jpeg",
        name: "profile.jpg",
      });
    }

    try {
      const response = await axios.post("http://10.0.2.2:3000/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert("Success", response.data.message);
      navigation.goBack();
    } catch (error) {
      Alert.alert("Sign Up Failed", error.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : null}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.wrapper}>
        {/* Back Arrow */}
        <Pressable style={styles.back} onPress={() => navigation.goBack()}>
          <Icon name="chevron-left" size={20} color="#000" />
        </Pressable>

        <View style={styles.brandRow}>
          <Text style={styles.brandPurple}>यो</Text>
          <Text style={styles.brandBlack}>Chat</Text>
        </View>

        <Text style={styles.heading}>Create Your Account</Text>

        {/* Profile Image Picker */}
        <TouchableOpacity onPress={pickImage} style={styles.imagePickerBtn}>
          <Text style={styles.imagePickerTxt}>Select Profile Image</Text>
        </TouchableOpacity>

        {imageUri && (
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
        )}

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          placeholderTextColor="#aaa"
        />
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
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPw}
          placeholderTextColor="#aaa"
          secureTextEntry
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={handleSignUp}>
          <Text style={styles.primaryBtnTxt}>Sign Up</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  back: { marginBottom: 10, width: 32 },
  brandRow: { flexDirection: "row", alignItems: "baseline", marginBottom: 40 },
  brandPurple: { fontSize: 40, fontWeight: "900", color: "#8948C2" },
  brandBlack: { fontSize: 40, fontWeight: "900", color: "#000" },
  heading: { fontSize: 16, fontWeight: "600", marginBottom: 20, color: "#4b5563" },

  imagePickerBtn: {
    backgroundColor: "#e5e7eb",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  imagePickerTxt: { color: "#000", fontWeight: "600" },

  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: "center",
    marginBottom: 20,
  },

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
});