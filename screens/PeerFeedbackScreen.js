import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Modal
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const BASE = "http://192.168.100.180:5001/api/feedback";

export default function PeerFeedbackScreen() {
  const navigation = useNavigation();

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  /* =============================
       FETCH FEEDBACK FROM API
  ============================== */
  const loadFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch(API);
      const data = await res.json();
      setFeedback(data.feedback || []);
    } catch (err) {
      console.error("FEEDBACK LOAD ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  /* =============================
       SEARCH FILTER
  ============================== */
  const filtered = useMemo(() => {
    return feedback.filter(
      (item) =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.text.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, feedback]);

  return (
    <LinearGradient colors={["#0b0830", "#2a1167", "#4a2bff"]} style={{ flex: 1 }}>
      
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 60, paddingBottom: 120 }}>

        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Peer Feedback</Text>

          <TouchableOpacity
            onPress={() => setSearchOpen(!searchOpen)}
            style={styles.searchBtn}
          >
            <Text style={{ color: "white" }}>{searchOpen ? "Close" : "Search"} 🔎</Text>
          </TouchableOpacity>
        </View>

        {/* Search Input */}
        {searchOpen && (
          <TextInput
            style={styles.searchInput}
            placeholder="Search feedback..."
            placeholderTextColor="#bbb"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        )}

        {/* Loading */}
        {loading && <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />}

        {/* Feedback Cards */}
        {!loading &&
          (filtered.length ? (
            filtered.map((item) => (
              <TouchableOpacity key={item.id} style={styles.card} onPress={() => setSelected(item)}>
                
                {/* Tag + Date */}
                <View style={styles.metaRow}>
                  <View
                    style={[
                      styles.tag,
                      item.tag === "Info" && { backgroundColor: "#5db9ff55" },
                      item.tag === "Review" && { backgroundColor: "#9a6bff55" },
                      item.tag === "General" && { backgroundColor: "#ffffff33" },
                    ]}
                  >
                    <Text style={styles.tagText}>{item.tag}</Text>
                  </View>

                  <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.body}>{item.text}</Text>

                <View style={styles.bottomRow}>
                  <Text style={styles.rating}>{"⭐".repeat(item.stars)}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noFeedback}>No feedback found.</Text>
          ))}

      </ScrollView>

      {/* View Modal */}
      <Modal visible={!!selected} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalDate}>
              {selected?.student} • {new Date(selected?.date).toLocaleDateString()}
            </Text>

            <Text style={styles.modalBody}>{selected?.text}</Text>

            <Text style={styles.modalStars}>{"⭐".repeat(selected?.stars || 5)}</Text>

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelected(null)}>
              <Text style={{ color: "white", fontWeight: "700" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

/* =============================
     STYLES
============================= */
const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  backText: { color: "white", fontSize: 18 },
  headerTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "700",
  },
  searchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
  },
  searchInput: {
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    color: "white",
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 18,
    borderRadius: 18,
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  tagText: {
    fontWeight: "700",
    color: "#fff",
  },
  date: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },
  title: {
    color: "white",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 8,
  },
  body: {
    color: "rgba(255,255,255,0.9)",
    marginTop: 8,
    lineHeight: 20,
  },
  bottomRow: {
    marginTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    color: "#ffd86b",
    fontSize: 16,
  },
  noFeedback: {
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    marginTop: 20,
  },

  /* Modal */
  modalBg: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1b1740",
    padding: 22,
    width: "85%",
    borderRadius: 20,
  },
  modalTitle: { color: "#fff", fontSize: 20, fontWeight: "700" },
  modalDate: { color: "#ccc", marginTop: 6 },
  modalBody: { color: "#eee", marginTop: 14, lineHeight: 22 },
  modalStars: { marginTop: 14, fontSize: 18, color: "#ffd86b" },
  closeModalBtn: {
    marginTop: 16,
    backgroundColor: "#6b46ff",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
  },
});
