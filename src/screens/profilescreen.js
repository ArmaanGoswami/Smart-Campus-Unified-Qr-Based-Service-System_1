import React, { useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Ellipse, Rect, Path } from 'react-native-svg';

// ─── Clay Human Character: Profile Student ──────────────────────────────────
function ProfileCharacter() {
  return (
    <Svg width={90} height={90} viewBox="0 0 90 90">
      <Ellipse cx="45" cy="84" rx="22" ry="5" fill="rgba(124,92,252,0.18)" />
      {/* Body */}
      <Rect x="22" y="52" width="46" height="40" rx="18" fill="#7C5CFC" />
      <Rect x="22" y="60" width="46" height="10" rx="0" fill="#5C3CDC" opacity="0.5" />
      {/* Neck */}
      <Rect x="36" y="44" width="18" height="13" rx="7" fill="#FDDCB0" />
      {/* Head */}
      <Circle cx="45" cy="34" r="22" fill="#FDDCB0" />
      {/* Hair */}
      <Path d="M23 30 Q25 12 45 11 Q65 12 67 30 Q60 20 45 20 Q30 20 23 30Z" fill="#3D2314" />
      {/* Eyes */}
      <Circle cx="38" cy="32" r="3.5" fill="#fff" />
      <Circle cx="52" cy="32" r="3.5" fill="#fff" />
      <Circle cx="39" cy="33" r="2" fill="#3D2314" />
      <Circle cx="53" cy="33" r="2" fill="#3D2314" />
      <Circle cx="39.5" cy="32.2" r="0.9" fill="#fff" />
      <Circle cx="53.5" cy="32.2" r="0.9" fill="#fff" />
      {/* Smile */}
      <Path d="M38 42 Q45 47 52 42" stroke="#D97540" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <Ellipse cx="32" cy="38" rx="4" ry="2.5" fill="#FFB3A0" opacity="0.7" />
      <Ellipse cx="58" cy="38" rx="4" ry="2.5" fill="#FFB3A0" opacity="0.7" />
      {/* Clipboard */}
      <Rect x="28" y="56" width="18" height="22" rx="4" fill="#fff" opacity="0.8" />
      <Rect x="31" y="60" width="12" height="2" rx="1" fill="#7C5CFC" opacity="0.6" />
      <Rect x="31" y="64" width="10" height="2" rx="1" fill="#7C5CFC" opacity="0.4" />
      <Rect x="31" y="68" width="8" height="2" rx="1" fill="#7C5CFC" opacity="0.3" />
    </Svg>
  );
}

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState({
    fullName: '',
    rollNumber: '',
    branch: '',
    section: '',
    course: '',
    semester: '',
    hostelName: '',
    roomNumber: '',
    phoneNumber: '',
    email: '',
    emergencyContact: '',
    parentName: '',
    bloodGroup: '',
    address: '',
  });

  const updateField = (key, value) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveProfile = () => {
    if (!profile.fullName.trim()) {
      Alert.alert('Oops!', 'Student name is required 😊');
      return;
    }
    if (!profile.rollNumber.trim()) {
      Alert.alert('Oops!', 'Roll number is required.');
      return;
    }
    if (!profile.branch.trim() || !profile.section.trim() || !profile.course.trim()) {
      Alert.alert('Oops!', 'Branch, section, and course are mandatory.');
      return;
    }
    Alert.alert('Saved!', 'Student profile saved successfully 🎉');
  };

  const SECTION_ACCENT = '#7C5CFC';

  const ClayInput = ({ placeholder, value, onChangeText, keyboardType, secureTextEntry, multiline, autoCapitalize }) => (
    <TextInput
      style={[styles.input, multiline && { minHeight: 85 }]}
      placeholder={placeholder}
      placeholderTextColor="#B0A8C8"
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'auto'}
      autoCapitalize={autoCapitalize || 'sentences'}
    />
  );

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.brand}>Smart Campus</Text>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <Text style={styles.headerSub}>Keep your details up to date</Text>
        </View>
        <ProfileCharacter />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={[styles.card, { borderColor: '#DDD6FF' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={18} color={SECTION_ACCENT} />
            <Text style={[styles.sectionTitle, { color: SECTION_ACCENT }]}>Basic Information</Text>
          </View>
          <ClayInput placeholder="Full Name" value={profile.fullName} onChangeText={(v) => updateField('fullName', v)} />
          <ClayInput placeholder="Roll Number" value={profile.rollNumber} onChangeText={(v) => updateField('rollNumber', v)} autoCapitalize="characters" />
          <View style={styles.row}>
            <View style={styles.halfWrap}>
              <ClayInput placeholder="Branch" value={profile.branch} onChangeText={(v) => updateField('branch', v)} />
            </View>
            <View style={styles.halfWrap}>
              <ClayInput placeholder="Section" value={profile.section} onChangeText={(v) => updateField('section', v)} />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.halfWrap}>
              <ClayInput placeholder="Course" value={profile.course} onChangeText={(v) => updateField('course', v)} />
            </View>
            <View style={styles.halfWrap}>
              <ClayInput placeholder="Semester" value={profile.semester} onChangeText={(v) => updateField('semester', v)} keyboardType="numeric" />
            </View>
          </View>
        </View>

        {/* Hostel */}
        <View style={[styles.card, { borderColor: '#FFD6B8' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="home-outline" size={18} color="#FF7A3E" />
            <Text style={[styles.sectionTitle, { color: '#FF7A3E' }]}>Hostel Details</Text>
          </View>
          <ClayInput placeholder="Hostel Name" value={profile.hostelName} onChangeText={(v) => updateField('hostelName', v)} />
          <ClayInput placeholder="Room Number" value={profile.roomNumber} onChangeText={(v) => updateField('roomNumber', v)} />
        </View>

        {/* Contact */}
        <View style={[styles.card, { borderColor: '#B8F0E8' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="call-outline" size={18} color="#1BBCA3" />
            <Text style={[styles.sectionTitle, { color: '#1BBCA3' }]}>Contact Details</Text>
          </View>
          <ClayInput placeholder="Phone Number" value={profile.phoneNumber} onChangeText={(v) => updateField('phoneNumber', v)} keyboardType="phone-pad" />
          <ClayInput placeholder="Email" value={profile.email} onChangeText={(v) => updateField('email', v)} keyboardType="email-address" autoCapitalize="none" />
          <ClayInput placeholder="Emergency Contact" value={profile.emergencyContact} onChangeText={(v) => updateField('emergencyContact', v)} keyboardType="phone-pad" />
        </View>

        {/* Other */}
        <View style={[styles.card, { borderColor: '#FFE4B8' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="information-circle-outline" size={18} color="#F5A623" />
            <Text style={[styles.sectionTitle, { color: '#F5A623' }]}>Other Details</Text>
          </View>
          <ClayInput placeholder="Parent Name" value={profile.parentName} onChangeText={(v) => updateField('parentName', v)} />
          <ClayInput placeholder="Blood Group (e.g. O+)" value={profile.bloodGroup} onChangeText={(v) => updateField('bloodGroup', v)} autoCapitalize="characters" />
          <ClayInput placeholder="Permanent Address" value={profile.address} onChangeText={(v) => updateField('address', v)} multiline />
        </View>

        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSaveProfile}>
          <Text style={styles.saveBtnText}>Save Profile 🎉</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} activeOpacity={0.85} onPress={() => navigation.navigate('Student')}>
          <Text style={styles.backBtnText}>← Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F0FF',
  },
  header: {
    backgroundColor: '#7C5CFC',
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 20,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#5C3CDC',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  headerLeft: { flex: 1 },
  brand: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.78)',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 3,
  },
  content: {
    padding: 14,
    paddingBottom: 36,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 3,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#9C7EFF',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfWrap: { flex: 1 },
  input: {
    backgroundColor: '#F8F5FF',
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: '#E2D9FF',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#2D2040',
    marginBottom: 10,
    shadowColor: '#9C7EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  saveBtn: {
    backgroundColor: '#7C5CFC',
    borderRadius: 22,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 4,
    shadowColor: '#5C3CDC',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 2,
    borderColor: '#9C7EFF',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  backBtn: {
    backgroundColor: '#EDE8FF',
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 2.5,
    borderColor: '#C5B8FF',
    shadowColor: '#9C7EFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  backBtnText: {
    color: '#5C3CDC',
    fontSize: 14,
    fontWeight: '800',
  },
});
