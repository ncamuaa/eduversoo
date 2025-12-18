import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Modal,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { API_URL } from "../../config/api";

const API_BASE = API_URL;

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

  /* ================= STATE (UNCHANGED) ================= */
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

  /* ================= RESET (UNCHANGED) ================= */
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

  /* ================= QUESTION TIMER (UNCHANGED) ================= */
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

  /* ================= RPS ROUND (UNCHANGED) ================= */
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

  /* ================= NEXT ROUND (UNCHANGED) ================= */
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

  /* ================= ANSWER QUESTION (UNCHANGED) ================= */
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

  /* ================= FINISH GAME (UNCHANGED) ================= */
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
      <LinearGradient colors={["#1b0f3b", "#2b1a5a"]} style={{ flex: 1 }}>
        <StatusBar barStyle="light-content" />
        <View style={styles.menuContainer}>
          <Text style={styles.title}>RPS GAME</Text>

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
    <LinearGradient colors={["#1b0f3b", "#2b1a5a"]} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />

      {/* Neon Frame */}
      <View style={styles.neonFrame} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setShowHint(true)}>
          <Ionicons name="bulb-outline" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        {/* Round */}
        <View style={styles.roundPill}>
          <Text style={styles.roundText}>
            Round {round} / {TOTAL_ROUNDS}
          </Text>
        </View>

        {/* VS */}
        <Text style={styles.vsText}>VS</Text>

        {/* Arena */}
        <View style={styles.arena}>
          {playerChoice && (
            <Image source={hands[playerChoice]} style={styles.bigHand} />
          )}
          {cpuChoice && (
            <Image source={hands[cpuChoice]} style={styles.bigHand} />
          )}
        </View>

        <Text style={styles.resultText}>{result}</Text>

        {/* Choices */}
        <View style={styles.choiceRow}>
          {CHOICES.map((c) => (
            <TouchableOpacity
              key={c}
              style={[
                styles.choiceBtn,
                playerChoice && styles.choiceDisabled,
              ]}
              onPress={() => playRound(c)}
              disabled={!!playerChoice}
            >
              <Image source={hands[c]} style={styles.choiceIcon} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Score */}
        <View style={styles.scorePill}>
          <Text style={styles.scoreText}>
            Score: {score} / {MAX_SCORE}
          </Text>
        </View>
      </View>

      {/* ================= MODALS (UNCHANGED LOGIC) ================= */}
      <Modal visible={showInstructions} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📘 Instructions</Text>
            <Text style={styles.modalText}>
              • Win RPS rounds to gain points{"\n"}
              • Challenge mode adds quiz{"\n"}
              • Higher score = more XP
            </Text>
            <TouchableOpacity
              style={styles.qBtn}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.qText}>Start</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

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

      <Modal visible={showHint} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>💡 Hint</Text>
            <Text style={styles.modalText}>
              Win RPS + answer quiz for more points
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
  neonFrame: {
    position: "absolute",
    top: 40,
    bottom: 40,
    left: 20,
    right: 20,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#3dfcff",
    shadowColor: "#3dfcff",
    shadowOpacity: 0.9,
    shadowRadius: 25,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },

  menuContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#7df9ff",
    marginBottom: 40,
  },

  menuBtn: {
    backgroundColor: "#2b1a5a",
    padding: 18,
    width: "75%",
    borderRadius: 22,
    marginBottom: 18,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#4efcff",
  },

  menuBtnText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  container: {
    alignItems: "center",
    paddingTop: 10,
  },

  roundPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 28,
    paddingVertical: 8,
    borderRadius: 20,
  },

  roundText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  vsText: {
    fontSize: 52,
    fontWeight: "900",
    color: "#7df9ff",
    marginVertical: 30,
  },

  arena: {
    flexDirection: "row",
    gap: 20,
  },

  bigHand: {
    width: 110,
    height: 110,
  },

  resultText: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "800",
    marginTop: 20,
  },

  choiceRow: {
    flexDirection: "row",
    marginTop: 30,
  },

  choiceBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#2b1a5a",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 14,
    borderWidth: 2,
    borderColor: "#4efcff",
  },

  choiceDisabled: {
    opacity: 0.4,
  },

  choiceIcon: {
    width: 44,
    height: 44,
  },

  scorePill: {
    marginTop: 30,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#4efcff",
  },

  scoreText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },

  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalBox: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 22,
    width: "85%",
  },

  modalTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 10,
  },

  modalText: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  qTitle: {
    fontSize: 18,
    marginBottom: 12,
    textAlign: "center",
  },

  qBtn: {
    backgroundColor: "#6236ff",
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
  },

  qText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 15,
  },

  timer: {
    color: "#e63946",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
});
