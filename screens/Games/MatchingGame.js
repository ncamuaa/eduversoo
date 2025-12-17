import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const MAX_PAIRS = 3;

export default function MatchingGame({ route, navigation }) {
  const { questions, student_id, module_id } = route.params;

  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState([]);
  const [matched, setMatched] = useState([]);
  const [score, setScore] = useState(0);

  const [showInstructions, setShowInstructions] = useState(true);
  const [showHint, setShowHint] = useState(false);

  /* BUILD CARDS */
  useEffect(() => {
    if (!Array.isArray(questions)) return;

    const limited = questions.slice(0, MAX_PAIRS);
    const pairs = [];

    limited.forEach((q, i) => {
      pairs.push({ id: `Q${i}`, type: "q", pair: i, text: q.question });
      pairs.push({
        id: `A${i}`,
        type: "a",
        pair: i,
        text: q.correct_answer,
      });
    });

    setCards(pairs.sort(() => Math.random() - 0.5));
  }, [questions]);

  const tapCard = (card) => {
    if (selected.length === 2 || matched.includes(card.id)) return;

    const next = [...selected, card];
    setSelected(next);

    if (next.length === 2) {
      const [a, b] = next;
      if (a.pair === b.pair && a.type !== b.type) {
        setMatched((m) => [...m, a.id, b.id]);
        setScore((s) => s + 1);
      }
      setTimeout(() => setSelected([]), 700);
    }
  };

  useEffect(() => {
    if (cards.length && matched.length === cards.length) {
      navigation.replace("FinalResultScreen", {
        student_id,
        module_id,
        correct: score,
        total: MAX_PAIRS,
        game_name: "Matching Game",
      });
    }
  }, [matched]);

  return (
    <LinearGradient colors={["#3b1d8f", "#5327c8"]} style={{ flex: 1 }}>
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
            <Text style={styles.modalTitle}>🧩 Matching Game</Text>
            <Text style={styles.modalText}>
              Match each question with the correct answer.
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowInstructions(false)}
            >
              <Text style={styles.primaryText}>Start Game 🚀</Text>
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
              Remember the card positions after flipping!
            </Text>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => setShowHint(false)}
            >
              <Text style={styles.primaryText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* GAME */}
      {!showInstructions && (
        <View style={styles.container}>
          <Text style={styles.title}>🧠 Matching Game</Text>
          <Text style={styles.score}>Score: {score} / {MAX_PAIRS}</Text>

          <View style={styles.grid}>
            {cards.map((card) => {
              const visible =
                selected.some((s) => s.id === card.id) ||
                matched.includes(card.id);

              return (
                <TouchableOpacity
                  key={card.id}
                  style={[styles.card, visible && styles.cardOpen]}
                  onPress={() => tapCard(card)}
                >
                  <Text style={styles.cardText}>
                    {visible ? card.text : "?"}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  container: { alignItems: "center", paddingTop: 40 },
  title: { color: "#fff", fontSize: 28, fontWeight: "700" },
  score: { color: "#fff", marginBottom: 20 },

  grid: {
    width: "90%",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  card: {
    width: "28%",
    height: 90,
    backgroundColor: "#6b39ff",
    margin: 10,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  cardOpen: { backgroundColor: "#9d7dff" },
  cardText: { color: "#fff", textAlign: "center", fontWeight: "700" },

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
  primaryBtn: {
    backgroundColor: "#6c63ff",
    padding: 14,
    borderRadius: 14,
    marginTop: 16,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "700" },
});
