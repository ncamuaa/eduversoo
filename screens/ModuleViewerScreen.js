// screens/ModuleViewerScreen.js
import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WebView } from "react-native-webview";
import { API_URL } from "../config/api";


/* =======================
   CONSTANTS
======================= */
const API = API_URL;
const XP_ON_COMPLETE = 30;
const TOTAL_PAGES = 4; // keep static for now

export default function ModuleViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const moduleData = route.params?.module;

  const [userId, setUserId] = useState(null);
  const [pageNum, setPageNum] = useState(1);
  const [showEnd, setShowEnd] = useState(false);
  const [notes, setNotes] = useState("");

  const [loadedQuestions, setLoadedQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);
  const scrollRef = useRef(null);

  /* =======================
     LOAD USER + NOTES
  ======================= */
  useEffect(() => {
    (async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          setUserId(u.id);
        }

        const savedNotes = await AsyncStorage.getItem(
          `notes_module_${moduleData?.id}`
        );
        if (savedNotes) setNotes(savedNotes);
      } catch (err) {
        console.log("LOAD ERROR:", err);
      }
    })();
  }, []);

  if (!moduleData) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>Module not found.</Text>
      </View>
    );
  }

  const progressPercent = Math.round((pageNum / TOTAL_PAGES) * 100);

  // Effective progress combines current page number with scroll percentage
  const effectiveProgress = Math.min(
    100,
    Math.round(
      ((pageNum - 1 + scrollPercent / 100) / TOTAL_PAGES) * 100
    )
  );

  /* =======================
     SCROLL HANDLER
  ======================= */
  const handleScroll = (event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const totalHeight = contentSize.height - layoutMeasurement.height;
    if (totalHeight > 0) {
      const percent = Math.round((contentOffset.y / totalHeight) * 100);
      setScrollPercent(Math.max(0, Math.min(100, percent)));
    }
  };

  /* =======================
     SAVE PROGRESS
  ======================= */
  const saveProgress = async (progress, completed) => {
    if (!userId) return;
    try {
      await fetch(`${API}/progress/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          module_id: moduleData.id,
          progress,
          completed: completed ? 1 : 0,
        }),
      });
    } catch (err) {
      console.log("PROGRESS ERROR:", err);
    }
  };

  /* =======================
     XP REWARD
  ======================= */
  const addXp = async () => {
    if (!userId) return;
    try {
      const res = await fetch(`${API}/students/${userId}/add-xp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: XP_ON_COMPLETE }),
      });

      const data = await res.json();

      if (data?.ok) {
        const stored = await AsyncStorage.getItem("user");
        if (stored) {
          const u = JSON.parse(stored);
          await AsyncStorage.setItem(
            "user",
            JSON.stringify({ ...u, xp: data.newXp })
          );
        }
      }
    } catch (err) {
      console.log("XP ERROR:", err);
    }
  };

  /* =======================
     LOAD QUESTIONS
  ======================= */
  const loadQuestions = async () => {
    if (loadingQuestions) return;

    try {
      setLoadingQuestions(true);
      const res = await fetch(
        `${API}/api/games/questions/${moduleData.id}`
      );
      const data = await res.json();

      if (data?.questions?.length > 0) {
        setLoadedQuestions(data.questions);
      } else {
        Alert.alert("No Questions", "No questions found for this module.");
      }
    } catch (err) {
      console.log("QUESTION FETCH ERROR:", err);
      Alert.alert("Error", "Failed to load questions.");
    } finally {
      setLoadingQuestions(false);
    }
  };

  useEffect(() => {
    if (showEnd && loadedQuestions.length === 0) {
      loadQuestions();
    }
  }, [showEnd]);

  /* =======================
     NAVIGATION
  ======================= */
  const handleNextPage = async () => {
    if (pageNum < TOTAL_PAGES) {
      const next = pageNum + 1;
      setPageNum(next);
      setScrollPercent(0);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      await saveProgress(Math.round((next / TOTAL_PAGES) * 100), false);
      return;
    }

    await saveProgress(100, true);
    await addXp();
    setShowEnd(true);
  };

  const handlePrevPage = () => {
    if (pageNum > 1) {
      setPageNum(pageNum - 1);
      setScrollPercent(0);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  };

  /* =======================
     GAME START
  ======================= */
  const startGame = (screen) => {
    if (loadedQuestions.length === 0) {
      Alert.alert("Please wait", "Questions are still loading.");
      return;
    }

    navigation.navigate(screen, {
      module_id: moduleData.id,
      questions: loadedQuestions,
      student_id: userId,
    });
  };

  /* =======================
     UI
  ======================= */
  return (
    <ScrollView
      contentContainerStyle={styles.container}
      ref={scrollRef}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    >
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.exitText}>⬅ Exit Module</Text>
      </TouchableOpacity>

      <Text style={styles.title}>{moduleData.title}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Page {pageNum} / {TOTAL_PAGES}</Text>
        <Text style={styles.metaText}>{effectiveProgress}%</Text>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${effectiveProgress}%` }]} />
      </View>

      {/* ✅ REAL PDF VIEWER */}
      <WebView
  source={{ uri: `${API}/${moduleData.pdf_file}` }}
  style={styles.pdf}

        onError={(e) => console.log("PDF ERROR:", e)}
      />

      <Text style={styles.notesLabel}>📝 Your Notes</Text>
      <TextInput
        style={styles.notesInput}
        placeholder="Write your notes here..."
        placeholderTextColor="rgba(255,255,255,0.4)"
        multiline
        value={notes}
        onChangeText={setNotes}
      />

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.btnGhost} onPress={handlePrevPage}>
          <Text style={styles.btnText}>◀ Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.btnPrimary} onPress={handleNextPage}>
          <Text style={styles.btnTextDark}>
            {pageNum === TOTAL_PAGES ? "Finish" : "Next ▶"}
          </Text>
        </TouchableOpacity>
      </View>

      {showEnd && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupBox}>
            <Text style={styles.popupTitle}>🎉 Module Complete!</Text>
            <Text style={styles.popupText}>You earned {XP_ON_COMPLETE} XP</Text>

            <TouchableOpacity
              style={styles.popupPlayBtn}
              onPress={() => startGame("QuizGame")}
            >
              <Text style={styles.btnTextDark}>❓ Quiz Game</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.popupPlayBtn}
              onPress={() => startGame("RPSGame")}
            >
              <Text style={styles.btnTextDark}>⚔️ RPS Challenge</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.popupBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.btnText}>Exit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

/* =======================
   STYLES
======================= */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#151557",
  },

  exitText: { color: "#fff", marginBottom: 8 },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 10,
  },

  metaText: { color: "#fff" },

  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    marginBottom: 16,
  },

  progressFill: {
    height: "100%",
    backgroundColor: "#9b5bff",
    borderRadius: 20,
  },

  pdf: {
    width: "100%",
    height: 420,
    marginBottom: 20,
    backgroundColor: "#000",
  },

  notesLabel: { color: "#fff", fontWeight: "700" },

  notesInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    minHeight: 120,
    marginBottom: 20,
  },

  navRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  btnGhost: {
    backgroundColor: "rgba(255,255,255,0.18)",
    padding: 12,
    borderRadius: 12,
  },

  btnPrimary: {
    backgroundColor: "#ff3ccf",
    padding: 12,
    borderRadius: 12,
  },

  btnText: { color: "#fff", fontWeight: "700" },
  btnTextDark: { color: "#111", fontWeight: "700" },

  popupOverlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
  },

  popupBox: {
    backgroundColor: "#3a1f8f",
    padding: 20,
    borderRadius: 14,
    width: "85%",
  },

  popupTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },

  popupText: { color: "#fff", textAlign: "center", marginBottom: 12 },

  popupPlayBtn: {
    backgroundColor: "#7a4fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },

  popupBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
