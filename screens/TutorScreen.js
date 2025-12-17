// screens/TutorScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  TextInput,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Speech from "expo-speech";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

const BASE = "http://192.168.100.180:5001";


// CUSTOM MASCOT AVATAR (you can replace with your PNG)
const BOT_AVATAR = "https://i.imgur.com/7kZ1Q8b.png";

export default function TutorScreen() {
  const navigation = useNavigation();
  const flatRef = useRef(null);

  /* USER */
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("Student");

  /* CHAT */
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* XP / LEVEL */
  const [xp, setXp] = useState(0);

  /* RECORDING */
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  /* MODES */
  const [mode, setMode] = useState("study");

  /* LOAD USER & XP */
  useEffect(() => {
    (async () => {
      const id = await AsyncStorage.getItem("id");
      const name = await AsyncStorage.getItem("fullname");
      const storedXP = Number(await AsyncStorage.getItem("xp")) || 0;

      setUserId(id || "");
      setUsername(name || "Student");
      setXp(storedXP);

      setMessages([
        {
          id: String(Date.now()),
          sender: "bot",
          text: `Hi ${name || "Student"}! Ready to learn?`,
          time: new Date().toISOString(),
        },
      ]);
    })();
  }, []);

  /* AUTOSCROLL */
  useEffect(() => {
    if (flatRef.current) {
      flatRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  /* SPEAK */
  const speak = (text) => {
    Speech.stop();
    Speech.speak(text, { language: "en-US" });
  };

  /* XP */
  const addXp = async (amount) => {
    const next = xp + amount;
    setXp(next);
    await AsyncStorage.setItem("xp", String(next));
  };

  /* AI RESPONSE */
  const fetchAIResponse = async (msg) => {
    setLoading(true);

    const systemPrompt =
      mode === "explain"
        ? "You are an educational tutor. Explain clearly with simple examples."
        : mode === "exam"
        ? "You are an exam proctor. Ask strict questions and grade the student."
        : mode === "quiz"
        ? "You are a quiz generator. Ask short questions and wait for answers."
        : "You are a friendly tutor. Help the student learn in a simple way.";

    try {
      const res = await fetch(`${API_BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: msg,
          mode,
          system_prompt: systemPrompt,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn’t respond.";

      const botMsg = {
        id: Date.now() + "-bot",
        sender: "bot",
        text: reply,
        time: new Date().toISOString(),
      };

      setMessages((m) => [...m, botMsg]);
      speak(reply);
      addXp(1);
    } catch (err) {
      console.log("AI error:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!newMessage.trim()) return;

    const msg = newMessage.trim();
    setNewMessage("");

    const userMsg = {
      id: Date.now() + "-user",
      sender: "user",
      text: msg,
      time: new Date().toISOString(),
    };

    setMessages((m) => [...m, userMsg]);
    addXp(1);

    await fetchAIResponse(msg);
  };

  /* IMAGE PICKER */
  const pickImageAndSend = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert("Permission required");

    const img = await ImagePicker.launchImageLibraryAsync({ quality: 0.7 });
    if (img.canceled) return;

    const uri = img.assets[0].uri;
    const fileName = uri.split("/").pop();
    const type = fileName.split(".").pop();

    const form = new FormData();
    form.append("image", { uri, name: fileName, type: `image/${type}` });

    setLoading(true);

    const res = await fetch(`${API_BASE}/api/ai/image`, {
      method: "POST",
      body: form,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = await res.json();
    setLoading(false);

    setMessages((m) => [
      ...m,
      { id: Date.now() + "-user", sender: "user", text: "[Image sent]", image: uri, time: new Date().toISOString() },
      { id: Date.now() + "-bot", sender: "bot", text: data.reply, time: new Date().toISOString() },
    ]);

    speak(data.reply);
    addXp(2);
  };

  /* VOICE RECORDING */
  const startRecording = async () => {
    const p = await Audio.requestPermissionsAsync();
    if (!p.granted) return;

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const rec = new Audio.Recording();
    await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
    await rec.startAsync();

    setRecording(rec);
    setIsRecording(true);
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    await recording.stopAndUnloadAsync();

    const uri = recording.getURI();
    recording.setOnRecordingStatusUpdate(null);
    setRecording(null);

    // Upload
    const fileName = uri.split("/").pop();
    const form = new FormData();
    form.append("audio", { uri, name: fileName, type: "audio/wav" });

    const res = await fetch(`${API_BASE}/api/ai/stt`, {
      method: "POST",
      body: form,
      headers: { "Content-Type": "multipart/form-data" },
    });

    const data = await res.json();

    if (data.text) {
      const userMsg = {
        id: Date.now() + "-user",
        sender: "user",
        text: data.text,
        time: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      fetchAIResponse(data.text);
    }
  };

  const toggleRecording = () => {
    isRecording ? stopRecording() : startRecording();
  };

  /* MESSAGE RENDER */
  const renderMessage = ({ item }) => {
    const bot = item.sender === "bot";
    return (
      <View style={bot ? styles.msgRowBot : styles.msgRowUser}>
        {bot && <Image source={{ uri: BOT_AVATAR }} style={styles.avatar} />}

        <View style={[styles.msgBubble, bot ? styles.botBubble : styles.userBubble]}>
          {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
          <Text style={bot ? styles.textBot : styles.textUser}>{item.text}</Text>
        </View>

        <Text style={styles.timeText}>
          {new Date(item.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </Text>
      </View>
    );
  };

  /* UI */
  return (
    <LinearGradient colors={["#151557", "#3c1aa0", "#7a33ff"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        style={{ flex: 1 }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>AI Tutor</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* XP CARD */}
        <View style={styles.xpContainer}>
          <Text style={styles.xpNumber}>{xp}</Text>
          <Text style={styles.xpSub}>XP • Level {Math.floor(xp / 100) + 1}</Text>

          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${xp % 100}%` }]} />
          </View>
        </View>

        {/* MODES */}
        <View style={styles.modeRow}>
          {["study", "explain", "exam", "quiz"].map((m) => (
            <TouchableOpacity
              key={m}
              onPress={() => setMode(m)}
              style={[styles.modeBtn, mode === m && styles.modeActive]}
            >
              <Text style={[styles.modeText, mode === m && styles.modeTextActive]}>
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CHAT LIST */}
        <FlatList
          ref={flatRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 18, paddingBottom: 180 }}
        />

        {/* INPUT BAR */}
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.iconBtn} onPress={pickImageAndSend}>
            <Text style={{ fontSize: 22 }}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.chatInput}
            placeholder="Speak or type..."
            placeholderTextColor="#ddd"
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendChat}
          />

          <TouchableOpacity style={styles.sendBtn} onPress={sendChat}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendText}>Send</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleRecording}
            style={[styles.micBtn, isRecording && { backgroundColor: "#ff5b5b" }]}
          >
            <Text style={{ fontSize: 22 }}>{isRecording ? "🎙" : "🎤"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  header: {
    paddingTop: Platform.OS === "ios" ? 44 : 20,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  back: { color: "#fff", fontSize: 18, fontWeight: "700" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },

  /* XP CARD */
  xpContainer: {
    marginTop: 18,
    marginHorizontal: 18,
    padding: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
  },
  xpNumber: { color: "#fff", fontSize: 34, fontWeight: "800" },
  xpSub: { color: "#ddd", fontSize: 13, marginVertical: 6 },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    overflow: "hidden",
    marginTop: 6,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#7cf2ff",
  },

  /* MODES */
  modeRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  modeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  modeActive: {
    backgroundColor: "#7cf2ff",
  },
  modeText: {
    color: "#fff",
    fontWeight: "700",
  },
  modeTextActive: {
    color: "#06283d",
  },

  /* MESSAGES */
  msgRowBot: { marginVertical: 8, flexDirection: "column", alignItems: "flex-start" },
  msgRowUser: { marginVertical: 8, flexDirection: "column", alignItems: "flex-end" },

  avatar: { width: 38, height: 38, borderRadius: 20, marginBottom: 6 },

  msgBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 4,
  },
  botBubble: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderTopLeftRadius: 4,
  },
  userBubble: {
    backgroundColor: "#7cf2ff",
    borderTopRightRadius: 4,
  },
  msgImage: { width: 220, height: 150, borderRadius: 12, marginBottom: 8 },
  textBot: { color: "#fff", fontSize: 15 },
  textUser: { color: "#06283d", fontSize: 15 },
  timeText: { color: "#ccc", fontSize: 12, marginTop: 2 },

  /* INPUT BAR */
  inputBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  chatInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.12)",
    color: "#fff",
  },
  sendBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#8f78ff",
    borderRadius: 16,
  },
  sendText: { color: "#fff", fontWeight: "800" },
  micBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
});
