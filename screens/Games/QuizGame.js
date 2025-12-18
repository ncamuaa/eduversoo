import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { API_URL } from "../../config/api";

const API_BASE = API_URL;
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
  const [hintUsed, setHintUsed] = useState(false);
  const [eliminatedOptions, setEliminatedOptions] = useState([]);

  /* ================= FETCH QUESTIONS ================= */
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/games/questions/${module_id}`);
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
      setHintUsed(false);
      setEliminatedOptions([]);
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

  /* ================= HINT LOGIC ================= */
  const useHint = () => {
    if (hintUsed) return;
    
    // Eliminate 2 wrong answers
    const allOptions = ["choice_a", "choice_b", "choice_c", "choice_d"];
    const wrongOptions = allOptions.filter(key => current[key] !== current.correct_answer);
    
    // Randomly select 2 to eliminate
    const shuffled = wrongOptions.sort(() => 0.5 - Math.random());
    const toEliminate = shuffled.slice(0, 2);
    
    setEliminatedOptions(toEliminate);
    setHintUsed(true);
    setShowHint(false);
  };

  return (
    <LinearGradient colors={["#2b1055", "#7597de"]} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.innerContainer}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.progressContainer}>
             <View style={[styles.progressBar, { width: `${((index + 1) / questions.length) * 100}%` }]} />
          </View>

          <TouchableOpacity 
            onPress={() => setShowHint(true)} 
            disabled={hintUsed}
            style={[styles.iconBtn, hintUsed && styles.disabledBtn]}
          >
            <Ionicons name="bulb" size={24} color={hintUsed ? "#aaa" : "#ffd700"} />
          </TouchableOpacity>
        </View>

      {/* INSTRUCTIONS */}
      <Modal visible={showInstructions} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Ionicons name="school-outline" size={50} color="#6c63ff" style={{marginBottom: 10}} />
            <Text style={styles.modalTitle}>Quiz Time!</Text>
            <Text style={styles.modalText}>
              • 10 questions{"\n"}
              • 10 seconds per question{"\n"}
              • Use hints wisely!
            </Text>

            <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowInstructions(false)}>
              <Text style={styles.primaryText}>Let's Go! 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HINT */}
      <Modal visible={showHint} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>💡 Need a Hint?</Text>
            <Text style={styles.modalText}>
              This will remove 2 wrong answers. You can only use this once per question!
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={useHint}>
              <Text style={styles.primaryText}>Use Hint</Text>
            </TouchableOpacity>
             <TouchableOpacity style={styles.secondaryBtn} onPress={() => setShowHint(false)}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* QUIZ */}
      {!showInstructions && (
        <View style={styles.card}>
           <View style={styles.timerContainer}>
             <Text style={[styles.timer, timeLeft <= 3 && styles.timerUrgent]}>
               {timeLeft}s
             </Text>
           </View>

          <Text style={styles.counter}>
            Question {index + 1} of {questions.length}
          </Text>

          <Text style={styles.question}>{current.question}</Text>

          {["choice_a", "choice_b", "choice_c", "choice_d"].map((key) => {
            const value = current[key];
            const correct = value === current.correct_answer;
            const wrong = value === selected && !correct;
            const isEliminated = eliminatedOptions.includes(key);

            if (isEliminated) return <View key={key} style={styles.optionPlaceholder} />;

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
                <View style={styles.optionCircle}>
                   <Text style={styles.optionLetter}>{key.split('_')[1].toUpperCase()}</Text>
                </View>
                <Text style={styles.optionText}>{value}</Text>
                {showAnswer && correct && <Ionicons name="checkmark-circle" size={24} color="#28a745" style={styles.resultIcon} />}
                {showAnswer && wrong && <Ionicons name="close-circle" size={24} color="#dc3545" style={styles.resultIcon} />}
              </TouchableOpacity>
            );
          })}

          {showAnswer && (
            <TouchableOpacity style={styles.primaryBtn} onPress={nextQuestion}>
              <Text style={styles.primaryText}>
                {index < questions.length - 1 ? "Next Question →" : "See Results �"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1 },
  innerContainer: { padding: 16, flex: 1 },

  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#2b1055" },
  loadingText: { color: "#fff", marginTop: 10, fontSize: 16 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  progressContainer: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 4,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ffd700',
    borderRadius: 4,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  timerContainer: {
    alignSelf: 'center',
    marginBottom: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f3fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#6c63ff',
  },
  timer: { color: "#6c63ff", fontWeight: "800", fontSize: 22 },
  timerUrgent: { color: "#e63946", borderColor: '#e63946' },
  
  counter: { color: "#888", marginBottom: 16, textAlign: 'center', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 },
  question: { fontSize: 20, fontWeight: "700", marginBottom: 32, textAlign: 'center', color: '#2b2b2b', lineHeight: 28 },

  option: {
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  optionPlaceholder: {
    height: 60,
    marginBottom: 12,
    opacity: 0.5,
  },
  optionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionLetter: {
    fontWeight: '700',
    color: '#495057',
  },
  optionText: { color: "#495057", fontSize: 16, fontWeight: '600', flex: 1 },
  resultIcon: { marginLeft: 8 },

  correct: { backgroundColor: "#d4edda", borderColor: "#28a745" },
  wrong: { backgroundColor: "#f8d7da", borderColor: "#dc3545" },

  primaryBtn: {
    backgroundColor: "#6c63ff",
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 'auto',
    alignItems: "center",
    shadowColor: "#6c63ff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryText: { color: "#fff", fontWeight: "700", fontSize: 18 },
  secondaryBtn: {
    paddingVertical: 14,
    marginTop: 12,
    alignItems: "center",
  },
  secondaryText: { color: "#6c63ff", fontWeight: "600", fontSize: 16 },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCard: {
    backgroundColor: "#fff",
    padding: 32,
    width: "85%",
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: { fontSize: 24, fontWeight: "800", marginBottom: 12, color: '#2b2b2b' },
  modalText: { fontSize: 16, lineHeight: 24, textAlign: 'center', color: '#666', marginBottom: 24 },
});
