import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen({ navigation }) {
  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FF7A3E', '#E86A3C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.brand}>Smart Campus</Text>
        <Text style={styles.title}>Student Home</Text>
        <Text style={styles.subtitle}>Quick access to your daily campus workflow</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Quick Actions</Text>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Student')} activeOpacity={0.85}>
            <Ionicons name="card-outline" size={18} color="#FF7A3E" />
            <Text style={styles.actionText}>Apply / Check Gate Pass</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Profile')} activeOpacity={0.85}>
            <Ionicons name="person-outline" size={18} color="#FF7A3E" />
            <Text style={styles.actionText}>Update Student Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Guard')} activeOpacity={0.85}>
            <Ionicons name="qr-code-outline" size={18} color="#FF7A3E" />
            <Text style={styles.actionText}>Open QR Scan Module</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Useful Information</Text>
          <Text style={styles.infoLine}>1. While applying for a gate pass, enter the correct reason and time.</Text>
          <Text style={styles.infoLine}>2. Parent consent details are mandatory.</Text>
          <Text style={styles.infoLine}>3. Mentor proof request aaye to image upload karein.</Text>
          <Text style={styles.infoLine}>4. Keeping your profile details complete is mandatory.</Text>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => navigation.replace('Login')} activeOpacity={0.9}>
          <Text style={styles.logoutText}>Logout</Text>
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
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  brand: {
    color: '#FFE6D8',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 2,
  },
  subtitle: {
    color: '#FFF2EA',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  content: {
    padding: 14,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F2D7CB',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF6F2',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F3DED6',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 8,
  },
  actionText: {
    marginLeft: 10,
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
  },
  infoLine: {
    color: '#4B5563',
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 20,
  },
  logoutBtn: {
    backgroundColor: '#FF7A3E',
    minHeight: 48,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  logoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});


