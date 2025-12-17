// screens/HomeScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Animated,
  StatusBar as RNStatusBar,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

const API_BASE = "http://192.168.100.180:5001";



/* ======================================================
   MENU NAV ITEMS
====================================================== */
const MENU_ITEMS = [
  { route: "Tutor", label: "Voice Tutor", icon: "microphone", color: "#2962FF" },
  { route: "Modules", label: "Modules", icon: "book-open", color: "#2BC48A" },
  { route: "PeerFeedback", label: "Peer Feedback", icon: "comments", color: "#FF6B88" },
  { route: "QuizArena", label: "AI Quiz Arena", icon: "brain", color: "#FFB84D" },
  { route: "Announcement", label: "Announcement", icon: "bullhorn", color: "#4DA8FF" },
  { route: "Settings", label: "Settings", icon: "cog", color: "#A878FF" },
];

export default function HomeScreen({ navigation }) {
  /* ======================================================
     STATE
  ====================================================== */
  const [user, setUser] = useState({
    id: "",
    fullname: "",
    avatar: "",
    xp: 0,
    streak: 0,
    level: 1,
  });

  const [dailyFocus, setDailyFocus] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  /* ======================================================
     ANIMATION VALUES
  ====================================================== */
  const sidebarX = useRef(new Animated.Value(-320)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  /* ======================================================
     MENU OPEN/CLOSE
  ====================================================== */
  const openMenu = () => {
    setMenuOpen(true);
    Animated.parallel([
      Animated.timing(sidebarX, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(sidebarX, { toValue: -320, duration: 200, useNativeDriver: true }),
      Animated.timing(overlayOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setMenuOpen(false));
  };

  /* ======================================================
     LOAD USER FROM STORAGE
  ====================================================== */
  const computeLevel = (xp) => Math.floor(xp / 100) + 1;

  const loadUser = async () => {
    const stored = await AsyncStorage.getItem("user");
    if (!stored) return;

    const u = JSON.parse(stored);
    setUser({
      ...u,
      avatar: u.avatar ? `${API_BASE}/${u.avatar}` : "",
      level: computeLevel(u.xp),
    });
  };

  useEffect(() => {
    loadUser();
  }, []);

  /* ======================================================
     LOAD DAILY FOCUS
     GET /students/:id/recent
  ====================================================== */
  const loadDailyFocus = async () => {
    if (!user.id) return;

    try {
      const res = await fetch(`${API_BASE}/students/${user.id}/recent`);

      const data = await res.json();

      if (data?.found) {
        setDailyFocus({
          title: data.title,
          progress: data.progress,
          thumbnail: data.thumbnail ? `${API_BASE}/${data.thumbnail}` : null,
        });

        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        Animated.timing(progressAnim, {
          toValue: data.progress,
          duration: 800,
          useNativeDriver: false,
        }).start();
      }
    } catch (err) {
      console.log("FOCUS ERROR:", err);
    }
  };

  useEffect(() => {
    loadDailyFocus();
  }, [user.id]);

  /* ======================================================
     REFRESH CONTROL
  ====================================================== */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUser();
    await loadDailyFocus();
    setRefreshing(false);
  };

  /* ======================================================
     LOGOUT
  ====================================================== */
  const handleLogout = async () => {
    await AsyncStorage.clear();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  /* ======================================================
     XP CALCULATIONS
  ====================================================== */
  const xpForNext = user.level * 100;
  const xpPercent = Math.min(100, Math.round((user.xp / xpForNext) * 100));

  /* ======================================================
     UI
  ====================================================== */
  return (
    <LinearGradient colors={["#0b0830", "#2a1167", "#4a2bff"]} style={styles.gradient}>
      <SafeAreaView style={{ flex: 1 }}>
        <RNStatusBar barStyle="light-content" />

        {/* SIDEBAR OVERLAY */}
        {menuOpen && (
          <>
            <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
              <TouchableOpacity style={{ flex: 1 }} onPress={closeMenu} />
            </Animated.View>

            {/* SIDEBAR PANEL */}
            <Animated.View style={[styles.sidebar, { transform: [{ translateX: sidebarX }] }]}>
              <TouchableOpacity style={styles.sidebarClose} onPress={closeMenu}>
                <Text style={{ color: "#fff", fontSize: 20 }}>✕</Text>
              </TouchableOpacity>

              {/* SIDEBAR USER */}
              <View style={styles.sidebarUser}>
                {user.avatar ? (
                  <Image source={{ uri: user.avatar }} style={styles.sidebarAvatar} />
                ) : (
                  <View style={styles.sidebarAvatarPlaceholder}>
                    <Text style={styles.sidebarAvatarInitial}>{user.fullname[0]}</Text>
                  </View>
                )}

                <View>
                  <Text style={styles.sidebarName}>{user.fullname}</Text>
                  <Text style={styles.sidebarMeta}>Level {user.level}</Text>
                </View>
              </View>

              {/* MENU */}
              <View style={styles.sidebarNav}>
                {MENU_ITEMS.map((item) => (
                  <TouchableOpacity
                    key={item.route}
                    style={styles.sidebarItem}
                    onPress={() => {
                      closeMenu();
                      navigation.navigate(item.route);
                    }}
                  >
                    <FontAwesome5 name={item.icon} size={18} color="#fff" style={{ marginRight: 10 }} />
                    <Text style={styles.sidebarItemText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}

                {/* LOGOUT */}
                <TouchableOpacity style={[styles.sidebarItem, styles.sidebarLogout]} onPress={handleLogout}>
                  <MaterialIcons name="logout" size={20} color="#fff" style={{ marginRight: 10 }} />
                  <Text style={styles.sidebarItemText}>Logout</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </>
        )}

        {/* MAIN CONTENT */}
        <View style={styles.root}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.hamburger} onPress={openMenu}>
              <Text style={styles.hamburgerText}>☰</Text>
            </TouchableOpacity>

            <View style={styles.brand}>
              <Image source={require("../assets/1logo.png")} style={styles.brandLogo} />
              <Text style={styles.brandTitle}>EduVerso</Text>
            </View>

            <TouchableOpacity style={styles.profileBtn} onPress={() => navigation.navigate("Profile")}>
              {user.avatar ? (
                <Image source={{ uri: user.avatar }} style={styles.profileImg} />
              ) : (
                <Text style={styles.profileInitial}>{user.fullname[0]}</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* BODY SCROLL */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
          >
            {/* HERO SECTION */}
            <View style={styles.hero}>
              <Text style={styles.heroWelcome}>Welcome,</Text>
              <Text style={styles.heroName}>{user.fullname}</Text>
              <Text style={styles.heroSub}>Shape your future, one lesson at a time.</Text>
            </View>

            {/* DAILY FOCUS */}
            <Animated.View style={[styles.dailyFocus, { opacity: fadeAnim }]}>
              <Text style={styles.dfTitle}>Daily Focus</Text>
              <Text style={styles.dfModule}>{dailyFocus?.title || "No recent activity"}</Text>

              {/* PROGRESS BAR */}
              <View style={styles.dfProgressRow}>
                <View style={styles.dfBar}>
                  <Animated.View
                    style={[
                      styles.dfFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 100],
                          outputRange: ["0%", `${dailyFocus?.progress || 0}%`],
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.dfPercent}>
                  {dailyFocus ? `${dailyFocus.progress}%` : "—"}
                </Text>
              </View>

              {/* THUMBNAIL */}
              {dailyFocus?.thumbnail ? (
                <Image source={{ uri: dailyFocus.thumbnail }} style={styles.dfThumb} />
              ) : (
                <LinearGradient colors={["#3e2a87", "#5e3bba"]} style={styles.dfThumb} />
              )}
            </Animated.View>

            {/* XP PROGRESS CARD */}
            <View style={styles.progressBlock}>
              <View style={styles.progressLeft}>
                <Text style={styles.progressLabel}>Your Progress</Text>
                <Text style={styles.progressLevel}>Level {user.level}</Text>
                <Text style={styles.progressXp}>
                  {user.xp}/{xpForNext} XP
                </Text>
                <Text style={styles.progressStreak}>🔥 {user.streak}-day streak</Text>
              </View>

              <View style={styles.progressRight}>
                <View style={styles.progressTrack}>
                  <View style={[styles.progressFill, { width: `${xpPercent}%` }]} />
                </View>
                <Text style={styles.progressMeta}>{xpPercent}% to next level</Text>
              </View>
            </View>

            {/* FEATURE MENU GRID */}
            <View style={styles.featureGrid}>
              {MENU_ITEMS.map((m) => (
                <TouchableOpacity
                  key={m.route}
                  style={[styles.feature, { backgroundColor: m.color }]}
                  onPress={() => navigation.navigate(m.route)}
                >
                  <FontAwesome5 name={m.icon} size={20} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.featureLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ======================================================
   STYLES
====================================================== */
const styles = StyleSheet.create({
  gradient: { flex: 1 },

  /* SIDEBAR OVERLAY */
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    zIndex: 998,
  },

  /* SIDEBAR PANEL */
  sidebar: {
    position: "absolute",
    width: 300,
    left: 0,
    top: 0,
    bottom: 0,
    padding: 24,
    paddingTop: 40,
    backgroundColor: "#12082b",
    zIndex: 999,
  },

  sidebarClose: {
    position: "absolute",
    right: 14,
    top: 14,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },

  sidebarUser: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 40,
    gap: 12,
  },
  sidebarAvatar: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },
  sidebarAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  sidebarAvatarInitial: { fontSize: 28, color: "#fff", fontWeight: "800" },
  sidebarName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  sidebarMeta: { color: "#aaa" },

  sidebarNav: { marginTop: 30 },
  sidebarItem: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.07)",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  sidebarItemText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  sidebarLogout: {
    backgroundColor: "rgba(255,80,80,0.25)",
  },

  /* MAIN ROOT */
  root: {
    flex: 1,
    maxWidth: 520,
    alignSelf: "center",
    padding: 16,
  },

  /* HEADER */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  hamburger: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  hamburgerText: { color: "#fff", fontSize: 24 },

  brand: { flexDirection: "row", alignItems: "center" },
  brandLogo: { width: 26, height: 26 },
  brandTitle: { color: "white", fontSize: 20, fontWeight: "800", marginLeft: 6 },

  profileBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  profileImg: { width: 48, height: 48, borderRadius: 12 },
  profileInitial: { color: "#fff", fontSize: 18, fontWeight: "700" },

  /* HERO */
  hero: { marginTop: 20 },
  heroWelcome: { color: "#fff", fontSize: 18, opacity: 0.8 },
  heroName: { color: "#fff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  heroSub: { color: "#bbb", marginTop: 4 },

  /* DAILY FOCUS */
  dailyFocus: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  dfTitle: { color: "#fff", fontWeight: "700", fontSize: 16, opacity: 0.85 },
  dfModule: { color: "#fff", fontSize: 22, fontWeight: "800", marginTop: 6 },

  dfProgressRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  dfBar: {
    flex: 1,
    height: 10,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
  },
  dfFill: { height: "100%", backgroundColor: "#ff87d0", borderRadius: 999 },
  dfPercent: { color: "#fff", marginLeft: 10, fontWeight: "700" },

  dfThumb: {
    width: "100%",
    height: 120,
    borderRadius: 14,
    marginTop: 14,
    opacity: 0.9,
  },

  /* XP BLOCK */
  progressBlock: {
    marginTop: 20,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
  },
  progressLeft: { flex: 1 },
  progressLabel: { color: "#fff", fontWeight: "700" },
  progressLevel: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 6 },
  progressXp: { color: "#fff", marginTop: 6 },
  progressStreak: { color: "#fff", marginTop: 6 },

  progressRight: { width: 140 },
  progressTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 999,
    overflow: "hidden",
  },
  progressFill: { height: "100%", backgroundColor: "#ff87d0" },
  progressMeta: { color: "#fff", marginTop: 6 },

  /* GRID BUTTONS */
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 20,
  },
  feature: {
    width: "48%",
    paddingVertical: 18,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  featureLabel: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
