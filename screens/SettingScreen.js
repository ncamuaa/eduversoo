// screens/SettingsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const BASE = "http://192.168.100.180:5001";


export default function SettingsScreen() {
  const navigation = useNavigation();

  /* ===================================================
      LOCAL STATES
  =================================================== */
  const [notifications, setNotifications] = useState(true);
  const [sound, setSound] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [accent, setAccent] = useState("purple");
  const [theme, setTheme] = useState("dark");

  /* SECURITY */
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [user, setUser] = useState(null);

  /* ===================================================
      LOAD SETTINGS + USER
  =================================================== */
  useEffect(() => {
    (async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));

      const savedAccent = await AsyncStorage.getItem("accent");
      const savedTheme = await AsyncStorage.getItem("theme");
      const savedReducedMotion = await AsyncStorage.getItem("reducedMotion");

      if (savedAccent) setAccent(savedAccent);
      if (savedTheme) setTheme(savedTheme);
      if (savedReducedMotion) setReducedMotion(savedReducedMotion === "true");
    })();
  }, []);

  /* ===================================================
      SAVE ACCENT COLOR
  =================================================== */
  const handleAccentChange = async (c) => {
    setAccent(c);
    await AsyncStorage.setItem("accent", c);
  };

  /* ===================================================
      SWITCH THEMES
  =================================================== */
  const toggleTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    await AsyncStorage.setItem("theme", next);
  };

  /* ===================================================
      CHANGE PASSWORD
  =================================================== */
  const handleChangePassword = async () => {
    if (!oldPassword || !newPassword)
      return Alert.alert("Error", "Please fill out both fields.");

    try {
      const res = await fetch(`${API}/auth/change-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          old_password: oldPassword,
          new_password: newPassword,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        Alert.alert("Success", "Password updated!");
        setOldPassword("");
        setNewPassword("");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      Alert.alert("Server Error", "Backend not reachable.");
    }
  };

  /* ===================================================
      CHANGE EMAIL
  =================================================== */
  const handleChangeEmail = async () => {
    if (!newEmail.trim()) return Alert.alert("Error", "Enter new email.");

    try {
      const res = await fetch(`${API}/auth/change-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          new_email: newEmail,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        Alert.alert("Success", "Email updated!");
        setNewEmail("");
      } else {
        Alert.alert("Error", data.message);
      }
    } catch (err) {
      Alert.alert("Server Error", "Could not contact backend.");
    }
  };

  /* ===================================================
      DELETE ACCOUNT
  =================================================== */
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account?",
      "This action is permanent.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const res = await fetch(`${API}/auth/delete-account`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.id }),
              });

              const data = await res.json();

              if (data.ok) {
                await AsyncStorage.clear();
                navigation.reset({
                  index: 0,
                  routes: [{ name: "Login" }],
                });
              } else {
                Alert.alert("Error", data.message);
              }
            } catch (err) {
              Alert.alert("Error", "Server unavailable");
            }
          },
        },
      ]
    );
  };

  /* ===================================================
      UI
  =================================================== */
  return (
    <LinearGradient colors={["#151557", "#3c1aa0", "#7a33ff"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>

          {/* TOP BAR */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Settings</Text>
            <View style={{ width: 60 }} />
          </View>

          {/* TOGGLE CARDS */}
          <ToggleCard title="Notifications" desc="Enable reminders" state={notifications} setState={setNotifications} />
          <ToggleCard title="Sound" desc="UI click sounds" state={sound} setState={setSound} />
          <ToggleCard title="Reduced Motion" desc="Less animations" state={reducedMotion} setState={setReducedMotion} />
          <ToggleCard title="Dark Mode" desc="Switch theme" state={theme === "dark"} setState={toggleTheme} />

          {/* ACCENT COLOR */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Accent Color</Text>
            <View style={styles.colorRow}>
              {["blue", "purple", "gold", "green"].map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => handleAccentChange(c)}
                  style={[
                    styles.colorChip,
                    styles[c],
                    accent === c && styles.colorSelected,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* EMAIL CHANGE */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change Email</Text>
            <TextInput
              style={styles.input}
              placeholder="New email"
              placeholderTextColor="#bbb"
              value={newEmail}
              onChangeText={setNewEmail}
            />
            <TouchableOpacity style={styles.btn} onPress={handleChangeEmail}>
              <Text style={styles.btnText}>Update Email</Text>
            </TouchableOpacity>
          </View>

          {/* PASSWORD CHANGE */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Change Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Current password"
              placeholderTextColor="#bbb"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />
            <TextInput
              style={styles.input}
              placeholder="New password"
              placeholderTextColor="#bbb"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TouchableOpacity style={styles.btn} onPress={handleChangePassword}>
              <Text style={styles.btnText}>Update Password</Text>
            </TouchableOpacity>
          </View>

          {/* DELETE ACCOUNT */}
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
            <Text style={styles.deleteText}>Delete Account</Text>
          </TouchableOpacity>

        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ============================================================
   SMALL COMPONENT
============================================================ */
function ToggleCard({ title, desc, state, setState }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>

      <TouchableOpacity
        onPress={() => setState(!state)}
        style={[styles.toggle, state && styles.toggleOn]}
      >
        <View style={[styles.knob, state && styles.knobOn]} />
      </TouchableOpacity>
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */
const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backText: { color: "#fff", fontSize: 18 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },

  /* CARD */
  card: {
    marginTop: 18,
    padding: 22,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  cardTitle: { color: "#fff", fontSize: 17, fontWeight: "700" },
  cardDesc: { color: "rgba(255,255,255,0.75)", marginTop: 4 },

  /* TOGGLE */
  toggle: {
    width: 54,
    height: 30,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 4,
    justifyContent: "center",
    position: "absolute",
    right: 16,
    top: 22,
  },
  toggleOn: { backgroundColor: "#9a6bff" },
  knob: {
    width: 22,
    height: 22,
    borderRadius: 22,
    backgroundColor: "#fff",
  },
  knobOn: { transform: [{ translateX: 22 }] },

  /* COLOR PICKER */
  colorRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  colorChip: {
    width: 38,
    height: 38,
    borderRadius: 18,
    opacity: 0.7,
  },
  colorSelected: { opacity: 1, borderWidth: 2, borderColor: "#fff" },
  blue: { backgroundColor: "#6fa8ff" },
  purple: { backgroundColor: "#9a6bff" },
  gold: { backgroundColor: "#ffd86b" },
  green: { backgroundColor: "#7ef2b2" },

  /* INPUTS */
  input: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
  },

  /* BUTTONS */
  btn: {
    padding: 12,
    backgroundColor: "#9a6bff",
    borderRadius: 10,
    marginTop: 12,
  },
  btnText: { textAlign: "center", color: "#fff", fontWeight: "700" },

  deleteBtn: {
    marginTop: 30,
    padding: 14,
    backgroundColor: "rgba(255,0,0,0.3)",
    borderRadius: 12,
  },
  deleteText: {
    color: "#ffbaba",
    textAlign: "center",
    fontWeight: "800",
  },
});
