import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "../../config/api";

const API_BASE = API_URL;

export default function FinalResultScreen({ route, navigation }) {
  const { student_id, module_id, correct, total, game_name } = route.params;

  const safeCorrect = Number(correct) || 0;
  const safeTotal = Number(total) || 1;
  const percentage = Math.round((safeCorrect / safeTotal) * 100);

  const [xpEarned, setXpEarned] = useState(0);
  const [loading, setLoading] = useState(true);

  /* ================= SAVE SCORE + XP ================= */
  useEffect(() => {
    const saveScore = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/games/save-score`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            student_id,
            module_id,
            game_name,
            correct: safeCorrect,
            total: safeTotal,
          }),
        });

        const data = await res.json();

        if (res.ok) {
          setXpEarned(data.xp_earned || 0);

          // 🔄 Sync XP locally
          const stored = await AsyncStorage.getItem("user");
          if (stored) {
            const u = JSON.parse(stored);
            const updated = {
              ...u,
              xp: (u.xp || 0) + (data.xp_earned || 0),
            };
            await AsyncStorage.setItem("user", JSON.stringify(updated));
          }
        }
      } catch (err) {
        console.log("FINAL SCORE ERROR:", err);
      } finally {
        setLoading(false);
      }
    };

    saveScore();
  }, []);

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <LinearGradient colors={["#2b1e78", "#5620e0"]} style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Calculating results…</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#2b1e78", "#5620e0"]} style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>🏁 Results</Text>

        <Text style={styles.percent}>{percentage}%</Text>

        <Text style={styles.score}>
          {safeCorrect} / {safeTotal}
        </Text>

        <Text style={styles.xp}>✨ +{xpEarned} XP</Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.primaryText}>Back to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            navigation.replace(route.params.game_name === "Quiz Game"
              ? "QuizGame"
              : "RPSGame", route.params)
          }
        >
          <Text style={styles.secondaryText}>Retry Game</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

/* ===============================
   STYLES
=============================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    marginTop: 12,
  },

  card: {
    width: "85%",
    padding: 28,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
  },

  title: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 14,
  },

  percent: {
    color: "#ffd166",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },

  score: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "800",
    marginBottom: 10,
  },

  xp: {
    color: "#7CFF9E",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
  },

  primaryBtn: {
    backgroundColor: "#ff3ccf",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 18,
    marginBottom: 14,
  },

  primaryText: {
    color: "#111",
    fontWeight: "800",
    fontSize: 16,
  },

  secondaryBtn: {
    marginTop: 4,
  },

  secondaryText: {
    color: "#fff",
    textDecorationLine: "underline",
    fontSize: 14,
  },
});
