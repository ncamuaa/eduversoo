import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

const BASE = "http://192.168.100.180:5001";


export default function ModulesScreen() {
  const navigation = useNavigation();

  const [modules, setModules] = useState([]);
  const [page, setPage] = useState(1);
  const perPage = 4;

  /* =====================================================
     LOAD MODULES
  ===================================================== */
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${BASE}/api/modules`);
        const data = await res.json();

        // ✅ FIX: handle ANY backend response shape
        setModules(data.modules || data.data || data || []);
      } catch (e) {
        console.log("MODULES ERROR:", e);
        setModules([]);
      }
    };

    load();
  }, []);

  /* =====================================================
     PAGINATION
  ===================================================== */
  const totalPages = Math.max(1, Math.ceil(modules.length / perPage));
  const paginated = modules.slice(
    (page - 1) * perPage,
    page * perPage
  );

  return (
    <LinearGradient
      colors={["#151557", "#3c1aa0", "#7a33ff"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.container}>
          {/* HEADER */}
          <View style={styles.topRow}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>

            <Text style={styles.title}>📘 Available Modules</Text>

            <View style={{ width: 60 }} />
          </View>

          {/* EMPTY STATE */}
          {paginated.length === 0 && (
            <Text style={styles.emptyText}>
              No modules available
            </Text>
          )}

          {/* MODULE CARDS */}
          {paginated.map((m) => (
            <View key={m.id} style={styles.card}>
              <Text style={styles.cardTitle}>{m.title}</Text>
              <Text style={styles.cardDesc}>
                {m.description || "No description"}
              </Text>

              <TouchableOpacity
                style={styles.openBtn}
                onPress={() =>
                  navigation.navigate("ModuleViewer", { module: m })
                }
              >
                <Text style={styles.openBtnText}>Open</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* PAGINATION */}
          <View style={styles.pagination}>
            <Text
              style={[
                styles.pgBtn,
                page === 1 && styles.disabled,
              ]}
              onPress={() => page > 1 && setPage(page - 1)}
            >
              ◀ Prev
            </Text>

            <Text style={styles.pgNumber}>
              {page}/{totalPages}
            </Text>

            <Text
              style={[
                styles.pgBtn,
                page === totalPages && styles.disabled,
              ]}
              onPress={() => page < totalPages && setPage(page + 1)}
            >
              Next ▶
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

/* =====================================================
   STYLES
===================================================== */
const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 60,
  },

  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backText: {
    color: "#fff",
    fontSize: 18,
  },

  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  emptyText: {
    color: "#fff",
    marginTop: 30,
    textAlign: "center",
    opacity: 0.7,
  },

  card: {
    marginTop: 18,
    padding: 18,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  cardDesc: {
    color: "rgba(255,255,255,0.85)",
    marginVertical: 6,
  },

  openBtn: {
    marginTop: 12,
    backgroundColor: "#8c62ff",
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },

  openBtnText: {
    color: "#fff",
    fontWeight: "700",
  },

  pagination: {
    marginTop: 26,
    flexDirection: "row",
    justifyContent: "center",
    gap: 18,
    alignItems: "center",
  },

  pgBtn: {
    color: "#fff",
    fontSize: 16,
  },

  pgNumber: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  disabled: {
    opacity: 0.35,
  },
});
