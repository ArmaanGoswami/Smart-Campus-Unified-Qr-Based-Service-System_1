import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import { request } from '../config/api';

const STUDENT_ID = 'STU123';
const PARENT_VERIFICATION_NUMBER = '9876543210';

const STATUS = {
  NONE: 'NONE',
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  USED: 'USED',
  EXITED: 'EXITED',
  COMPLETED: 'COMPLETED',
};

const normalizeStatus = (value) => String(value || '').toUpperCase();
const getPassId = (item) => String(item?.id || item?._id || item?.passId || '').trim();

const getDateFromObjectId = (id) => {
  const str = String(id || '');
  if (!/^[0-9a-fA-F]{24}$/.test(str)) return null;
  const milliseconds = parseInt(str.slice(0, 8), 16) * 1000;
  return Number.isNaN(milliseconds) ? null : new Date(milliseconds);
};

const formatDate = (value, fallbackId) => {
  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
  }

  const fromObjectId = getDateFromObjectId(fallbackId);
  return fromObjectId ? fromObjectId.toLocaleString() : 'N/A';
};

const getStatusMeta = (status) => {
  const state = normalizeStatus(status);

  if (state === STATUS.APPROVED) {
    return {
      label: 'Approved',
      icon: 'checkmark-circle',
      color: '#1E7E34',
      bg: '#E8F5E9',
    };
  }

  if (state === STATUS.REJECTED) {
    return {
      label: 'Rejected',
      icon: 'close-circle',
      color: '#C62828',
      bg: '#FDECEC',
    };
  }

  if ([STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(state)) {
    return {
      label: state === STATUS.EXITED ? 'Exited' : state === STATUS.COMPLETED ? 'Completed' : 'Used',
      icon: 'time',
      color: '#6B7280',
      bg: '#EEF1F4',
    };
  }

  if (state === STATUS.PENDING) {
    return {
      label: 'Pending',
      icon: 'hourglass',
      color: '#B26A00',
      bg: '#FFF4E5',
    };
  }

  return {
    label: 'Unknown',
    icon: 'help-circle',
    color: '#6B7280',
    bg: '#EEF1F4',
  };
};

export default function StudentScreen({ navigation }) {
  const [reason, setReason] = useState('');
  const [outTime, setOutTime] = useState('');
  const [parentConsentNote, setParentConsentNote] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [latestPass, setLatestPass] = useState(null);
  const [passStatus, setPassStatus] = useState(STATUS.NONE);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [history, setHistory] = useState([]);

  const updateFromPass = (pass) => {
    if (!pass) {
      setLatestPass(null);
      setPassStatus(STATUS.NONE);
      return;
    }

    setLatestPass(pass);
    setPassStatus(normalizeStatus(pass?.status) || STATUS.PENDING);
  };

  const refreshHistory = async () => {
    try {
      setHistoryLoading(true);
      const passes = await request(`/student/${STUDENT_ID}/history`, { method: 'GET' });
      const records = Array.isArray(passes) ? passes : [];
      const pastRecords = records.filter((item) =>
        [STATUS.APPROVED, STATUS.REJECTED, STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(normalizeStatus(item?.status))
      );
      setHistory(pastRecords);
    } catch (error) {
      setHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshStatus = async ({ silent = false } = {}) => {
    try {
      if (!silent) setIsRefreshing(true);

      const currentPass = await request(`/student/${STUDENT_ID}`, { method: 'GET' });
      updateFromPass(currentPass);

      if (!silent) {
        Alert.alert('Updated', `Current status: ${normalizeStatus(currentPass?.status) || STATUS.PENDING}`);
      }
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('No gate pass found for student')) {
        setLatestPass(null);
        setPassStatus(STATUS.NONE);
        if (!silent) Alert.alert('Info', 'No active gate pass found yet.');
      } else if (!silent) {
        Alert.alert('API Error', error?.message || 'Unable to refresh status.');
      }
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  const handleApply = async () => {
    if (!reason.trim() || !outTime.trim()) {
      Alert.alert('Validation', 'Reason and out time are required.');
      return;
    }

    if (!parentConsentNote.trim()) {
      Alert.alert('Parent Approval Mandatory', 'Parent consent details are mandatory.');
      return;
    }

    if (!fromDate.trim() || !toDate.trim()) {
      Alert.alert('Date Range Required', 'Please fill both from date and to date.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        studentId: STUDENT_ID,
        studentName: 'Student',
        reason: reason.trim(),
        outTime: outTime.trim(),
        fromDate: fromDate.trim(),
        toDate: toDate.trim(),
        parentConsentNote: parentConsentNote.trim(),
      };

      const createdPass = await request('', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      updateFromPass(createdPass);
      await refreshHistory();
      setReason('');
      setOutTime('');
      setFromDate('');
      setToDate('');
      setParentConsentNote('');

      Alert.alert('Success', 'Gate pass request has been submitted.');
    } catch (error) {
      Alert.alert('API Error', error?.message || 'Unable to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadMentorProof = async () => {
    const resolvedPassId = getPassId(latestPass);
    if (!resolvedPassId) {
      Alert.alert('No Active Request', 'An active request is required first.');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Gallery access permission is required.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (!asset?.base64) {
        Alert.alert('Upload Failed', 'Unable to read image data.');
        return;
      }

      const mime = asset.mimeType || 'image/jpeg';
      const dataUrl = `data:${mime};base64,${asset.base64}`;

      const updated = await request(`/${resolvedPassId}/mentor-upload`, {
        method: 'PUT',
        body: JSON.stringify({ mentorProofImage: dataUrl }),
      });

      updateFromPass(updated);
      await refreshHistory();
      Alert.alert('Uploaded', 'Mentor proof uploaded successfully.');
    } catch (error) {
      Alert.alert('Upload Failed', error?.message || 'Unable to upload mentor proof.');
    }
  };

  const handleBottomNav = (target) => {
    if (target === 'PASSES') return;

    if (target === 'PROFILE') {
      navigation?.navigate?.('Profile');
      return;
    }
  };

  useEffect(() => {
    refreshStatus({ silent: true });
    refreshHistory();
  }, []);

  useEffect(() => {
    if (passStatus !== STATUS.PENDING) return undefined;

    const timer = setInterval(() => {
      refreshStatus({ silent: true });
    }, 8000);

    return () => clearInterval(timer);
  }, [passStatus]);

  const statusMeta = useMemo(() => getStatusMeta(passStatus), [passStatus]);
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return <View style={styles.screen} />;
  }

  const currentPassId = getPassId(latestPass);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#FF7A3E', '#E86A3C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.brandWrap}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>SC</Text>
            </View>
            <View>
              <Text style={[styles.brandName, { fontFamily: 'Poppins_800ExtraBold' }]}>Smart Campus</Text>
              <Text style={[styles.welcomeText, { fontFamily: 'Poppins_500Medium' }]}>Student Portal</Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7}>
              <Ionicons name="person-circle-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              refreshStatus();
              refreshHistory();
            }}
            tintColor="#FF7A3E"
          />
        }
      >
        {/* Stats Bar - Pass Status Summary */}
        <View style={styles.statsBar}>
          <View style={[styles.statCard, styles.statPending]}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={styles.statValue}>{passStatus === STATUS.NONE ? '—' : passStatus}</Text>
          </View>
          <View style={[styles.statCard, styles.statApproved]}>
            <Text style={styles.statLabel}>Active</Text>
            <Text style={styles.statValue}>{passStatus === STATUS.APPROVED ? '✓' : '—'}</Text>
          </View>
          <View style={[styles.statCard, styles.statRejected]}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={styles.statValue}>{passStatus === STATUS.PENDING ? '⏳' : '—'}</Text>
          </View>
        </View>

        {/* Apply Pass Card */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>Apply Gate Pass</Text>
          <Text style={[styles.cardDescription, { fontFamily: 'Poppins_400Regular' }]}>Fill all required details to request a gate pass.</Text>

          <TextInput
            style={[styles.input, { fontFamily: 'Poppins_500Medium' }]}
            placeholder="Purpose / Reason"
            placeholderTextColor="#999"
            value={reason}
            onChangeText={setReason}
          />

          <TextInput
            style={[styles.input, { fontFamily: 'Poppins_500Medium' }]}
            placeholder="Exit Time (e.g. 05:30 PM)"
            placeholderTextColor="#999"
            value={outTime}
            onChangeText={setOutTime}
          />

          {/* Date Range Section */}
          <View style={styles.dateRangeSection}>
            <Text style={[styles.sectionLabel, { fontFamily: 'Poppins_700Bold' }]}>Pass Duration</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateCol}>
                <View style={styles.dateIconLabel}>
                  <Ionicons name="calendar-outline" size={14} color="#FF7A3E" />
                  <Text style={[styles.dateLabel, { fontFamily: 'Poppins_600SemiBold' }]}>From Date</Text>
                </View>
                <TextInput
                  style={[styles.dateInput, { fontFamily: 'Poppins_500Medium' }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#CCC"
                  value={fromDate}
                  onChangeText={setFromDate}
                />
              </View>
              <View style={styles.dateCol}>
                <View style={styles.dateIconLabel}>
                  <Ionicons name="calendar-outline" size={14} color="#FF7A3E" />
                  <Text style={[styles.dateLabel, { fontFamily: 'Poppins_600SemiBold' }]}>To Date</Text>
                </View>
                <TextInput
                  style={[styles.dateInput, { fontFamily: 'Poppins_500Medium' }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#CCC"
                  value={toDate}
                  onChangeText={setToDate}
                />
              </View>
            </View>
          </View>

          {/* Parent Consent Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { fontFamily: 'Poppins_700Bold' }]}>Parent Consent Verification</Text>
            <View style={styles.infoBox}>
              <Ionicons name="call-outline" size={16} color="#FF7A3E" />
              <Text style={[styles.infoBoxText, { fontFamily: 'Poppins_500Medium' }]}>Verify with parent: {PARENT_VERIFICATION_NUMBER}</Text>
            </View>
            <TextInput
              style={[styles.input, styles.multiInput, { fontFamily: 'Poppins_500Medium' }]}
              placeholder="Parent consent details (required)"
              placeholderTextColor="#999"
              value={parentConsentNote}
              onChangeText={setParentConsentNote}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Mentor Section */}
          {!!latestPass?.mentorRequired && passStatus === STATUS.PENDING && (
            <View style={styles.mentorSection}>
              <Text style={[styles.sectionLabel, { fontFamily: 'Poppins_700Bold' }]}>Mentor Application</Text>
              <Text style={[styles.sectionInfo, { fontFamily: 'Poppins_500Medium' }]}>Required: Yes</Text>

              {latestPass?.mentorStatus === 'APPLICABLE' && (
                <View style={styles.mentorApprovedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#4ADE80" />
                  <Text style={[styles.mentorApprovedText, { fontFamily: 'Poppins_700Bold' }]}>Mentor Proof APPROVED</Text>
                </View>
              )}
              {latestPass?.mentorStatus === 'NOT_APPLICABLE' && (
                <View style={styles.mentorRejectedBadge}>
                  <Ionicons name="close-circle" size={14} color="#EF4444" />
                  <Text style={[styles.mentorRejectedText, { fontFamily: 'Poppins_700Bold' }]}>Mentor Proof REJECTED</Text>
                </View>
              )}
              {!['APPLICABLE', 'NOT_APPLICABLE'].includes(latestPass?.mentorStatus) && (
                <Text style={[styles.sectionInfo, { fontFamily: 'Poppins_400Regular', marginBottom: 8 }]}>
                  {latestPass?.mentorStatus === 'REQUESTED'
                    ? 'Upload your mentor application photo for approval.'
                    : latestPass?.mentorStatus === 'SUBMITTED'
                      ? 'Your photo has been submitted. Awaiting approval.'
                      : 'Please upload proof of your mentor application.'}
                </Text>
              )}

              {!!latestPass?.mentorProofImage && (
                <TouchableOpacity
                  style={styles.mentorImageLink}
                  onPress={() => Linking.openURL(latestPass.mentorProofImage)}
                >
                  <Ionicons name="document-text-outline" size={14} color="#FF7A3E" />
                  <Text style={[styles.mentorImageLinkText, { fontFamily: 'Poppins_600SemiBold' }]}>
                    View Current Upload
                  </Text>
                </TouchableOpacity>
              )}

              {latestPass?.mentorStatus !== 'APPLICABLE' && (
                <TouchableOpacity
                  style={[styles.secondaryButton, { fontFamily: 'Poppins_700Bold' }]}
                  onPress={handleUploadMentorProof}
                  activeOpacity={0.85}
                >
                  <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
                  <Text style={[styles.secondaryButtonText, { fontFamily: 'Poppins_700Bold', marginLeft: 6 }]}>
                    {latestPass?.mentorStatus === 'NOT_APPLICABLE' ? 'Upload New Photo' : 'Upload Mentor Proof'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <TouchableOpacity
            style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
            onPress={handleApply}
            disabled={isSubmitting}
            activeOpacity={0.9}
          >
            <Text style={[styles.primaryButtonText, { fontFamily: 'Poppins_800ExtraBold' }]}>
              {isSubmitting ? 'SUBMITTING...' : 'APPLY FOR GATE PASS'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Pass Card */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>Active Pass Status</Text>
            <TouchableOpacity
              style={[styles.refreshButton, isRefreshing && { opacity: 0.6 }]}
              onPress={() => {
                refreshStatus();
                refreshHistory();
              }}
              disabled={isRefreshing}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={14} color="#FF7A3E" />
              <Text style={[styles.refreshButtonText, { fontFamily: 'Poppins_600SemiBold' }]}>
                {isRefreshing ? 'Updating...' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {passStatus === STATUS.NONE && (
            <View style={styles.emptyState}>
              <Ionicons name="document-outline" size={40} color="#DDD" />
              <Text style={[styles.emptyStateText, { fontFamily: 'Poppins_600SemiBold' }]}>No Active Pass</Text>
              <Text style={[styles.emptyStateHint, { fontFamily: 'Poppins_400Regular' }]}>Submit a request above to get started.</Text>
            </View>
          )}

          {passStatus === STATUS.PENDING && (
            <View style={styles.statusSection}>
              <View style={styles.statusBadge}>
                <Ionicons name="hourglass-outline" size={16} color="#FF9C00" />
                <Text style={[styles.statusBadgeText, { fontFamily: 'Poppins_700Bold', color: '#FF9C00' }]}>Pending Approval</Text>
              </View>
              <Text style={[styles.statusHint, { fontFamily: 'Poppins_500Medium' }]}>Your request is under warden review.</Text>
            </View>
          )}

          {passStatus === STATUS.APPROVED && (
            <View style={styles.approvedSection}>
              <Text style={[styles.approvedTitle, { fontFamily: 'Poppins_700Bold' }]}>✓ Pass Approved</Text>
              <View style={styles.qrContainer}>
                <QRCode value={currentPassId || 'N/A'} size={160} />
              </View>
              <View style={styles.passDetailsGrid}>
                <View style={styles.passDetail}>
                  <Text style={[styles.passDetailLabel, { fontFamily: 'Poppins_500Medium' }]}>Pass ID</Text>
                  <Text style={[styles.passDetailValue, { fontFamily: 'Poppins_700Bold' }]}>{currentPassId || 'N/A'}</Text>
                </View>
                <View style={styles.passDetail}>
                  <Text style={[styles.passDetailLabel, { fontFamily: 'Poppins_500Medium' }]}>Exit Time</Text>
                  <Text style={[styles.passDetailValue, { fontFamily: 'Poppins_700Bold' }]}>{latestPass?.outTime || 'N/A'}</Text>
                </View>
                <View style={styles.passDetail}>
                  <Text style={[styles.passDetailLabel, { fontFamily: 'Poppins_500Medium' }]}>Entry Time</Text>
                  <Text style={[styles.passDetailValue, { fontFamily: 'Poppins_700Bold' }]}>{latestPass?.inTime || 'N/A'}</Text>
                </View>
              </View>
            </View>
          )}

          {[STATUS.REJECTED, STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(passStatus) && (
            <View style={styles.statusSection}>
              <View style={styles.statusBadge}>
                <Ionicons
                  name={passStatus === STATUS.REJECTED ? 'close-circle-outline' : 'checkmark-done-outline'}
                  size={16}
                  color={passStatus === STATUS.REJECTED ? '#EF4444' : '#4ADE80'}
                />
                <Text
                  style={[
                    styles.statusBadgeText,
                    { fontFamily: 'Poppins_700Bold', color: passStatus === STATUS.REJECTED ? '#EF4444' : '#4ADE80' },
                  ]}
                >
                  {passStatus}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* History Card */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>Pass History</Text>

          {historyLoading ? (
            <View style={styles.loadingState}>
              <Text style={[styles.loadingText, { fontFamily: 'Poppins_500Medium' }]}>Loading history...</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={32} color="#DDD" />
              <Text style={[styles.emptyStateText, { fontFamily: 'Poppins_500Medium' }]}>No History</Text>
            </View>
          ) : (
            <>
              <View style={styles.historyHeader}>
                <Text style={[styles.historyHeaderText, styles.historyDateCol, { fontFamily: 'Poppins_600SemiBold' }]}>Date</Text>
                <Text style={[styles.historyHeaderText, styles.historyTypeCol, { fontFamily: 'Poppins_600SemiBold' }]}>Type</Text>
                <Text style={[styles.historyHeaderText, styles.historyReasonCol, { fontFamily: 'Poppins_600SemiBold' }]}>Reason</Text>
                <Text style={[styles.historyHeaderText, styles.historyStatusCol, { fontFamily: 'Poppins_600SemiBold' }]}>Status</Text>
              </View>

              {history.map((item, index) => {
                const itemStatus = normalizeStatus(item?.status);
                const meta = getStatusMeta(itemStatus);
                return (
                  <View key={getPassId(item) || `history-${index}`} style={styles.historyRow}>
                    <Text style={[styles.historyCell, styles.historyDateCol, { fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
                      {formatDate(item?.updatedAt || item?.createdAt, getPassId(item))}
                    </Text>
                    <Text style={[styles.historyCell, styles.historyTypeCol, { fontFamily: 'Poppins_500Medium' }]} numberOfLines={1}>
                      {item?.mentorRequired ? 'Mentor' : 'Gate'}
                    </Text>
                    <Text style={[styles.historyCell, styles.historyReasonCol, { fontFamily: 'Poppins_400Regular' }]} numberOfLines={1}>
                      {item?.reason || 'N/A'}
                    </Text>
                    <View style={[styles.historyCell, styles.historyStatusCol]}>
                      <View style={[styles.historyStatusBadge, { backgroundColor: meta.bg }]}>
                        <Ionicons name={meta.icon} size={11} color={meta.color} />
                        <Text style={[styles.historyStatusText, { color: meta.color, fontFamily: 'Poppins_600SemiBold' }]}>
                          {meta.label}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })}
            </>
          )}
        </View>

        <TouchableOpacity
          style={[styles.logoutButton, { fontFamily: 'Poppins_700Bold' }]}
          onPress={() => navigation.replace('Login')}
          activeOpacity={0.85}
        >
          <Text style={[styles.logoutButtonText, { fontFamily: 'Poppins_700Bold' }]}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {[
          { key: 'PASSES', icon: 'card-outline', label: 'PASSES' },
          { key: 'PROFILE', icon: 'person-outline', label: 'PROFILE' },
        ].map((item) => {
          const active = item.key === 'PASSES';
          return (
            <Pressable key={item.key} onPress={() => handleBottomNav(item.key)} style={styles.navItem}>
              <Ionicons name={item.icon} size={20} color={active ? '#FF7A3E' : '#999'} />
              <Text style={[styles.navLabel, active && styles.navLabelActive, { fontFamily: active ? 'Poppins_600SemiBold' : 'Poppins_500Medium' }]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFAF8',
  },
  header: {
    paddingHorizontal: 0,
    paddingTop: Platform.OS === 'web' ? 0 : 12,
    paddingBottom: 0,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 40 : 50,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoMark: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logoMarkText: {
    color: '#FF7A3E',
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 14,
  },
  brandName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins_800ExtraBold',
  },
  welcomeText: {
    color: '#FFE0E0',
    fontSize: 12,
    fontFamily: 'Poppins_500Medium',
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },
  statsBar: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statPending: {
    backgroundColor: 'rgba(255,193,7,0.15)',
    borderColor: 'rgba(255,193,7,0.3)',
  },
  statApproved: {
    backgroundColor: 'rgba(76,175,80,0.15)',
    borderColor: 'rgba(76,175,80,0.3)',
  },
  statRejected: {
    backgroundColor: 'rgba(244,67,54,0.15)',
    borderColor: 'rgba(244,67,54,0.3)',
  },
  statLabel: {
    fontSize: 11,
    fontFamily: 'Poppins_500Medium',
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#111',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E8EBED',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: {
    color: '#111827',
    fontSize: 16,
    fontFamily: 'Poppins_800ExtraBold',
    marginBottom: 4,
  },
  cardDescription: {
    color: '#6B7280',
    fontSize: 12,
    marginBottom: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    fontSize: 13,
    marginBottom: 10,
  },
  dateInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: '#111827',
    fontSize: 13,
  },
  multiInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  dateRangeSection: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCol: {
    flex: 1,
  },
  dateIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  dateLabel: {
    color: '#374151',
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    marginLeft: 6,
  },
  section: {
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F5',
  },
  sectionLabel: {
    color: '#111827',
    fontSize: 13,
    fontFamily: 'Poppins_700Bold',
    marginBottom: 10,
  },
  sectionInfo: {
    color: '#6B7280',
    fontSize: 12,
  },
  infoBox: {
    backgroundColor: 'rgba(255,122,62,0.15)',
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#FF7A3E',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoBoxText: {
    color: '#7A1E1E',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },
  mentorSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECEFF3',
    padding: 12,
    marginBottom: 12,
  },
  mentorApprovedBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.35)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorApprovedText: {
    color: '#4ADE80',
    fontSize: 12,
    marginLeft: 6,
  },
  mentorRejectedBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorRejectedText: {
    color: '#EF4444',
    fontSize: 12,
    marginLeft: 6,
  },
  mentorImageLink: {
    backgroundColor: 'rgba(255,122,62,0.1)',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#F0D0D0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  mentorImageLinkText: {
    color: '#FF7A3E',
    fontSize: 12,
    marginLeft: 6,
  },
  mentorImageLinkUrl: {
    color: '#999',
    fontSize: 10,
    marginLeft: 6,
  },
  primaryButton: {
    backgroundColor: '#FF7A3E',
    minHeight: 48,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    flexDirection: 'row',
    shadowColor: '#FF7A3E',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    letterSpacing: 0.3,
  },
  secondaryButton: {
    backgroundColor: '#FF9C42',
    minHeight: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 8,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,122,62,0.15)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F0D0D0',
  },
  refreshButtonText: {
    color: '#FF7A3E',
    fontSize: 11,
    marginLeft: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(255,152,0,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,152,0,0.3)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  statusBadgeText: {
    marginLeft: 6,
    fontSize: 12,
  },
  statusHint: {
    color: '#6B7280',
    fontSize: 12,
    marginLeft: 0,
  },
  approvedSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  approvedTitle: {
    color: '#4ADE80',
    fontSize: 14,
    marginBottom: 14,
  },
  qrContainer: {
    borderWidth: 2,
    borderColor: '#FF7A3E',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  passDetailsGrid: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#ECEFF3',
    paddingTop: 12,
  },
  passDetail: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  passDetailLabel: {
    color: '#6B7280',
    fontSize: 11,
  },
  passDetailValue: {
    color: '#111827',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  emptyStateText: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 10,
  },
  emptyStateHint: {
    color: '#999',
    fontSize: 11,
    marginTop: 4,
  },
  loadingState: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    fontSize: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
    borderBottomWidth: 1.5,
    borderBottomColor: '#ECEFF3',
  },
  historyHeaderText: {
    color: '#6B7280',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  historyDateCol: {
    width: '30%',
  },
  historyTypeCol: {
    width: '15%',
  },
  historyReasonCol: {
    width: '30%',
  },
  historyStatusCol: {
    width: '25%',
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    alignItems: 'center',
  },
  historyCell: {
    color: '#111827',
    fontSize: 12,
  },
  historyStatusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyStatusText: {
    marginLeft: 4,
    fontSize: 10,
  },
  logoutButton: {
    backgroundColor: 'rgba(255,122,62,0.2)',
    minHeight: 48,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#F0D0D0',
  },
  logoutButtonText: {
    color: '#FF7A3E',
    fontSize: 13,
  },
  bottomNav: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
    borderWidth: 1,
    borderColor: '#ECEFF3',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'flex-end',
    minWidth: 60,
    paddingVertical: 6,
  },
  navLabel: {
    marginTop: 4,
    fontSize: 9,
    color: '#999',
  },
  navLabelActive: {
    color: '#FF7A3E',
  },
});


