// screens/ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const BASE = "http://192.168.100.180:5001";

export default function ProfileScreen() {
  const navigation = useNavigation();

  const [user, setUser] = useState({
    id: "",
    fullname: "",
    email: "",
    avatar: "",   // stored as relative path: uploads/...
    xp: 0,
    streak: 0,
    level: 1,
  });

  const [loading, setLoading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");

  /* ============================================
     LOAD USER FROM ASYNC STORAGE
  ============================================ */
  useEffect(() => {
    async function loadUser() {
      try {
        const stored = await AsyncStorage.getItem("user");
        if (!stored) return;

        const u = JSON.parse(stored);
        const autoLevel = Math.floor((u.xp || 0) / 100) + 1;

        setUser({
          id: u.id,
          fullname: u.fullname || "Student",
          email: u.email || "",
          avatar: u.avatar || "",   // relative path like uploads/avatars/...
          xp: u.xp || 0,
          streak: u.streak || 0,
          level: autoLevel,
        });
      } catch (e) {
        console.log("LOAD USER ERROR:", e);
      }
    }

    loadUser();
  }, []);

  /* ============================================
     PICK IMAGE FROM GALLERY
  ============================================ */
  const chooseImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!res.canceled) {
      uploadAvatar(res.assets[0].uri);
    }
  };

  /* ============================================
     UPLOAD AVATAR TO BACKEND
     POST /auth/upload-avatar
     → returns { avatar_url: "uploads/..." }
  ============================================ */
  const uploadAvatar = async (uri) => {
    if (!user.id) return;

    setLoading(true);
    setUploadMsg("");

    const form = new FormData();
    form.append("id", user.id);
    form.append("avatar", {
      uri,
      name: "profile.jpg",
      type: "image/jpeg",
    });

    try {
      const res = await fetch(`${API_BASE}/auth/upload-avatar`, {
        method: "POST",
        body: form,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = await res.json();

      if (res.ok && data.avatar_url) {
        const updatedUser = {
          ...user,
          avatar: data.avatar_url, // store relative path only
        };

        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        setUploadMsg("Avatar updated!");
      } else {
        setUploadMsg(data.error || "Upload failed");
      }
    } catch (err) {
      console.log("UPLOAD ERROR:", err);
      setUploadMsg("Network error");
    }

    setLoading(false);
  };

  /* ============================================
     LOGOUT HANDLER
  ============================================ */
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.replace("Login");
  };

  /* ============================================
     RENDER
  ============================================ */
  return (
    <LinearGradient
      colors={["#0b0830", "#2a1167", "#4a2bff"]}
      style={styles.container}
    >
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* AVATAR CARD */}
      <View style={styles.card}>
        <View style={styles.avatarBox}>
          {user.avatar ? (
            <Image
              source={{ uri: `${API_BASE}/${user.avatar}` }}
              style={styles.avatar}
            />
          ) : (
            <Text style={styles.noAvatar}>No Avatar</Text>
          )}
        </View>

        <TouchableOpacity style={styles.chooseBtn} onPress={chooseImage}>
          <Text style={styles.chooseText}>Choose Image</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color="#fff" style={{ marginTop: 8 }} />
        ) : (
          uploadMsg !== "" && <Text style={styles.uploadMsg}>{uploadMsg}</Text>
        )}
      </View>

      {/* USER INFO */}
      <View style={styles.infoCard}>
        <Text style={styles.name}>{user.fullname}</Text>
        <Text style={styles.email}>Email: {user.email}</Text>
      </View>

      {/* STATS */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statTitle}>🏆 Achievements</Text>
          <Text style={styles.statText}>Level: {user.level}</Text>
          <Text style={styles.statText}>Streak: {user.streak} days</Text>
        </View>

        <View style={styles.statBox}>
          <Text style={styles.statTitle}>📊 Stats</Text>
          <Text style={styles.statText}>XP: {user.xp}</Text>
        </View>
      </View>

      {/* LOGOUT */}
      <TouchableOpacity style={styles.logout} onPress={handleLogout}>
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

/* ============================================
   STYLES
============================================ */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  header: {
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: { color: "#fff", fontSize: 18 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },

  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 20,
    borderRadius: 20,
    marginTop: 20,
    alignItems: "center",
  },
  avatarBox: {
    width: 150,
    height: 150,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { width: "100%", height: "100%" },
  noAvatar: { color: "#ccc" },

  chooseBtn: {
    marginTop: 15,
    padding: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  chooseText: { color: "#fff", fontWeight: "700" },

  uploadMsg: { color: "#a7d7ff", marginTop: 6 },

  infoCard: {
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 20,
    borderRadius: 20,
  },
  name: { color: "#fff", fontSize: 22, fontWeight: "700" },
  email: { color: "#ddd", marginTop: 5 },

  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 16,
    borderRadius: 16,
  },
  statTitle: { color: "#fff", fontWeight: "700", marginBottom: 6 },
  statText: { color: "#ddd", marginTop: 4 },

  logout: {
    marginTop: 22,
    padding: 15,
    backgroundColor: "#ff4d4d",
    borderRadius: 18,
  },
  logoutText: { color: "#fff", textAlign: "center", fontWeight: "800" },
});
