import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  StyleSheet
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../src/hooks/useAuth";

export default function RegisterScreen() {
  const { register, authLoading, authError } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!name || !email || !password) {
      return;
    }

    try {
      await register(name, email, password);
    } catch (error) {
      // Error is handled by useAuth
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          {/* Logo / Brand */}
          <View style={styles.brandBlock}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>HF</Text>
            </View>
            <Text style={styles.brandTitle}>HybridForce</Text>
            <Text style={styles.brandSubtitle}>Atleta hÃ­brido Â· MVP</Text>
          </View>

          {/* Title */}
          <View style={styles.titleBlock}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Ãšnete a HybridForce</Text>
          </View>

          {/* Error Message */}
          {authError && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{authError}</Text>
            </View>
          )}

          {/* Name Input */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre"
              placeholderTextColor="#94a3b8"
              selectionColor="#38bdf8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              editable={!authLoading}
            />
          </View>

          {/* Email Input */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="tu@email.com"
              placeholderTextColor="#94a3b8"
              selectionColor="#38bdf8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!authLoading}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>ContraseÃ±a</Text>
            <TextInput
              style={styles.input}
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              placeholderTextColor="#94a3b8"
              selectionColor="#38bdf8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!authLoading}
            />
          </View>

          {/* Register Button */}
          <TouchableOpacity
            style={[styles.primaryButton, (authLoading || !name || !email || !password) && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={authLoading || !name || !email || !password}
          >
            {authLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.linkRow}>
            <Text style={styles.linkTextMuted}>Â¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.linkTextAccent}>Inicia sesiÃ³n</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a"
  },
  scrollContent: {
    flexGrow: 1
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24
  },
  brandBlock: {
    marginBottom: 32,
    alignItems: "center"
  },
  brandBadge: {
    height: 64,
    width: 64,
    borderRadius: 16,
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  brandBadgeText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#3b82f6"
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff"
  },
  brandSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 4
  },
  titleBlock: {
    marginBottom: 24
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 8
  },
  subtitle: {
    color: "#94a3b8"
  },
  errorBox: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
    padding: 12
  },
  errorText: {
    color: "#f87171",
    fontSize: 12
  },
  inputBlock: {
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 12,
    color: "#cbd5f5",
    marginBottom: 8
  },
  input: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(30,41,59,0.8)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: "#f8fafc"
  },
  primaryButton: {
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16
  },
  buttonDisabled: {
    opacity: 0.5
  },
  primaryButtonText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 16
  },
  linkRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center"
  },
  linkTextMuted: {
    color: "#94a3b8"
  },
  linkTextAccent: {
    color: "#3b82f6",
    fontWeight: "600"
  }
});
