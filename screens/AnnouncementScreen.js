import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

const BASE = "http://192.168.100.180:5001";


export default function AnnouncementScreen() {
  const navigation = useNavigation();

  const [announcements, setAnnouncements] = useState([]);
  const [toDelete, setToDelete] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 4;

  /* ============================================
        LOAD FROM BACKEND
  ============================================ */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/announcements`);
        const data = await res.json();

        const parsed = (data.announcements || []).map((a) => ({
          id: a.id,
          title: a.title,
          body: a.body,
          category: a.category,
          isNew: a.is_new === 1,
          date: new Date(a.created_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        }));

        setAnnouncements(parsed);
      } catch (err) {
        console.log("Announcement error:", err);
      }
    };

    load();
  }, []);

  /* ============================================
        PAGINATION
  ============================================ */
  const totalPages = Math.max(
    1,
    Math.ceil(announcements.length / perPage)
  );

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * perPage;
    return announcements.slice(start, start + perPage);
  }, [announcements, currentPage]);

  const goToPage = (n) => {
    if (n >= 1 && n <= totalPages) setCurrentPage(n);
  };

  /* ============================================
        CATEGORY COLORS
  ============================================ */
  const catColors = {
    info: "#4DA8FF",
    warning: "#FFCC55",
    update: "#C39BFF",
  };

  return (
    <LinearGradient
      colors={["#0b0830", "#2a1167", "#4a2bff"]}
      style={{ flex: 1 }}
    >
      <ScrollView
        contentContainerStyle={{
          padding: 20,
          paddingTop: 70,
          paddingBottom: 120,
        }}
      >
        {/* HEADER */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Announcements</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* No Announcements */}
        {pageItems.length === 0 && (
          <View style={styles.emptyCard}>
            <Text style={{ color: "white" }}>📭 No announcements yet.</Text>
          </View>
        )}

        {/* ANNOUNCEMENT CARDS */}
        {pageItems.map((a) => (
          <View key={a.id} style={styles.card}>
            {/* CATEGORY */}
            <View style={styles.categoryRow}>
              <View
                style={[
                  styles.categoryTag,
                  { backgroundColor: `${catColors[a.category]}25` },
                ]}
              >
                <FontAwesome5
                  name={
                    a.category === "warning"
                      ? "exclamation-triangle"
                      : a.category === "info"
                      ? "info-circle"
                      : "sync"
                  }
                  size={14}
                  color={catColors[a.category]}
                />
                <Text
                  style={[
                    styles.categoryText,
                    { color: catColors[a.category] },
                  ]}
                >
                  {a.category.toUpperCase()}
                </Text>
              </View>

              {a.isNew && <Text style={styles.newBadge}>NEW</Text>}
            </View>

            <View style={styles.titleRow}>
              <Text style={styles.title}>{a.title}</Text>
              <Text style={styles.date}>{a.date}</Text>
            </View>

            <Text style={styles.body}>{a.body}</Text>
          </View>
        ))}

        {/* PAGINATION */}
        <View style={styles.paginationRow}>
          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <Text style={styles.pageBtnText}>◀ Prev</Text>
          </TouchableOpacity>

          <View style={styles.pageNums}>
            {Array.from({ length: totalPages }, (_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => goToPage(i + 1)}
                style={[
                  styles.pageNum,
                  currentPage === i + 1 && styles.pageNumActive,
                ]}
              >
                <Text style={styles.pageNumText}>{i + 1}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.pageBtn}
            onPress={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <Text style={styles.pageBtnText}>Next ▶</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  backText: { color: "white", fontSize: 18 },
  headerTitle: { color: "white", fontSize: 22, fontWeight: "800" },

  emptyCard: {
    marginTop: 30,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    borderRadius: 18,
  },

  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  categoryText: { marginLeft: 6, fontWeight: "700", fontSize: 12 },

  newBadge: {
    backgroundColor: "#ff4f81",
    color: "white",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "700",
    fontSize: 12,
  },

  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  title: { color: "white", fontWeight: "700", fontSize: 18 },
  date: { color: "#ccc", fontSize: 12 },

  body: {
    marginTop: 12,
    color: "white",
    opacity: 0.9,
    lineHeight: 20,
  },

  /* Pagination */
  paginationRow: {
    marginTop: 26,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },

  pageBtn: {
    padding: 10,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
  },
  pageBtnText: { color: "white", fontWeight: "700" },

  pageNums: { flexDirection: "row", gap: 8 },
  pageNum: { padding: 8, borderRadius: 8 },
  pageNumActive: {
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  pageNumText: { color: "white", fontWeight: "700" },
});
