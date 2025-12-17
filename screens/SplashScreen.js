import React, { useEffect, useRef } from "react";
import { View, Text, Image, StyleSheet, Animated } from "react-native";
import { Audio } from "expo-av";
import { useNavigation } from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";

export default function SplashScreen() {
  const navigation = useNavigation();

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const titleWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    async function playSound() {
      try {
        const { sound } = await Audio.Sound.createAsync(
          require("../assets/blipbeep.mp3")
        );
        await sound.playAsync();
      } catch (err) {
        console.log("Sound blocked:", err);
      }
    }

    playSound();

    Animated.spring(logoScale, {
      toValue: 1,
      useNativeDriver: true,
      bounciness: 15,
    }).start();

    Animated.timing(titleWidth, {
      toValue: 160,
      duration: 2500,
      useNativeDriver: false,
    }).start();

    setTimeout(() => {
      navigation.replace("Login");
    }, 3500);
  }, []);

  return (
    <LinearGradient
      colors={["#0f1446", "#2d3cdb"]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.Image
          source={require("../assets/1logo.png")}
          style={[styles.logo, { transform: [{ scale: logoScale }] }]}
        />

        <Animated.Text style={[styles.title, { width: titleWidth }]}>
          EduVerso
        </Animated.Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logo: {
    width: 180,
    height: 180,
    resizeMode: "contain",
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    color: "white",
    fontWeight: "bold",
    fontFamily: "Georgia",
    borderRightWidth: 3,
    borderRightColor: "white",
    overflow: "hidden",
  },
});
