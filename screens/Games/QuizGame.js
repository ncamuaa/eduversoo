import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = "http://192.168.100.180:5001";
const TIME_LIMIT = 10;

export default function QuizGame({ route, navigation }) {
  const { module_id, student_id } = route.params;

  const [questions, setQuestions] = useState(null);
  const [index, setIndex] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [selected, setSelected] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);

  const [showInstructions, setShowInstructions] = useState(true);
  const [showHint, setShowHint] = useState(false);

  /* ================= FETCH QUESTIONS ================= */
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/games/questions/${module_id}`
        );
        const data = await res.json();

        if (!Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error("No questions returned");
        }

        setQuestions(data.questions);
      } catch (err) {
        console.error("❌ Quiz fetch error:", err);
        setQuestions([]);
      }
    };

    loadQuestions();
  }, [module_id]);

  /* ================= TIMER ================= */
  useEffect(() => {
    if (showInstructions || showAnswer || !questions) return;

    if (timeLeft === 0) {
      nextQuestion();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, showAnswer, showInstructions, questions]);

  /* ================= LOADING ================= */
  if (questions === null) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>Loading questions…</Text>
      </SafeAreaView>
    );
  }

  if (questions.length === 0) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.loadingText}>No questions available.</Text>
      </SafeAreaView>
    );
  }

  const current = questions[index];

  /* ================= ACTIONS ================= */
  const selectAnswer = (answer) => {
    setSelected(answer);
    setShowAnswer(true);

    if (answer === current.correct_answer) {
      setCorrectCount((c) => c + 1);
    }
  };

  const nextQuestion = () => {
    if (index < questions.length - 1) {
      setIndex((i) => i + 1);
      setSelected(null);
      setShowAnswer(false);
      setTimeLeft(TIME_LIMIT);
    } else {
      navigation.replace("FinalResult", {
        student_id: Number(student_id),
        module_id: Number(module_id),
        correct: Number(correctCount),
        total: Number(questions.length),
        game_name: "Quiz Game",
      });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowHint(true)}>
          <Ionicons name="bulb-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* INSTRUCTIONS */}
      <Modal visible={showInstructions} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>📘 Quiz Instructions</Text>
            <Text style={styles.modalText}>
              • 10 questions{"\n"}
              • 10 seconds per question{"\n"}
              • Answer quickly and correctly
            </Text>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.primaryText}>Start Quiz 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HINT */}
      <Modal visible={showHint} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💡 Hint</Text>
            <Text style={styles.modalText}>
              Eliminate wrong choices first and watch the timer!
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowHint(false)}
            >
              <Text style={styles.primaryText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QUIZ */}
      {!showInstructions && (
        <View style={styles.card}>
          <Text style={styles.timer}>⏱ {timeLeft}s</Text>
          <Text style={styles.counter}>
            Question {index + 1} / {questions.length}
          </Text>

          <Text style={styles.question}>{current.question}</Text>

          {["choice_a", "choice_b", "choice_c", "choice_d"].map((key) => {
            const value = current[key];
            const correct = value === current.correct_answer;
            const wrong = value === selected && !correct;

            return (
              <TouchableOpacity
                key={key}
                disabled={showAnswer}
                onPress={() => selectAnswer(value)}
                style={[
                  styles.option,
                  showAnswer && correct && styles.correct,
                  showAnswer && wrong && styles.wrong,
                ]}
              >
                <Text>{value}</Text>
              </TouchableOpacity>
            );
          })}

          {showAnswer && (
            <TouchableOpacity style={styles.primaryBtn} onPress={nextQuestion}>
              <Text style={styles.primaryText}>
                {index < questions.length - 1 ? "Next →" : "Finish 🏁"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}


/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#1B0F3B", padding: 16 },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#fff", marginTop: 10 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20 },
  counter: { color: "#777", marginBottom: 6 },
  timer: { color: "#e63946", fontWeight: "700", marginBottom: 6 },
  question: { fontSize: 18, fontWeight: "700", marginBottom: 16 },

  option: {
    backgroundColor: "#f0f3fa",
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
  },
  correct: { backgroundColor: "#4caf50" },
  wrong: { backgroundColor: "#e63946" },

  primaryBtn: {
    backgroundColor: "#6c63ff",
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 22,
    width: "85%",
    borderRadius: 18,
  },
  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 12 },
  modalText: { fontSize: 15, lineHeight: 22 },
});
567