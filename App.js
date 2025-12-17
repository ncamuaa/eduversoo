// App.js
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Screens
import AnnouncementScreen from "./screens/AnnouncementScreen";
import TutorScreen from "./screens/TutorScreen";
import ModulesScreen from "./screens/ModuleScreen";
import ModuleViewerScreen from "./screens/ModuleViewerScreen";
import ProfileScreen from "./screens/ProfileScreen";
import PeerFeedbackScreen from "./screens/PeerFeedbackScreen";
import SplashScreen from "./screens/SplashScreen";
import HomeScreen from "./screens/HomeScreen";
import LoginScreen from "./screens/LoginScreen";
import SettingScreen from "./screens/SettingScreen";
import QuizArenaScreen from "./screens/QuizArenaScreen";

// Game Screens
import QuizGame from "./screens/Games/QuizGame";
import MatchingGame from "./screens/Games/MatchingGame";
import RPSGame from "./screens/Games/RPSGame";
import FinalResultScreen from "./screens/Games/FinalResultScreen";
import CertificateViewer from "./screens/Games/CertificateViewer";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
      >
        {/* AUTH */}
        <Stack.Screen name="Login" component={LoginScreen} />

        {/* HOME */}
        <Stack.Screen name="Home" component={HomeScreen} />

        {/* FEATURES */}
        <Stack.Screen name="Announcement" component={AnnouncementScreen} />
        <Stack.Screen name="Tutor" component={TutorScreen} />

        {/* MODULES */}
        <Stack.Screen name="Modules" component={ModulesScreen} />
        <Stack.Screen name="ModuleViewer" component={ModuleViewerScreen} />

        {/* USER */}
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Settings" component={SettingScreen} />
        <Stack.Screen name="PeerFeedback" component={PeerFeedbackScreen} />

        {/* GAME HUB */}
        <Stack.Screen name="QuizArena" component={QuizArenaScreen} />

        <Stack.Screen name="QuizGame" component={QuizGame} />
        <Stack.Screen name="MatchingGame" component={MatchingGame} />
        <Stack.Screen name="RPSGame" component={RPSGame} />

        {/* ✅ FINAL RESULTS (FIXED NAME) */}
        <Stack.Screen
          name="FinalResult"
          component={FinalResultScreen}
        />

        {/* CERTIFICATE */}
        <Stack.Screen
          name="CertificateViewer"
          component={CertificateViewer}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
