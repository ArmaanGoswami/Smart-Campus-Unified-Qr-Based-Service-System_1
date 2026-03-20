import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, StatusBar } from 'react-native';

export default function LoginScreen({ navigation }) {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Student'); // Default role Student rahega

  const handleLogin = () => {
    // Basic validation
    if (!userId || !password) {
      Alert.alert('Error', 'ID and Password are both required!');
      return;
    }

    // Role ke hisaab se navigation
    if (role === 'Student') {
      navigation.replace('Student'); // Used 'replace' so back press does not return to login
    } else if (role === 'Warden') {
      navigation.replace('Warden');
    } else if (role === 'Guard') {
      navigation.replace('Guard');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8C9A4" />

      <View style={styles.blobTopLeft} />
      <View style={styles.blobRight} />
      <View style={styles.blobBottomLeft} />

      <View style={styles.frame}>
        <View style={styles.card}>
          <Text style={styles.brand}>Smart Campus QR Suite</Text>
          <Text style={styles.title}>Login</Text>
          <Text style={styles.subtitle}>Continue to unified campus services</Text>

          <View style={styles.roleContainer}>
            {['Student', 'Warden', 'Guard'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.roleButton, role === r && styles.activeRole]}
                onPress={() => setRole(r)}
              >
                <Text style={role === r ? styles.activeText : styles.inactiveText}>{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Enter College ID"
            placeholderTextColor="#B18E7B"
            value={userId}
            onChangeText={setUserId}
          />
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            placeholderTextColor="#B18E7B"
            secureTextEntry={true}
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
            <Text style={styles.loginButtonText}>Login as {role}</Text>
          </TouchableOpacity>

          <Text style={styles.helperText}>Secure QR access for hostel and campus movement</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8C9A4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  frame: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 44,
    borderTopLeftRadius: 62,
    borderBottomRightRadius: 56,
    backgroundColor: 'rgba(255, 246, 238, 0.28)',
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    overflow: 'hidden',
  },
  card: {
    borderRadius: 34,
    borderTopLeftRadius: 48,
    borderBottomRightRadius: 42,
    backgroundColor: 'rgba(255, 241, 231, 0.66)',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    shadowColor: '#D98558',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 22,
    elevation: 5,
  },
  brand: {
    fontSize: 13,
    color: '#E9783C',
    fontWeight: '700',
    marginBottom: 4,
  },
  title: {
    fontSize: 40,
    lineHeight: 44,
    fontWeight: '800',
    color: '#2F3338',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#735E52',
    marginBottom: 18,
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(230, 132, 76, 0.45)',
    borderRadius: 18,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  activeRole: {
    backgroundColor: 'rgba(255, 107, 44, 0.96)',
    borderColor: 'rgba(255, 107, 44, 0.96)',
  },
  activeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inactiveText: {
    color: '#A25B37',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(234, 163, 122, 0.42)',
    backgroundColor: 'rgba(245, 250, 255, 0.55)',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 15,
    fontSize: 15,
    color: '#3C342F',
  },
  loginButton: {
    backgroundColor: '#FF5A1F',
    padding: 15,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#E55D22',
    shadowOpacity: 0.24,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 5,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  helperText: {
    marginTop: 14,
    fontSize: 12,
    color: '#866D5E',
    textAlign: 'center',
  },
  blobTopLeft: {
    position: 'absolute',
    top: -30,
    left: -60,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(234, 199, 103, 0.26)',
  },
  blobRight: {
    position: 'absolute',
    top: 140,
    right: -55,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 158, 99, 0.22)',
  },
  blobBottomLeft: {
    position: 'absolute',
    bottom: -55,
    left: -65,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(243, 156, 117, 0.2)',
  },
});
