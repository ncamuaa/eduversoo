import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const API_BASE = "http://192.168.100.180:5001";

const hands = {
  rock: require("../../assets/rock.png"),
  paper: require("../../assets/paper.png"),
  scissors: require("../../assets/scissors.png"),
};

const CHOICES = ["rock", "paper", "scissors"];
const TOTAL_ROUNDS = 5;
const QUESTION_TIME = 10;

export default function RPSGame() {
  const navigation = useNavigation();
  const route = useRoute();

  const { module_id, student_id, questions = [] } = route.params ?? {};

  const TOTAL_QUESTIONS = Array.isArray(questions) ? questions.length : 0;
  const MAX_SCORE = TOTAL_ROUNDS + TOTAL_QUESTIONS;

  /* ================= STATE ================= */
  const [mode, setMode] = useState("menu");
  const [round, setRound] = useState(1);
  const [playerChoice, setPlayerChoice] = useState(null);
  const [cpuChoice, setCpuChoice] = useState(null);
  const [result, setResult] = useState("");
  const [score, setScore] = useState(0);

  const [showQuestion, setShowQuestion] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME);

  const [showInstructions, setShowInstructions] = useState(true);
  const [showHint, setShowHint] = useState(false);

  /* ================= RESET ================= */
  useEffect(() => {
    resetGame();
  }, [mode]);

  const resetGame = () => {
    setRound(1);
    setScore(0);
    setPlayerChoice(null);
    setCpuChoice(null);
    setResult("");
    setShowQuestion(false);
    setCurrentQuestion(0);
    setTimeLeft(QUESTION_TIME);
  };

  /* ================= QUESTION TIMER ================= */
  useEffect(() => {
    if (!showQuestion) return;

    if (timeLeft === 0) {
      setShowQuestion(false);
      nextRound();
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, showQuestion]);

  /* ================= RPS ROUND ================= */
  const playRound = (choice) => {
    setPlayerChoice(choice);

    const cpu = CHOICES[Math.floor(Math.random() * 3)];
    setCpuChoice(cpu);

    if (choice === cpu) setResult("TIE!");
    else if (
      (choice === "rock" && cpu === "scissors") ||
      (choice === "paper" && cpu === "rock") ||
      (choice === "scissors" && cpu === "paper")
    ) {
      setResult("YOU WIN!");
      setScore((s) => Math.min(s + 1, MAX_SCORE));
    } else {
      setResult("YOU LOSE!");
    }

    if (
      mode === "challenge" &&
      TOTAL_QUESTIONS > 0 &&
      currentQuestion < TOTAL_QUESTIONS
    ) {
      setTimeout(() => {
        setShowQuestion(true);
        setTimeLeft(QUESTION_TIME);
      }, 600);
    } else {
      nextRound();
    }
  };

  /* ================= NEXT ROUND ================= */
  const nextRound = () => {
    if (round < TOTAL_ROUNDS) {
      setRound((r) => r + 1);
      setPlayerChoice(null);
      setCpuChoice(null);
      setResult("");
    } else {
      finishGame();
    }
  };

  /* ================= ANSWER QUESTION ================= */
  const answerQuestion = (answer) => {
    const q = questions[currentQuestion];
    if (!q) return;

    if (answer === q.correct_answer) {
      setScore((s) => Math.min(s + 1, MAX_SCORE));
    }

    setShowQuestion(false);

    if (currentQuestion < TOTAL_QUESTIONS - 1) {
      setCurrentQuestion((q) => q + 1);
    }

    nextRound();
  };

  /* ================= FINISH GAME ================= */
  const finishGame = () => {
    navigation.replace("FinalResult", {
      student_id: Number(student_id),
      module_id: Number(module_id),
      correct: Number(score),
      total: Number(MAX_SCORE),
      game_name: mode === "classic" ? "RPS Classic" : "RPS Challenge",
    });
  };

  /* ================= MENU ================= */
  if (mode === "menu") {
    return (
      <LinearGradient colors={["#2b1e78", "#5620e0"]} style={{ flex: 1 }}>
        <View style={styles.menuContainer}>
          <Text style={styles.title}>RPS Game</Text>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              setMode("classic");
              setShowInstructions(true);
            }}
          >
            <Text style={styles.menuBtnText}>🎮 Classic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              setMode("challenge");
              setShowInstructions(true);
            }}
          >
            <Text style={styles.menuBtnText}>🧠 Challenge</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  /* ================= GAME ================= */
  return (
    <LinearGradient colors={["#1b0b42", "#3c1ca8"]} style={{ flex: 1 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setShowHint(true)}>
          <Ionicons name="bulb-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <Text style={styles.roundLabel}>
          Round {round} / {TOTAL_ROUNDS}
        </Text>

        <View style={styles.arena}>
          {playerChoice && <Image source={hands[playerChoice]} style={styles.bigHand} />}
          <Text style={styles.vs}>VS</Text>
          {cpuChoice && <Image source={hands[cpuChoice]} style={styles.bigHand} />}
        </View>

        <Text style={styles.resultText}>{result}</Text>

        <View style={styles.choiceRow}>
          {CHOICES.map((c) => (
            <TouchableOpacity
              key={c}
              style={styles.choiceBtn}
              onPress={() => playRound(c)}
              disabled={!!playerChoice}
            >
              <Image source={hands[c]} style={styles.choiceIcon} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.scoreText}>
          Score: {score} / {MAX_SCORE}
        </Text>
      </View>

      {/* ================= INSTRUCTIONS ================= */}
      <Modal visible={showInstructions} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📘 RPS Instructions</Text>
            <Text style={styles.modalText}>
              • Win RPS rounds to gain points{"\n"}
              • Challenge mode adds quiz questions{"\n"}
              • Higher score = more XP
            </Text>

            <TouchableOpacity
              style={styles.qBtn}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.qText}>Start Game 🚀</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ================= QUESTION ================= */}
      <Modal visible={showQuestion} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.timer}>⏱ {timeLeft}s</Text>

            <Text style={styles.qTitle}>
              {questions[currentQuestion]?.question}
            </Text>

            {["choice_a", "choice_b", "choice_c", "choice_d"].map((key) => (
              <TouchableOpacity
                key={key}
                style={styles.qBtn}
                onPress={() =>
                  answerQuestion(questions[currentQuestion]?.[key])
                }
              >
                <Text style={styles.qText}>
                  {questions[currentQuestion]?.[key]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* ================= HINT ================= */}
      <Modal visible={showHint} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💡 Hint</Text>
            <Text style={styles.modalText}>
              Winning RPS gives points — answering quiz correctly gives bonus!
            </Text>
            <TouchableOpacity
              style={styles.qBtn}
              onPress={() => setShowHint(false)}
            >
              <Text style={styles.qText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  menuContainer: { flex: 1, alignItems: "center", paddingTop: 100 },
  title: { fontSize: 32, color: "#fff", marginBottom: 40 },
  menuBtn: {
    backgroundColor: "#7a4fff",
    padding: 16,
    width: "70%",
    borderRadius: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  menuBtnText: { color: "#fff", fontSize: 18 },

  container: { alignItems: "center", paddingTop: 20 },
  roundLabel: { color: "#fff", fontSize: 22 },
  arena: { flexDirection: "row", marginVertical: 30, alignItems: "center" },
  bigHand: { width: 120, height: 120 },
  vs: { color: "#fff", fontSize: 32, marginHorizontal: 20 },
  resultText: { color: "#fff", fontSize: 26 },
  choiceRow: { flexDirection: "row", marginTop: 20 },
  choiceBtn: { padding: 12 },
  choiceIcon: { width: 50, height: 50 },
  scoreText: { color: "#fff", fontSize: 20, marginTop: 20 },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 16 },
  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  modalText: { fontSize: 15, lineHeight: 22 },

  qTitle: { fontSize: 18, marginBottom: 12 },
  qBtn: {
    backgroundColor: "#6236ff",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  qText: { color: "#fff", textAlign: "center" },
  timer: { color: "#e63946", fontWeight: "700", marginBottom: 8 },
});
