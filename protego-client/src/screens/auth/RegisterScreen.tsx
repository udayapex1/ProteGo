import React, { useState, useEffect, useRef } from "react";
import {
  Image,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Dimensions,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import { colors, spacing, radius, fontSize } from "../../constants/theme";
import { StackNavigationProp } from "@react-navigation/stack";
import { AuthStackParamList } from "../../navigation/AuthNavigator";
import { UserRole } from "../../types/user.types";

const SCREEN_HEIGHT = Dimensions.get("window").height;

const ACCENT        = "#7C3AED";
const ACCENT_LIGHT  = "#F3F0FF";
const ACCENT_BORDER = "rgba(124,58,237,0.2)";
const ACCENT_ICON_BG = "rgba(124,58,237,0.12)";

type Props = {
  navigation: StackNavigationProp<AuthStackParamList, "Register">;
};

type RoleOption = {
  key: UserRole;
  label: string;
  sub: string;
  image: string;
};

const ROLES: RoleOption[] = [
  {
    key: "parent",
    label: "Parent",
    sub: "",
    image:
      "https://res.cloudinary.com/dwemivxbp/image/upload/v1782073856/Gemini_Generated_Image_bn67vqbn67vqbn67-removebg-preview_f3ssmr.png",
  },
  {
    key: "child",
    label: "Child",
    sub: "",
    image:
      "https://res.cloudinary.com/dwemivxbp/image/upload/v1782073729/kid-giving-shy-expression-introvert-behaviour-and-soft-emotion-3d-icon-png-download-14784585_rgeiru.webp",
  },
];

// ─── Animated Role Card ───────────────────────────────────────────────────────
function RoleCard({
  item,
  selected,
  onPress,
}: {
  item: RoleOption;
  selected: boolean;
  onPress: () => void;
}) {
  const cardScale  = useRef(new Animated.Value(1)).current;
  const charFloat  = useRef(new Animated.Value(0)).current;
  const charOpacity = useRef(new Animated.Value(selected ? 1 : 0.45)).current;

  useEffect(() => {
    if (selected) {
      // Bounce card
      Animated.sequence([
        Animated.spring(cardScale, {
          toValue: 1.04,
          useNativeDriver: true,
          speed: 30,
          bounciness: 10,
        }),
        Animated.spring(cardScale, {
          toValue: 1,
          useNativeDriver: true,
          speed: 20,
          bounciness: 6,
        }),
      ]).start();

      // Float character up
      Animated.spring(charFloat, {
        toValue: -8,
        useNativeDriver: true,
        speed: 18,
        bounciness: 12,
      }).start();

      // Brighten
      Animated.timing(charOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset float
      Animated.spring(charFloat, {
        toValue: 0,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }).start();

      // Dim
      Animated.timing(charOpacity, {
        toValue: 0.45,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [selected]);

  return (
    <Animated.View
      style={[
        styles.roleCard,
        selected && styles.roleCardSelected,
        { transform: [{ scale: cardScale }] },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{ width: "100%", alignItems: "center", gap: 4 }}
      >
        {/* Character image */}
        <View style={styles.roleImageContainer}>
          <Animated.Image
            source={{ uri: item.image }}
            style={[
              styles.roleImage,
              {
                opacity: charOpacity,
                transform: [{ translateY: charFloat }],
              },
            ]}
            resizeMode="contain"
          />
        </View>

        {/* Info */}
        <View style={styles.roleInfoRow}>
          <Text style={[styles.roleName, selected && styles.roleNameSelected]}>
            {item.label}
          </Text>
          <Text style={[styles.roleSub, selected && styles.roleSubSelected]}>
            {/* {item.sub} */}
          </Text>

          {/* Check dot */}
          <View style={[styles.roleCheck, selected && styles.roleCheckSelected]}>
            {selected && <Ionicons name="checkmark" size={10} color="#fff" />}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export default function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [role,     setRole]     = useState<UserRole>("parent");
  const [loading,  setLoading]  = useState(false);
  const [showPwd,  setShowPwd]  = useState(false);
  const [focused,  setFocused]  = useState<string | null>(null);

  // 1. Screen entry
  const screenOpacity   = useRef(new Animated.Value(0)).current;
  const screenTranslate = useRef(new Animated.Value(40)).current;

  // 2. Form fields stagger (name, email, password, role section)
  const fieldAnims = useRef(
    Array.from({ length: 4 }, () => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(24),
    }))
  ).current;

  // 3. CTA shake on validation error
  const btnShake = useRef(new Animated.Value(0)).current;

  // 4. CTA pulse while loading
  const btnPulse     = useRef(new Animated.Value(1)).current;
  const pulseLoop    = useRef<Animated.CompositeAnimation | null>(null);

  // Screen entry → then stagger fields
  useEffect(() => {
    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.spring(screenTranslate, {
        toValue: 0,
        speed: 14,
        bounciness: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      Animated.stagger(
        90,
        fieldAnims.map(({ opacity, translateY }) =>
          Animated.parallel([
            Animated.timing(opacity, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              speed: 18,
              bounciness: 8,
              useNativeDriver: true,
            }),
          ])
        )
      ).start();
    });
  }, []);

  // Pulse loop on loading
  useEffect(() => {
    if (loading) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(btnPulse, { toValue: 0.95, duration: 400, useNativeDriver: true }),
          Animated.timing(btnPulse, { toValue: 1,    duration: 400, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      pulseLoop.current?.stop();
      Animated.spring(btnPulse, { toValue: 1, useNativeDriver: true }).start();
    }
  }, [loading]);

  const shakeBtn = () => {
    btnShake.setValue(0);
    Animated.sequence([
      Animated.timing(btnShake, { toValue:  10, duration: 55, useNativeDriver: true }),
      Animated.timing(btnShake, { toValue: -10, duration: 55, useNativeDriver: true }),
      Animated.timing(btnShake, { toValue:  8,  duration: 55, useNativeDriver: true }),
      Animated.timing(btnShake, { toValue: -8,  duration: 55, useNativeDriver: true }),
      Animated.timing(btnShake, { toValue:  4,  duration: 55, useNativeDriver: true }),
      Animated.timing(btnShake, { toValue:  0,  duration: 55, useNativeDriver: true }),
    ]).start();
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      shakeBtn();
      Alert.alert("Error", "Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      await register({ name, email, password, role });
    } catch (error: any) {
      shakeBtn();
      Alert.alert(
        "Registration Failed",
        error.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  const iconColor = (field: string) => (focused === field ? ACCENT : "#aaa");

  const fieldAnim = (i: number) => ({
    opacity: fieldAnims[i].opacity,
    transform: [{ translateY: fieldAnims[i].translateY }],
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Animated.View
        style={[
          { flex: 1 },
          {
            opacity: screenOpacity,
            transform: [{ translateY: screenTranslate }],
          },
        ]}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Header ── */}
          <LinearGradient
            colors={["#000000", "#0a0a0a", "#0f0f0f"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGrad}
          >
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.navigate("Login")}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Text style={{ fontSize: 18 }}>🛡️</Text>
              </View>
              <Text style={styles.logoText}>
                Protego<Text style={{ color: ACCENT }}>.</Text>
              </Text>
            </View>

            <Text style={styles.eyebrow}>Get started</Text>
            <Text style={styles.headerTitle}>
              Create your account{"\n"}and stay protected.
            </Text>
          </LinearGradient>

          {/* ── Form card ── */}
          <View style={styles.card}>

            {/* Field 0 — Name */}
            <Animated.View style={fieldAnim(0)}>
              <Text style={styles.inputLabel}>Full name</Text>
              <View style={[styles.inputPill, focused === "name" && styles.inputPillFocused]}>
                <Ionicons name="person-outline" size={16} color={iconColor("name")} />
                <TextInput
                  style={styles.inputField}
                  placeholder="Your full name"
                  placeholderTextColor="#bbb"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setFocused("name")}
                  onBlur={() => setFocused(null)}
                />
              </View>
            </Animated.View>

            {/* Field 1 — Email */}
            <Animated.View style={fieldAnim(1)}>
              <Text style={styles.inputLabel}>Email address</Text>
              <View style={[styles.inputPill, focused === "email" && styles.inputPillFocused]}>
                <Ionicons name="mail-outline" size={16} color={iconColor("email")} />
                <TextInput
                  style={styles.inputField}
                  placeholder="your@email.com"
                  placeholderTextColor="#bbb"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </Animated.View>

            {/* Field 2 — Password */}
            <Animated.View style={fieldAnim(2)}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={[styles.inputPill, focused === "password" && styles.inputPillFocused]}>
                <Ionicons name="lock-closed-outline" size={16} color={iconColor("password")} />
                <TextInput
                  style={styles.inputField}
                  placeholder="••••••••"
                  placeholderTextColor="#bbb"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  secureTextEntry={!showPwd}
                />
                <TouchableOpacity
                  onPress={() => setShowPwd((v) => !v)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPwd ? "eye-off-outline" : "eye-outline"}
                    size={16}
                    color={focused === "password" ? ACCENT : "#bbb"}
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Field 3 — Role cards */}
            <Animated.View style={fieldAnim(3)}>
              <View style={styles.divider}>
                <View style={styles.divLine} />
                <Text style={styles.divText}>I am a</Text>
                <View style={styles.divLine} />
              </View>

              <View style={styles.roleRow}>
                {ROLES.map((item) => (
                  <RoleCard
                    key={item.key}
                    item={item}
                    selected={role === item.key}
                    onPress={() => setRole(item.key)}
                  />
                ))}
              </View>
            </Animated.View>

            {/* CTA */}
            <Animated.View
              style={{
                transform: [{ translateX: btnShake }, { scale: btnPulse }],
              }}
            >
              <TouchableOpacity
                style={[styles.btnPrimary, loading && { opacity: 0.8 }]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.85}
              >
                <Text style={styles.btnText}>
                  {loading ? "Creating account…" : "Create account"}
                </Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Footer */}
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerText}>
                Already have an account?{" "}
                <Text style={styles.footerLink}>Log in</Text>
              </Text>
            </TouchableOpacity>

          </View>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },

  /* ── Header ── */
  headerGrad: {
    paddingHorizontal: 28,
    paddingBottom: 72,
  },
  backBtn: {
    marginTop: 56,
    marginBottom: 20,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 24,
  },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: ACCENT,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  eyebrow: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "600",
    lineHeight: 34,
    letterSpacing: -0.5,
  },

  /* ── Card ── */
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
  },

  /* ── Inputs ── */
  inputLabel: {
    color: "#111",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 14,
  },
  inputPill: {
    backgroundColor: "#F7F7F7",
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  inputPillFocused: {
    backgroundColor: ACCENT_LIGHT,
    borderColor: ACCENT_BORDER,
  },
  inputField: {
    flex: 1,
    color: "#111",
    fontSize: 15,
  },

  /* ── Role divider ── */
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
    marginBottom: 14,
  },
  divLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: "#eee",
  },
  divText: {
    color: "#ccc",
    fontSize: 12,
  },

  /* ── Role cards ── */
  roleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 22,
  },
  roleCard: {
    flex: 1,
    borderWidth: 0.5,
    borderColor: "#eee",
    borderRadius: 16,
    paddingBottom: 12,
    paddingHorizontal: 12,
    alignItems: "center",
    backgroundColor: "#fff",
    overflow: "hidden",
  },
  roleCardSelected: {
    borderWidth: 1.5,
    borderColor: ACCENT,
    backgroundColor: ACCENT_LIGHT,
  },
  roleImageContainer: {
    width: "100%",
    height: 110,
    alignItems: "center",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  roleImage: {
    width: "100%",
    height: 120,
  },
  roleInfoRow: {
    alignItems: "center",
    gap: 2,
  },
  roleName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555",
  },
  roleNameSelected: {
    color: ACCENT,
  },
  roleSub: {
    fontSize: 11,
    color: "#bbb",
  },
  roleSubSelected: {
    color: "#9F7AEA",
  },
  roleCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  roleCheckSelected: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },

  /* ── CTA ── */
  btnPrimary: {
    backgroundColor: "#0a0a0a",
    borderRadius: 100,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 20,
  },
  btnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: -0.2,
  },

  /* ── Footer ── */
  footerText: {
    color: "#aaa",
    fontSize: 13,
    textAlign: "center",
  },
  footerLink: {
    color: ACCENT,
    fontWeight: "500",
  },
});