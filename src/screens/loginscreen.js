import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  StatusBar,
  ScrollView,
  Platform,
} from 'react-native';
import Svg, { Circle, Ellipse, Rect, Path } from 'react-native-svg';
import { authRequest } from '../config/api';
import { setAuth } from '../config/auth';
import { crossAlert } from '../config/utils';

// ─── Clay Human Character ────────────────────────────────────────────────────
function StudentCharacter({ size = 120 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 120 120">
      <Ellipse cx="60" cy="112" rx="28" ry="7" fill="rgba(75,158,255,0.15)" />
      {/* Body */}
      <Rect x="34" y="68" width="52" height="46" rx="20" fill="#5BA3FF" />
      <Rect x="34" y="78" width="52" height="10" rx="0" fill="#3B82F6" opacity="0.5" />
      {/* Neck */}
      <Rect x="50" y="60" width="20" height="14" rx="8" fill="#FDDCB0" />
      {/* Head */}
      <Circle cx="60" cy="48" r="28" fill="#FDDCB0" />
      {/* Hair */}
      <Path d="M32 42 Q35 18 60 16 Q85 18 88 42 Q80 28 60 28 Q40 28 32 42Z" fill="#5C3A1E" />
      {/* Eyes */}
      <Circle cx="52" cy="46" r="4" fill="#fff" />
      <Circle cx="68" cy="46" r="4" fill="#fff" />
      <Circle cx="53" cy="47" r="2.2" fill="#3D2314" />
      <Circle cx="69" cy="47" r="2.2" fill="#3D2314" />
      <Circle cx="54" cy="46" r="1" fill="#fff" />
      <Circle cx="70" cy="46" r="1" fill="#fff" />
      {/* Smile */}
      <Path d="M52 57 Q60 64 68 57" stroke="#5B8FD9" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <Ellipse cx="45" cy="55" rx="5" ry="3" fill="#BFD9FF" opacity="0.8" />
      <Ellipse cx="75" cy="55" rx="5" ry="3" fill="#BFD9FF" opacity="0.8" />
    </Svg>
  );
}

// ─── Clay Background Blobs ───────────────────────────────────────────────────
function ClayBlobs() {
  return (
    <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
      <Ellipse cx="340" cy="80"  rx="130" ry="130" fill="#C7E0FF" opacity="0.7" />
      <Ellipse cx="30"  cy="250" rx="110" ry="110" fill="#D6EAFF" opacity="0.5" />
      <Ellipse cx="370" cy="700" rx="120" ry="120" fill="#BDD9FF" opacity="0.45" />
      <Ellipse cx="60"  cy="780" rx="90"  ry="90"  fill="#DAF0FF" opacity="0.55" />
    </Svg>
  );
}

