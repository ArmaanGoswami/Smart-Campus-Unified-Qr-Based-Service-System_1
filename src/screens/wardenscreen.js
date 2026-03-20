import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
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

// Alert.alert button callbacks do not work on web, so use platform-aware confirmation
const crossConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', onPress: onConfirm },
  ]);
};

const PARENT_VERIFICATION_NUMBER = '9876543210';
const TAB = { PENDING: 'PENDING', HISTORY: 'HISTORY' };
const STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  USED: 'USED',
  EXITED: 'EXITED',
  COMPLETED: 'COMPLETED',
};

const normalizeStatus = (value) => String(value || '').toUpperCase();
const getPassId = (item) => String(item?.id || item?._id || item?.passId || '').trim();

const formatDate = (value, fallbackId) => {
  const parsed = value ? new Date(value) : null;
  if (parsed && !Number.isNaN(parsed.getTime())) return parsed.toLocaleString();
  const str = String(fallbackId || '');
  if (/^[0-9a-fA-F]{24}$/.test(str)) {
    const ms = parseInt(str.slice(0, 8), 16) * 1000;
    if (!Number.isNaN(ms)) return new Date(ms).toLocaleString();
  }
  return 'N/A';
};

const getStatusMeta = (status) => {
  const s = normalizeStatus(status);
  if (s === STATUS.APPROVED) return { text: '#4ADE80', bg: 'rgba(74, 222, 128, 0.2)' };
  if (s === STATUS.REJECTED) return { text: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
  if ([STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(s)) return { text: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' };
  return { text: '#FF7A3E', bg: 'rgba(255, 195, 132, 0.25)' };
};

export default function WardenScreen({ navigation }) {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
  });

  const [requests, setRequests] = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingPend, setLoadingPend] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);
  const [actionId, setActionId] = useState('');
  const [activeTab, setActiveTab] = useState(TAB.PENDING);
  const [searchText, setSearchText] = useState('');

  const fetchPending = useCallback(async () => {
    try {
      setLoadingPend(true);
      const data = await request('/pending', { method: 'GET' });
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('API Error', e?.message || 'Unable to load pending requests.');
    } finally {
      setLoadingPend(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      setLoadingHist(true);
      const data = await request('/history', { method: 'GET' });
      setHistoryLogs(Array.isArray(data) ? data : []);
    } catch (e) {
      Alert.alert('API Error', e?.message || 'Unable to load history logs.');
    } finally {
      setLoadingHist(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
    fetchHistory();
  }, [fetchHistory, fetchPending]);

  const refreshTab = useCallback(async () => {
    if (activeTab === TAB.PENDING) {
      await fetchPending();
      return;
    }
    await fetchHistory();
  }, [activeTab, fetchHistory, fetchPending]);

  const withAction = async (id, fn, successMessage) => {
    if (!id) {
      Alert.alert('Missing ID', 'Request ID is missing.');
      return;
    }
    try {
      setActionId(id);
      await fn();
      await Promise.all([fetchPending(), fetchHistory()]);
      if (successMessage) {
        Alert.alert('Updated', successMessage);
      }
    } catch (e) {
      Alert.alert('API Error', e?.message || 'Action failed.');
    } finally {
      setActionId('');
    }
  };

  const confirmApprove = (item) => {
    const parentStatus = normalizeStatus(item?.parentApprovalStatus || 'PENDING');
    const mentorStatus = normalizeStatus(item?.mentorStatus || 'NONE');
    const mentorNeeded = !!item?.mentorRequired || ['REQUESTED', 'SUBMITTED'].includes(mentorStatus);

    if (parentStatus !== 'APPROVED') {
      Alert.alert('Parent Approval Mandatory', 'Please approve parent verification first (Call Verified or WhatsApp Verified).');
      return;
    }

    if (mentorNeeded && mentorStatus !== 'APPLICABLE') {
      Alert.alert('Mentor Review Pending', 'Mentor proof is currently in SUBMITTED/REQUESTED state. Please approve or reject first.');
      return;
    }

    crossConfirm(
      'Approve Pass',
      'Is gate pass request ko approve karein?',
      () => withAction(getPassId(item), () => request(`/${getPassId(item)}/approve`, { method: 'PUT' }), 'Gate pass approved successfully.')
    );
  };

  const confirmReject = (item) => {
    crossConfirm(
      'Reject Pass',
      'Reject this request? This action cannot be reversed.',
      () => withAction(getPassId(item), () => request(`/${getPassId(item)}/reject`, { method: 'PUT' }), 'Request was rejected.')
    );
  };

  const handleParentReview = (item, approved, mode) =>
    withAction(
      getPassId(item),
      () => request(`/${getPassId(item)}/parent-review?approved=${approved}&mode=${mode}`, { method: 'PUT' }),
      approved ? `Parent verification marked via ${mode}.` : 'Parent verification marked not verified.'
    );

  const handleSetMentorRequirement = (item, required) =>
    withAction(
      getPassId(item),
      () => request(`/${getPassId(item)}/mentor-requirement?required=${required}`, { method: 'PUT' }),
      required ? 'Mentor proof has been marked as required.' : 'Mentor proof requirement has been removed.'
    );

  const handleMentorRequest = (item) =>
    withAction(
      getPassId(item),
      () => request(`/${getPassId(item)}/mentor-request`, { method: 'PUT' }),
      'A mentor proof upload request was sent to the student.'
    );

  const handleMentorReview = (item, applicable) =>
    withAction(
      getPassId(item),
      () => request(`/${getPassId(item)}/mentor-review?applicable=${applicable}`, { method: 'PUT' }),
      applicable ? 'Mentor proof approved.' : 'Mentor proof rejected.'
    );

  const filteredData = useMemo(() => {
    const source = activeTab === TAB.PENDING ? requests : historyLogs;
    const q = searchText.trim().toLowerCase();
    if (!q) return source;
    return source.filter((item) =>
      [item?.studentName, item?.studentId, item?.reason, item?.outTime, item?.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [activeTab, historyLogs, requests, searchText]);

  const stats = useMemo(() => ({
    pending: requests.length,
    approved: historyLogs.filter((i) => normalizeStatus(i?.status) === STATUS.APPROVED).length,
    rejected: historyLogs.filter((i) => normalizeStatus(i?.status) === STATUS.REJECTED).length,
  }), [historyLogs, requests]);

  const renderActionButton = (label, variant, onPress, disabled) => (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.actionButton, styles[variant], disabled && styles.actionDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.actionButtonText}>{label}</Text>
    </TouchableOpacity>
  );

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.screen, styles.loadingWrap]}>
        <ActivityIndicator size="large" color="#FF7A3E" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <LinearGradient 
        colors={['#FFF1DD', '#FFEBE3', '#FF9A58', '#FF7A3E']} 
        start={{ x: 0.2, y: 0 }} 
        end={{ x: 1, y: 1.2 }}
        style={styles.backgroundGradient}
      />
      <LinearGradient
        colors={['#FF9C5E', '#FF8C42', '#FF7A3E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerBrand}>Smart Campus</Text>
          <Text style={styles.headerTitle}>Warden Dashboard</Text>
          <Text style={styles.headerSub}>Review and manage all gate pass requests</Text>
        </View>
        <View style={styles.pendingBadge}>
          <Text style={styles.pendingBadgeNum}>{stats.pending}</Text>
          <Text style={styles.pendingBadgeLbl}>Pending</Text>
        </View>
      </LinearGradient>

      <View style={styles.contentWrap}>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statOrange]}>
            <Text style={styles.statLbl}>Pending</Text>
            <Text style={styles.statNum}>{stats.pending}</Text>
          </View>
          <View style={[styles.statCard, styles.statGreen]}>
            <Text style={styles.statLbl}>Approved</Text>
            <Text style={styles.statNum}>{stats.approved}</Text>
          </View>
          <View style={[styles.statCard, styles.statRed]}>
            <Text style={styles.statLbl}>Rejected</Text>
            <Text style={styles.statNum}>{stats.rejected}</Text>
          </View>
        </View>

        <View style={styles.toolbarCard}>
          <View style={styles.tabRow}>
            {renderActionButton('Pending', activeTab === TAB.PENDING ? 'tabActive' : 'tabInactive', () => setActiveTab(TAB.PENDING), false)}
            {renderActionButton('History', activeTab === TAB.HISTORY ? 'tabActive' : 'tabInactive', () => setActiveTab(TAB.HISTORY), false)}
          </View>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name, reason, id..."
              placeholderTextColor="#AAA"
            />
            {renderActionButton('Refresh', 'refreshAction', refreshTab, activeTab === TAB.PENDING ? loadingPend : loadingHist)}
          </View>
        </View>

        <ScrollView
          style={styles.listArea}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={activeTab === TAB.PENDING ? loadingPend : loadingHist} onRefresh={refreshTab} tintColor="#CF202E" />}
        >
          {filteredData.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{activeTab === TAB.PENDING ? 'No pending requests' : 'No history logs'}</Text>
              <Text style={styles.emptyTxt}>No records available right now.</Text>
            </View>
          ) : (
            filteredData.map((item, index) => {
              const id = getPassId(item) || `row-${index}`;
              const isBusy = actionId === id;
              const statusMeta = getStatusMeta(item?.status);
              const mentorStatus = normalizeStatus(item?.mentorStatus || 'NONE');
              const mentorNeeded = !!item?.mentorRequired || ['REQUESTED', 'SUBMITTED', 'APPLICABLE', 'NOT_APPLICABLE'].includes(mentorStatus);
              const parentStatus = normalizeStatus(item?.parentApprovalStatus || 'PENDING');
              const parentMode = normalizeStatus(item?.parentApprovalMode || 'NONE');
              const mentorProofImage = String(item?.mentorProofImage || '').trim();

              return (
                <View key={id} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.studentName}>{item?.studentName || item?.studentId || 'Unknown Student'}</Text>
                      <Text style={styles.studentId}>ID: {item?.studentId || 'N/A'}</Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: statusMeta.bg }]}>
                      <Text style={[styles.statusChipText, { color: statusMeta.text }]}>{normalizeStatus(item?.status) || 'N/A'}</Text>
                    </View>
                  </View>

                  <Text style={styles.detailLabel}>Reason</Text>
                  <Text style={styles.detailValue}>{item?.reason || 'No reason provided'}</Text>

                  <View style={styles.parentSection}>
                    <Text style={styles.sectionTitle}>Parent Consent</Text>
                    <Text style={styles.infoText}>Verify on parent desk number: {PARENT_VERIFICATION_NUMBER}</Text>
                    <Text style={styles.infoText}>{item?.parentConsentNote || 'Parent note missing'}</Text>
                    <Text style={styles.infoStrong}>Status: {parentStatus}{parentMode !== 'NONE' ? ` (${parentMode})` : ''}</Text>
                    {activeTab === TAB.PENDING && (
                      <View style={styles.buttonRowWrap}>
                        {renderActionButton('Not Verified', 'neutralAction', () => handleParentReview(item, false, 'NONE'), isBusy)}
                        {renderActionButton('Call Verified', 'successAction', () => handleParentReview(item, true, 'CALL'), isBusy)}
                        {renderActionButton('WhatsApp Verified', 'successAction', () => handleParentReview(item, true, 'WHATSAPP'), isBusy)}
                      </View>
                    )}
                  </View>

                  <View style={styles.mentorSection}>
                    <Text style={styles.sectionTitle}>Mentor Application</Text>
                    <Text style={styles.infoStrong}>Required: {mentorNeeded ? 'Yes' : 'No'}</Text>

                    {/* Clear status badge */}
                    {mentorStatus === 'APPLICABLE' && (
                      <View style={styles.mentorApprovedBadge}>
                        <Text style={styles.mentorApprovedText}>✓ Mentor Proof APPROVED</Text>
                      </View>
                    )}
                    {mentorStatus === 'NOT_APPLICABLE' && (
                      <View style={styles.mentorRejectedBadge}>
                        <Text style={styles.mentorRejectedText}>✗ Mentor Proof REJECTED</Text>
                      </View>
                    )}
                    {mentorStatus !== 'APPLICABLE' && mentorStatus !== 'NOT_APPLICABLE' && (
                      <Text style={styles.infoText}>
                        {mentorStatus === 'REQUESTED'
                          ? 'A mentor proof upload request was sent to the student. You can also approve directly.'
                          : mentorStatus === 'SUBMITTED'
                            ? 'The student has uploaded mentor proof. Please approve or reject.'
                            : 'Mentor proof is either not required yet or has not been uploaded.'}
                      </Text>
                    )}

                    {!!mentorProofImage && (
                      <TouchableOpacity onPress={() => Linking.openURL(mentorProofImage)} style={styles.mentorImageLink}>
                        <Text style={styles.mentorImageLinkText}>📎 View Mentor Proof Image</Text>
                        <Text style={styles.mentorImageLinkUrl} numberOfLines={1}>{mentorProofImage}</Text>
                      </TouchableOpacity>
                    )}

                    {activeTab === TAB.PENDING && (
                      <View style={styles.buttonRowWrap}>
                        {!mentorNeeded && renderActionButton('Mentor Needed', 'primaryAction', () => handleSetMentorRequirement(item, true), isBusy)}
                        {mentorNeeded && mentorStatus !== 'APPLICABLE' && renderActionButton('No Mentor Needed', 'neutralAction', () => handleSetMentorRequirement(item, false), isBusy)}
                        {mentorNeeded && mentorStatus === 'NONE' && renderActionButton('Ask Mentor Photo', 'primaryAction', () => handleMentorRequest(item), isBusy)}
                        {mentorNeeded && mentorStatus === 'REQUESTED' && renderActionButton('Approve Without Photo', 'successAction', () => handleMentorReview(item, true), isBusy)}
                        {(mentorStatus === 'SUBMITTED' || (!!mentorProofImage && mentorStatus !== 'APPLICABLE' && mentorStatus !== 'NOT_APPLICABLE')) && renderActionButton('Reject Mentor Proof', 'neutralAction', () => handleMentorReview(item, false), isBusy)}
                        {(mentorStatus === 'SUBMITTED' || (!!mentorProofImage && mentorStatus !== 'APPLICABLE' && mentorStatus !== 'NOT_APPLICABLE')) && renderActionButton('Approve Mentor Proof', 'successAction', () => handleMentorReview(item, true), isBusy)}
                      </View>
                    )}
                  </View>

                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Text style={styles.metaKey}>Out Time</Text>
                      <Text style={styles.metaVal}>{item?.outTime || 'N/A'}</Text>
                    </View>
                    <View style={[styles.metaPill, { marginRight: 0 }]}>
                      <Text style={styles.metaKey}>Updated</Text>
                      <Text style={styles.metaVal}>{formatDate(item?.updatedAt || item?.createdAt, id)}</Text>
                    </View>
                  </View>

                  {activeTab === TAB.PENDING && (
                    <View style={styles.buttonRowWrap}>
                      {renderActionButton('Reject', 'dangerAction', () => confirmReject(item), isBusy)}
                      {renderActionButton('Approve', 'approveAction', () => confirmApprove(item), isBusy)}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {renderActionButton('Logout', 'logoutAction', () => navigation.replace('Login'), false)}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  loadingWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: '#FF7A3E',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  header: {
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 9,
    zIndex: 3,
  },
  headerBrand: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, letterSpacing: 0.5, marginBottom: 4, fontFamily: 'Poppins_700Bold' },
  headerTitle: { color: '#FFFFFF', fontSize: 23, letterSpacing: 0.2, fontFamily: 'Poppins_800ExtraBold' },
  headerSub: { color: 'rgba(255, 255, 255, 0.85)', fontSize: 13, marginTop: 4, maxWidth: 240, lineHeight: 18, fontFamily: 'Poppins_500Medium' },
  pendingBadge: {
    minWidth: 72,
    height: 72,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    backdropFilter: 'blur(10px)',
  },
  pendingBadgeNum: { fontSize: 24, color: '#FFFFFF', lineHeight: 26, fontFamily: 'Poppins_800ExtraBold' },
  pendingBadgeLbl: { fontSize: 11, color: '#FFFFFF', fontFamily: 'Poppins_700Bold' },
  contentWrap: { flex: 1, padding: 13, paddingTop: 11, zIndex: 2 },
  statsRow: { flexDirection: 'row', marginBottom: 10, justifyContent: 'space-between' },
  statCard: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10, marginHorizontal: 3, borderWidth: 1.2 },
  statOrange: { backgroundColor: 'rgba(255, 195, 132, 0.25)', borderColor: 'rgba(255, 188, 120, 0.35)' },
  statGreen: { backgroundColor: 'rgba(74, 222, 128, 0.18)', borderColor: 'rgba(132, 204, 22, 0.3)' },
  statRed: { backgroundColor: 'rgba(248, 113, 113, 0.15)', borderColor: 'rgba(239, 68, 68, 0.25)' },
  statLbl: { color: '#6B6B6B', fontSize: 11, fontFamily: 'Poppins_700Bold' },
  statNum: { color: '#1A1A1A', fontSize: 22, marginTop: 2, fontFamily: 'Poppins_800ExtraBold' },
  toolbarCard: { backgroundColor: 'rgba(255, 255, 255, 0.54)', borderRadius: 14, padding: 12, borderWidth: 1.2, borderColor: 'rgba(255, 255, 255, 0.6)', marginBottom: 10, backdropFilter: 'blur(12px)' },
  tabRow: { flexDirection: 'row', marginBottom: 10 },
  searchRow: { flexDirection: 'row', alignItems: 'center' },
  searchInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    borderRadius: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 188, 120, 0.28)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1A1A1A',
    fontSize: 15,
    marginRight: 8,
    backdropFilter: 'blur(8px)',
    fontFamily: 'Poppins_500Medium',
  },
  listArea: { flex: 1 },
  listContent: { paddingBottom: 10 },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: 14,
    marginBottom: 10,
    backdropFilter: 'blur(12px)',
    shadowColor: 'rgba(255, 122, 62, 0.3)',
    shadowOpacity: 0.2,
    shadowRadius: 14,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  studentName: { color: '#151515', fontSize: 17, marginBottom: 2, fontFamily: 'Poppins_800ExtraBold', letterSpacing: 0.2 },
  studentId: { color: '#666666', fontSize: 12, fontFamily: 'Poppins_600SemiBold' },
  statusChip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 0.8, borderColor: 'rgba(255, 188, 120, 0.3)' },
  statusChipText: { fontSize: 11, fontFamily: 'Poppins_700Bold' },
  detailLabel: { fontSize: 11, color: '#E7672E', marginBottom: 2, fontFamily: 'Poppins_700Bold' },
  detailValue: { fontSize: 14, color: '#151515', marginBottom: 8, lineHeight: 20, fontFamily: 'Poppins_500Medium' },
  sectionTitle: { color: '#E7672E', fontSize: 14, marginBottom: 8, fontFamily: 'Poppins_800ExtraBold', letterSpacing: 0.2 },
  parentSection: { backgroundColor: 'rgba(255, 255, 255, 0.32)', borderWidth: 1.3, borderColor: 'rgba(255, 122, 62, 0.35)', borderRadius: 12, padding: 10, marginBottom: 8, backdropFilter: 'blur(8px)' },
  mentorSection: { backgroundColor: 'rgba(255, 255, 255, 0.32)', borderWidth: 1.3, borderColor: 'rgba(255, 122, 62, 0.35)', borderRadius: 12, padding: 10, marginBottom: 8, backdropFilter: 'blur(8px)' },
  infoText: { color: '#3F3F3F', fontSize: 14, lineHeight: 20, marginBottom: 4, fontFamily: 'Poppins_500Medium' },
  infoStrong: { color: '#D95F2A', fontSize: 12, marginBottom: 4, fontFamily: 'Poppins_700Bold' },
  mentorImageLink: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 122, 62, 0.15)',
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(255, 188, 120, 0.3)',
  },
  mentorImageLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF7A3E',
    marginBottom: 6,
    fontFamily: 'Poppins_600SemiBold',
  },
  mentorImageLinkUrl: {
    fontSize: 11,
    color: '#999999',
    fontFamily: 'monospace',
  },
  metaRow: { flexDirection: 'row', marginBottom: 2 },
  metaPill: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 0.8, borderColor: 'rgba(255, 188, 120, 0.25)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginRight: 8, backdropFilter: 'blur(8px)' },
  metaKey: { color: '#666666', fontSize: 11, marginBottom: 2, fontFamily: 'Poppins_700Bold' },
  metaVal: { color: '#151515', fontSize: 12, fontFamily: 'Poppins_500Medium' },
  buttonRowWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', marginTop: 10 },
  actionButton: {
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginLeft: 8,
    marginTop: 8,
    cursor: 'pointer',
  },
  primaryAction: { backgroundColor: 'rgba(255, 122, 62, 0.8)', borderColor: 'rgba(255, 188, 120, 0.28)', borderWidth: 1.1 },
  successAction: { backgroundColor: 'rgba(74, 222, 128, 0.75)', borderColor: 'rgba(132, 204, 22, 0.28)', borderWidth: 1.1 },
  neutralAction: { backgroundColor: 'rgba(255, 255, 255, 0.32)', borderColor: 'rgba(255, 188, 120, 0.32)', borderWidth: 1.1 },
  dangerAction: { backgroundColor: 'rgba(239, 68, 68, 0.7)', borderColor: 'rgba(255, 107, 107, 0.28)', borderWidth: 1.1 },
  approveAction: { backgroundColor: 'rgba(59, 130, 246, 0.7)', borderColor: 'rgba(147, 197, 253, 0.28)', borderWidth: 1.1 },
  refreshAction: { backgroundColor: 'rgba(255, 122, 62, 0.8)', minWidth: 96, borderColor: 'rgba(255, 188, 120, 0.28)', borderWidth: 1.1 },
  tabActive: { backgroundColor: 'rgba(255, 122, 62, 0.8)', minWidth: 90, borderColor: 'rgba(255, 188, 120, 0.28)', borderWidth: 1.1 },
  tabInactive: { backgroundColor: 'rgba(255, 255, 255, 0.2)', minWidth: 90, borderColor: 'rgba(255, 188, 120, 0.25)', borderWidth: 1.1 },
  logoutAction: { backgroundColor: 'rgba(255, 122, 62, 0.85)', minHeight: 50, marginTop: 8, borderColor: 'rgba(255, 188, 120, 0.32)', borderWidth: 1.2 },
  actionButtonText: { color: '#FFFFFF', fontSize: 13, letterSpacing: 0.25, fontFamily: 'Poppins_700Bold' },
  actionDisabled: { opacity: 0.55 },
  mentorApprovedBadge: { backgroundColor: 'rgba(74, 222, 128, 0.2)', borderWidth: 1.5, borderColor: 'rgba(74, 222, 128, 0.4)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6, alignSelf: 'flex-start' },
  mentorApprovedText: { color: '#4ADE80', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  mentorRejectedBadge: { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderWidth: 1.5, borderColor: 'rgba(239, 68, 68, 0.35)', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, marginBottom: 6, alignSelf: 'flex-start' },
  mentorRejectedText: { color: '#EF4444', fontSize: 13, fontFamily: 'Poppins_700Bold' },
  emptyBox: { marginTop: 16, backgroundColor: 'rgba(255, 255, 255, 0.4)', borderRadius: 14, borderWidth: 1.2, borderColor: 'rgba(255, 188, 120, 0.25)', padding: 22, alignItems: 'center', backdropFilter: 'blur(8px)' },
  emptyTitle: { color: '#E7672E', fontSize: 16, fontFamily: 'Poppins_800ExtraBold' },
  emptyTxt: { color: '#666666', fontSize: 13, marginTop: 5, textAlign: 'center', fontFamily: 'Poppins_500Medium' },
});


