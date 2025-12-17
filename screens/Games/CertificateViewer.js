import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { useNavigation, useRoute } from "@react-navigation/native";

export default function CertificateViewer() {
  const navigation = useNavigation();
  const route = useRoute();
  const { certificate_url } = route.params;

  // Use Google Docs PDF Viewer for Expo compatibility
  const viewerUrl = `https://docs.google.com/gview?embedded=true&url=${certificate_url}`;

  return (
    <View style={styles.container}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Certificate</Text>

        {/* Spacer for perfect centering */}
        <View style={{ width: 50 }} />
      </View>

      {/* PDF VIEW */}
      <WebView
        source={{ uri: viewerUrl }}
        style={{ flex: 1 }}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ffffff" />
            <Text style={styles.loadingText}>Loading certificate…</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a2e",
  },

  header: {
    paddingTop: 55,
    paddingBottom: 18,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },

  backText: {
    color: "#cfcfcf",
    fontSize: 18,
    fontWeight: "500",
  },

  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    color: "#fff",
    marginTop: 12,
    fontSize: 16,
    opacity: 0.8,
  },
});
