import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function QuizArenaScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  const { module_id, questions, student_id, completed } = route.params || {};

  const [showWarning, setShowWarning] = useState(false);

  // ❗ If no module completion data → don't allow entry
  const blockAccess = () => {
    setShowWarning(true);
  };

  return (
    <LinearGradient colors={["#151557", "#3c1aa0", "#7a33ff"]} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>

          {/* TOP */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Game Arena</Text>
            <View style={{ width: 60 }} />
          </View>

          <Text style={styles.subtitle}>🎮 Choose a Game</Text>

          {/* GAME CARDS */}
          <GameCard
            title="🟣 Bato Bato Pick"
            desc="Classic rock-paper-scissors with module questions."
            onPress={blockAccess}
          />

          <GameCard
            title="🟡 RPS Challenge"
            desc="Win RPS rounds and answer bonus questions!"
            onPress={blockAccess}
          />

          <GameCard
            title="🔵 Quiz Game"
            desc="Multiple-choice questions from your module."
            onPress={blockAccess}
          />

          <GameCard
            title="🟢 Matching Game"
            desc="Match questions with correct answers."
            onPress={blockAccess}
          />

        </ScrollView>
      </SafeAreaView>

      {/* WARNING POPUP */}
      <Modal visible={showWarning} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>📘 Study First</Text>
            <Text style={styles.modalMsg}>
              Please complete the module before playing any games.
            </Text>

            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => setShowWarning(false)}
            >
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

/* REUSABLE GAME CARD COMPONENT */
function GameCard({ title, desc, onPress }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDesc}>{desc}</Text>

      <TouchableOpacity style={styles.playBtn} onPress={onPress}>
        <Text style={styles.playText}>▶ Play</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 60 },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backText: { color: "#fff", fontSize: 18 },
  title: { color: "#fff", fontSize: 22, fontWeight: "700" },
  subtitle: {
    marginTop: 12,
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  card: {
    marginTop: 18,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 18,
  },
  cardTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardDesc: { color: "#dcdcff", marginVertical: 8 },
  playBtn: {
    marginTop: 10,
    backgroundColor: "#7a4fff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  playText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  /* POPUP */
  modalBg: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
  },
  modalTitle: { fontSize: 22, fontWeight: "800", marginBottom: 10 },
  modalMsg: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  modalBtn: {
    backgroundColor: "#7a4fff",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 12,
  },
  modalBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});
