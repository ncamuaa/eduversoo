import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Animated,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { API_URL } from "../config/api";

const API_BASE = API_URL;


export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [isRobotChecked, setIsRobotChecked] = useState(false);

  /* ===============================
     EMAIL + PASSWORD LOGIN
  =============================== */
  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password required");
      return;
    }

    if (!isRobotChecked) {
      setError("Please confirm you are not a robot");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed");
        return;
      }

      await AsyncStorage.setItem("token", data.token);

      // ✅ SAME FIX APPLIED HERE
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          ...data.user,
          avatar: data.user.avatar || "",
        })
      );

      navigation.replace("Home");
    } catch {
      setError("Server error");
    }
  };

  /* ===============================
     UI
  =============================== */
  return (
    <LinearGradient
      colors={["#2626FF", "#1D1BA8", "#0F147C", "#090F6A"]}
      style={styles.container}
    >
      <View style={styles.card}>
        <Animated.Image
          source={require("../assets/2logo.png")}
          style={styles.logo}
        />

        <Text style={styles.title}>Login</Text>
        {!!error && <Text style={styles.error}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#ddd"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <View style={styles.passwordBox}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#ddd"
            secureTextEntry={!showPass}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity
            style={styles.eye}
            onPress={() => setShowPass(!showPass)}
          >
            <Text style={{ color: "white" }}>
              {showPass ? "🙈" : "👁️"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* I'm not a robot Checkbox */}
        <TouchableOpacity
          style={styles.robotContainer}
          onPress={() => setIsRobotChecked(!isRobotChecked)}
          activeOpacity={0.8}
        >
          <View style={[styles.robotBox, isRobotChecked && styles.robotBoxChecked]}>
            {isRobotChecked && <Text style={styles.robotCheckmark}>✓</Text>}
          </View>
          <Text style={styles.robotText}>I'm not a robot</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

      </View>
    </LinearGradient>
  );
}

/* ===============================
   STYLES
=============================== */
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "86%",
    padding: 30,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  logo: { width: 140, height: 140, resizeMode: "contain" },
  title: { fontSize: 36, color: "white", fontWeight: "800", marginBottom: 20 },
  error: { color: "#ffb4b4", marginBottom: 10 },
  input: {
    width: "100%",
    padding: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.16)",
    color: "white",
    marginBottom: 16,
  },
  passwordBox: { width: "100%" },
  eye: { position: "absolute", right: 16, top: 18 },
  robotContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 10,
    borderRadius: 8,
    width: "100%",
  },
  robotBox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "white",
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
  robotBoxChecked: {
    backgroundColor: "#4CAF50",
    borderColor: "#4CAF50",
  },
  robotCheckmark: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  robotText: {
    color: "white",
    fontSize: 16,
  },
  loginBtn: {
    width: "60%",
    padding: 16,
    backgroundColor: "#7a4fff",
    borderRadius: 18,
    marginTop: 10,
  },
  loginText: { color: "white", textAlign: "center", fontSize: 18 },
});
