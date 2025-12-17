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

import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const API_BASE = "http://192.168.100.180:5001";

export default function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");

  /* ===============================
     GOOGLE AUTH
  =============================== */
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "455896959380-ocuuhpnodnduef1i4q70gv405ce6h5ou.apps.googleusercontent.com",
    iosClientId:
      "455896959380-ocuuhpnodnduef1i4q70gv405ce6h5ou.apps.googleusercontent.com",
  });

  useEffect(() => {
    if (
      response?.type === "success" &&
      response.authentication?.idToken
    ) {
      handleGoogleLogin(response.authentication.idToken);
    }
  }, [response]);

  const handleGoogleLogin = async (id_token) => {
    try {
      const res = await fetch(`${API_BASE}/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token }),
      });

      const data = await res.json();

      if (!res.ok || !data.token) {
        Alert.alert("Google Login Failed", data.message || "Try again");
        return;
      }

      await AsyncStorage.setItem("token", data.token);

      // ✅ FIXED: store avatar as RELATIVE PATH ONLY
      await AsyncStorage.setItem(
        "user",
        JSON.stringify({
          ...data.user,
          avatar: data.user.avatar || "",
        })
      );

      navigation.replace("Home");
    } catch (err) {
      Alert.alert("Error", "Google login failed");
    }
  };

  /* ===============================
     EMAIL + PASSWORD LOGIN
  =============================== */
  const handleLogin = async () => {
    setError("");

    if (!email || !password) {
      setError("Email and password required");
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

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>

        <Text style={styles.continueText}>Or continue with</Text>

        <TouchableOpacity
          disabled={!request}
          style={styles.googleButton}
          onPress={() => promptAsync()}
        >
          <Image
            source={require("../assets/google.png")}
            style={{ width: 40, height: 40 }}
          />
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
  loginBtn: {
    width: "60%",
    padding: 16,
    backgroundColor: "#7a4fff",
    borderRadius: 18,
    marginTop: 10,
  },
  loginText: { color: "white", textAlign: "center", fontSize: 18 },
  continueText: { color: "#eee", marginTop: 18 },
  googleButton: { marginTop: 14 },
});