export default function LoginScreen({ navigation }) {
  const [userId,   setUserId]   = useState('');
  const [password, setPassword] = useState('');
  const [role,     setRole]     = useState('Student');
  const [loading,  setLoading]  = useState(false);

  const handleLogin = async () => {
    if (!userId || !password) { crossAlert('Oops!', 'Please fill in both ID and Password 😊'); return; }
    try {
      setLoading(true);
      const result = await authRequest('/login', {
        method: 'POST',
        body: JSON.stringify({ username: userId.trim(), password: password }),
      });
      // result = { token, role, username }
      setAuth(result.token, result.role, result.username);

      const backendRole = (result.role || '').toUpperCase();
      if (backendRole.includes('STUDENT')) navigation.replace('Student');
      else if (backendRole.includes('WARDEN')) navigation.replace('Warden');
      else if (backendRole.includes('GUARD'))  navigation.replace('Guard');
      else navigation.replace('Student');
    } catch (error) {
      crossAlert('Login Failed', error?.message || 'Invalid credentials or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { key: 'Student', emoji: '🎓', color: '#4B9EFF', shadow: '#2B7EDF' },
    { key: 'Warden',  emoji: '🏫', color: '#7C5CFC', shadow: '#5C3CDC' },
    { key: 'Guard',   emoji: '🛡️', color: '#1BBCA3', shadow: '#0D9C83' },
  ];

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="dark-content" backgroundColor="#EEF6FF" />
      <ClayBlobs />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.characterWrap}>
          <StudentCharacter size={110} />
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>Welcome back! 👋</Text>
            <View style={styles.speechTail} />
          </View>
        </View>

        <Text style={styles.brand}>Smart Campus</Text>
        <Text style={styles.tagline}>QR Gate Pass System</Text>

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>I am a…</Text>
          <View style={styles.roleRow}>
            {roles.map((r) => {
              const active = role === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  activeOpacity={0.82}
                  style={[styles.roleChip, { borderColor: r.color }, active && { backgroundColor: r.color, shadowColor: r.shadow }]}
                  onPress={() => setRole(r.key)}
                >
                  <Text style={styles.roleEmoji}>{r.emoji}</Text>
                  <Text style={[styles.roleLabel, active && { color: '#fff' }]}>{r.key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>College ID</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. STU2024"
            placeholderTextColor="#A8C8F0"
            value={userId}
            onChangeText={setUserId}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor="#A8C8F0"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={[styles.loginBtn, loading && { opacity: 0.6 }]} activeOpacity={0.88} onPress={handleLogin} disabled={loading}>
            <Text style={styles.loginBtnText}>{loading ? 'Logging in...' : `Login as ${role} →`}</Text>
          </TouchableOpacity>

          <Text style={styles.footNote}>Secure QR-based hostel movement tracking</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EEF6FF' },
  scroll: { padding: 20, paddingTop: Platform.OS === 'android' ? 48 : 60, paddingBottom: 40, alignItems: 'center' },

  characterWrap: { alignItems: 'center', position: 'relative', marginBottom: 4 },
  speechBubble: {
    position: 'absolute', top: 0, right: -20,
    backgroundColor: '#fff', borderRadius: 16, borderWidth: 2.5, borderColor: '#93C5FD',
    paddingHorizontal: 10, paddingVertical: 6,
    shadowColor: '#4B9EFF', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 6,
  },
  speechText: { fontSize: 12, fontWeight: '700', color: '#3B82F6' },
  speechTail: {
    position: 'absolute', bottom: -9, left: 14,
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10, borderStyle: 'solid',
    borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#93C5FD',
  },

  brand:   { fontSize: 30, fontWeight: '900', color: '#2563EB', letterSpacing: 0.4, marginBottom: 2 },
  tagline: { fontSize: 14, fontWeight: '600', color: '#64A4D8', marginBottom: 22 },

  card: {
    width: '100%', backgroundColor: '#FFFFFF', borderRadius: 32, borderWidth: 3, borderColor: '#BFDBFE',
    padding: 22,
    shadowColor: '#4B9EFF', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 12,
  },
  sectionLabel: { fontSize: 15, fontWeight: '800', color: '#1E40AF', marginBottom: 10 },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  roleChip: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 18, borderWidth: 2.5,
    backgroundColor: '#F0F7FF',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 5,
  },
  roleEmoji: { fontSize: 20, marginBottom: 3 },
  roleLabel: { fontSize: 11, fontWeight: '800', color: '#3B82F6' },

  inputLabel: { fontSize: 13, fontWeight: '700', color: '#60A5FA', marginBottom: 5 },
  input: {
    backgroundColor: '#F5F9FF', borderRadius: 18, borderWidth: 2.5, borderColor: '#BFDBFE',
    paddingHorizontal: 16, paddingVertical: 13, fontSize: 15, color: '#1E3A5F', marginBottom: 14,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 3,
  },
  loginBtn: {
    backgroundColor: '#3B82F6', borderRadius: 22, paddingVertical: 15, alignItems: 'center', marginTop: 4,
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 10,
    borderWidth: 2, borderColor: '#60A5FA',
  },
  loginBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 0.4 },
  footNote: { marginTop: 14, fontSize: 11, color: '#93C5FD', textAlign: 'center', fontWeight: '600' },
});