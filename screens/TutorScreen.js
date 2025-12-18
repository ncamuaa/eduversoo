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
import { API_URL } from "../config/api";

const BASE = API_URL;
const BOT_AVATAR = "https://i.imgur.com/7kZ1Q8b.png";

export default function TutorScreen() {
  const navigation = useNavigation();
  const flatRef = useRef(null);

  /* USER */
  const [userId, setUserId] = useState("");
  const [username, setUsername] = useState("Student");
  const [xp, setXp] = useState(0);

  /* CHAT */
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* RECORDING */
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  /* LOAD USER */
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
    flatRef.current?.scrollToEnd({ animated: true });
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

  /* AI CHAT */
  const fetchAIResponse = async (msg) => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          message: msg,
        }),
      });

      const data = await res.json();
      const reply = data.reply || "Sorry, I couldn’t respond.";

      setMessages((m) => [
        ...m,
        {
          id: Date.now() + "-bot",
          sender: "bot",
          text: reply,
          time: new Date().toISOString(),
        },
      ]);

      speak(reply);
      addXp(1);
    } catch (err) {
      console.log("AI ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendChat = async () => {
    if (!newMessage.trim()) return;

    const msg = newMessage.trim();
    setNewMessage("");

    setMessages((m) => [
      ...m,
      {
        id: Date.now() + "-user",
        sender: "user",
        text: msg,
        time: new Date().toISOString(),
      },
    ]);

    addXp(1);
    await fetchAIResponse(msg);
  };

  /* IMAGE */
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

    const res = await fetch(`${BASE}/api/ai/image`, {
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

  /* VOICE */
  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      const form = new FormData();
      form.append("audio", { uri, name: "voice.wav", type: "audio/wav" });

      const res = await fetch(`${BASE}/api/ai/stt`, {
        method: "POST",
        body: form,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const data = await res.json();
      if (data.text) fetchAIResponse(data.text);
    } else {
      const p = await Audio.requestPermissionsAsync();
      if (!p.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await rec.startAsync();

      setRecording(rec);
      setIsRecording(true);
    }
  };

  /* MESSAGE */
  const renderMessage = ({ item }) => {
    const bot = item.sender === "bot";
    return (
      <View style={bot ? styles.msgBot : styles.msgUser}>
        {bot && <Image source={{ uri: BOT_AVATAR }} style={styles.avatar} />}
        <View style={[styles.bubble, bot ? styles.botBubble : styles.userBubble]}>
          {item.image && <Image source={{ uri: item.image }} style={styles.msgImage} />}
          <Text style={bot ? styles.botText : styles.userText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <LinearGradient colors={["#151557", "#3c1aa0", "#7a33ff"]} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>AI Tutor</Text>
          <View style={{ width: 50 }} />
        </View>

        {/* XP */}
        <View style={styles.xpBox}>
          <Text style={styles.xp}>{xp}</Text>
          <Text style={styles.xpSub}>XP • Level {Math.floor(xp / 100) + 1}</Text>
        </View>

        {/* CHAT */}
        <View style={styles.chatContainer}>
          <FlatList
            ref={flatRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(i) => i.id}
            contentContainerStyle={{ padding: 16 }}
          />
        </View>

        {/* INPUT */}
        <View style={styles.inputBar}>
          <TouchableOpacity onPress={pickImageAndSend}>
            <Text style={styles.icon}>📎</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Speak or type..."
            placeholderTextColor="#ddd"
            value={newMessage}
            onChangeText={setNewMessage}
            onSubmitEditing={sendChat}
          />

          <TouchableOpacity onPress={sendChat}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.send}>Send</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={toggleRecording}>
            <Text style={styles.icon}>{isRecording ? "🎙" : "🎤"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* STYLES */
const styles = StyleSheet.create({
  header: {
    paddingTop: 40,
    paddingHorizontal: 18,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  back: { color: "#fff", fontSize: 18, fontWeight: "700" },
  title: { color: "#fff", fontSize: 22, fontWeight: "800" },

  xpBox: {
    marginHorizontal: 18,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
  },
  xp: { color: "#fff", fontSize: 26, fontWeight: "800" },
  xpSub: { color: "#ddd" },

  chatContainer: {
    flex: 1,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 90,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.06)",
  },

  msgBot: { alignItems: "flex-start", marginVertical: 6 },
  msgUser: { alignItems: "flex-end", marginVertical: 6 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginBottom: 4 },

  bubble: { maxWidth: "80%", padding: 12, borderRadius: 16 },
  botBubble: { backgroundColor: "rgba(255,255,255,0.14)" },
  userBubble: { backgroundColor: "#7cf2ff" },
  botText: { color: "#fff" },
  userText: { color: "#06283d" },

  msgImage: { width: 200, height: 140, borderRadius: 12, marginBottom: 8 },

  inputBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(20,16,60,0.95)",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 18,
    paddingHorizontal: 16,
    color: "#fff",
  },
  send: { color: "#fff", fontWeight: "800" },
  icon: { fontSize: 22 },
});
