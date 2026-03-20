import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

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
      Alert.alert('Validation', 'Student name is required.');
      return;
    }

    if (!profile.rollNumber.trim()) {
      Alert.alert('Validation', 'Roll number is required.');
      return;
    }

    if (!profile.branch.trim() || !profile.section.trim() || !profile.course.trim()) {
      Alert.alert('Validation', 'Branch, section, and course are mandatory.');
      return;
    }

    Alert.alert('Saved', 'Student profile details have been saved.');
  };

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FF7A3E', '#E86A3C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.brandText}>Smart Campus</Text>
          <Text style={styles.headerTitle}>Student Profile</Text>
          <Text style={styles.headerSubTitle}>Fill your required details</Text>
        </View>
        <View style={styles.headerIconWrap}>
          <Ionicons name="person-circle-outline" size={40} color="#FFFFFF" />
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Basic Information</Text>

          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#9CA3AF"
            value={profile.fullName}
            onChangeText={(v) => updateField('fullName', v)}
          />

          <TextInput
            style={styles.input}
            placeholder="Roll Number"
            placeholderTextColor="#9CA3AF"
            value={profile.rollNumber}
            onChangeText={(v) => updateField('rollNumber', v)}
          />

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Branch"
              placeholderTextColor="#9CA3AF"
              value={profile.branch}
              onChangeText={(v) => updateField('branch', v)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Section"
              placeholderTextColor="#9CA3AF"
              value={profile.section}
              onChangeText={(v) => updateField('section', v)}
            />
          </View>

          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Course"
              placeholderTextColor="#9CA3AF"
              value={profile.course}
              onChangeText={(v) => updateField('course', v)}
            />
            <TextInput
              style={[styles.input, styles.halfInput]}
              placeholder="Semester"
              placeholderTextColor="#9CA3AF"
              value={profile.semester}
              onChangeText={(v) => updateField('semester', v)}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Hostel Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Hostel Name"
            placeholderTextColor="#9CA3AF"
            value={profile.hostelName}
            onChangeText={(v) => updateField('hostelName', v)}
          />

          <TextInput
            style={styles.input}
            placeholder="Room Number"
            placeholderTextColor="#9CA3AF"
            value={profile.roomNumber}
            onChangeText={(v) => updateField('roomNumber', v)}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Contact Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#9CA3AF"
            value={profile.phoneNumber}
            onChangeText={(v) => updateField('phoneNumber', v)}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#9CA3AF"
            value={profile.email}
            onChangeText={(v) => updateField('email', v)}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="Emergency Contact"
            placeholderTextColor="#9CA3AF"
            value={profile.emergencyContact}
            onChangeText={(v) => updateField('emergencyContact', v)}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Other Required Details</Text>

          <TextInput
            style={styles.input}
            placeholder="Parent Name"
            placeholderTextColor="#9CA3AF"
            value={profile.parentName}
            onChangeText={(v) => updateField('parentName', v)}
          />

          <TextInput
            style={styles.input}
            placeholder="Blood Group"
            placeholderTextColor="#9CA3AF"
            value={profile.bloodGroup}
            onChangeText={(v) => updateField('bloodGroup', v)}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Permanent Address"
            placeholderTextColor="#9CA3AF"
            value={profile.address}
            onChangeText={(v) => updateField('address', v)}
            multiline
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.88} onPress={handleSaveProfile}>
          <Text style={styles.primaryButtonText}>Save Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.88}
          onPress={() => navigation.navigate('Student')}
        >
          <Text style={styles.secondaryButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFAF8',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 18,
    paddingHorizontal: 16,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandText: {
    color: '#FFE6D8',
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 3,
  },
  headerSubTitle: {
    color: '#FFF2EA',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  headerIconWrap: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    padding: 5,
  },
  content: {
    padding: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2D7CB',
    padding: 14,
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#1F2937',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  input: {
    backgroundColor: '#FFF6F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3DED6',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#111827',
    fontSize: 14,
    marginBottom: 10,
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 85,
  },
  primaryButton: {
    backgroundColor: '#FF7A3E',
    minHeight: 48,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  secondaryButton: {
    minHeight: 46,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFE6D8',
    borderWidth: 1,
    borderColor: '#F3B594',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#B75121',
    fontSize: 14,
    fontWeight: '700',
  },
});

