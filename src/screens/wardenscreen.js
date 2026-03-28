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
import { useFonts } from 'expo-font';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import Svg, { Circle, Ellipse, Rect, Path, G } from 'react-native-svg';
import { request } from '../config/api';
import { crossAlert, crossConfirm } from '../config/utils';

const TAB = { PENDING: 'PENDING', HISTORY: 'HISTORY' };
const STATUS = {
  PENDING: 'PENDING', APPROVED: 'APPROVED', REJECTED: 'REJECTED',
  USED: 'USED', EXITED: 'EXITED', COMPLETED: 'COMPLETED',
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
  if (s === STATUS.APPROVED) return { text: '#1A6B3A', bg: '#D1FAE5', border: '#6EE7B7' };
  if (s === STATUS.REJECTED) return { text: '#991B1B', bg: '#FEE2E2', border: '#FCA5A5' };
  if ([STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(s))
    return { text: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' };
  return { text: '#1E40AF', bg: '#DBEAFE', border: '#93C5FD' };
};

// ─── Clay Warden Character ───────────────────────────────────────────────────
function WardenCharacter() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Ellipse cx="40" cy="76" rx="18" ry="4" fill="rgba(75,158,255,0.15)" />
      {/* Body */}
      <Rect x="16" y="48" width="48" height="34" rx="16" fill="#4B9EFF" />
      {/* Badge */}
      <Rect x="28" y="54" width="24" height="16" rx="6" fill="#fff" opacity="0.9" />
      <Rect x="32" y="58" width="16" height="3" rx="2" fill="#2563EB" opacity="0.8" />
      <Rect x="34" y="63" width="12" height="2" rx="1" fill="#2563EB" opacity="0.5" />
      {/* Neck */}
      <Rect x="32" y="40" width="16" height="12" rx="6" fill="#FDDCB0" />
      {/* Head */}
      <Circle cx="40" cy="30" r="22" fill="#FDDCB0" />
      {/* Hat */}
      <Rect x="20" y="12" width="40" height="6" rx="3" fill="#1D4ED8" />
      <Rect x="26" y="8" width="28" height="12" rx="5" fill="#2563EB" />
      {/* Eyes */}
      <Circle cx="34" cy="28" r="3.5" fill="#fff" />
      <Circle cx="46" cy="28" r="3.5" fill="#fff" />
      <Circle cx="34.8" cy="28.8" r="2" fill="#3D2314" />
      <Circle cx="46.8" cy="28.8" r="2" fill="#3D2314" />
      <Circle cx="35.3" cy="28.1" r="0.85" fill="#fff" />
      <Circle cx="47.3" cy="28.1" r="0.85" fill="#fff" />
      {/* Mouth */}
      <Path d="M34 38 Q40 43 46 38" stroke="#5B8FD9" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <Ellipse cx="28" cy="34" rx="4" ry="2.5" fill="#BFD9FF" opacity="0.8" />
      <Ellipse cx="52" cy="34" rx="4" ry="2.5" fill="#BFD9FF" opacity="0.8" />
    </Svg>
  );
}

// ─── Clay Blob Background ─────────────────────────────────────────────────────
function ClayBg() {
  return (
    <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
      <Ellipse cx="360" cy="80"  rx="120" ry="120" fill="#C7E0FF" opacity="0.55" />
      <Ellipse cx="20"  cy="320" rx="100" ry="100" fill="#D6EAFF" opacity="0.5"  />
      <Ellipse cx="380" cy="680" rx="110" ry="110" fill="#BDD9FF" opacity="0.4"  />
    </Svg>
  );
}

export default function WardenScreen({ navigation }) {
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
    Poppins_700Bold, Poppins_800ExtraBold,
  });

  const [requests,    setRequests]    = useState([]);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loadingPend, setLoadingPend] = useState(false);
  const [loadingHist, setLoadingHist] = useState(false);
  const [actionId,    setActionId]    = useState('');
  const [activeTab,   setActiveTab]   = useState(TAB.PENDING);
  const [searchText,  setSearchText]  = useState('');

  const fetchPending = useCallback(async () => {
    try {
      setLoadingPend(true);
      const data = await request('/pending', { method: 'GET' });
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {
      crossAlert('API Error', e?.message || 'Unable to load pending requests.');
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
      crossAlert('API Error', e?.message || 'Unable to load history logs.');
    } finally {
      setLoadingHist(false);
    }
  }, []);

  useEffect(() => { fetchPending(); fetchHistory(); }, [fetchHistory, fetchPending]);

  const refreshTab = useCallback(async () => {
    if (activeTab === TAB.PENDING) { await fetchPending(); return; }
    await fetchHistory();
  }, [activeTab, fetchHistory, fetchPending]);

  const withAction = async (id, fn, successMessage) => {
    if (!id) { crossAlert('Missing ID', 'Request ID is missing.'); return; }
    try {
      setActionId(id);
      await fn();
      await Promise.all([fetchPending(), fetchHistory()]);
      if (successMessage) crossAlert('Updated', successMessage);
    } catch (e) {
      crossAlert('API Error', e?.message || 'Action failed.');
    } finally {
      setActionId('');
    }
  };

  const confirmApprove = (item) => {
    const parentStatus = normalizeStatus(item?.parentApprovalStatus || 'PENDING');
    const mentorStatus = normalizeStatus(item?.mentorStatus || 'NONE');
    const mentorNeeded = !!item?.mentorRequired || ['REQUESTED', 'SUBMITTED', 'APPLICABLE', 'NOT_APPLICABLE'].includes(mentorStatus);
    if (parentStatus !== 'APPROVED') {
      crossAlert('Parent Approval Mandatory', 'Please approve parent verification first.');
      return;
    }
    if (mentorNeeded && mentorStatus !== 'APPLICABLE') {
      crossAlert('Mentor Review Pending', 'Mentor proof is currently pending. Please approve or reject first.');
      return;
    }
    crossConfirm('Approve Pass', 'Approve this gate pass request?',
      () => withAction(getPassId(item), () => request(`/${getPassId(item)}/approve`, { method: 'PUT' }), 'Gate pass approved.')
    );
  };

  const confirmReject = (item) =>
    crossConfirm('Reject Pass', 'Reject this request? Cannot be undone.',
      () => withAction(getPassId(item), () => request(`/${getPassId(item)}/reject`, { method: 'PUT' }), 'Request rejected.')
    );

  const handleParentReview = (item, approved, mode) =>
    withAction(getPassId(item),
      () => request(`/${getPassId(item)}/parent-review?approved=${approved}&mode=${mode}`, { method: 'PUT' }),
      approved ? `Parent verification marked via ${mode}.` : 'Parent marked not verified.'
    );

  const handleSetMentorRequirement = (item, required) =>
    withAction(getPassId(item),
      () => request(`/${getPassId(item)}/mentor-requirement?required=${required}`, { method: 'PUT' }),
      required ? 'Mentor proof marked required.' : 'Mentor proof requirement removed.'
    );

  const handleMentorRequest = (item) =>
    withAction(getPassId(item),
      () => request(`/${getPassId(item)}/mentor-request`, { method: 'PUT' }),
      'Mentor proof upload request sent to student.'
    );

  const handleMentorReview = (item, applicable) =>
    withAction(getPassId(item),
      () => request(`/${getPassId(item)}/mentor-review?applicable=${applicable}`, { method: 'PUT' }),
      applicable ? 'Mentor proof approved.' : 'Mentor proof rejected.'
    );

  const filteredData = useMemo(() => {
    const source = activeTab === TAB.PENDING ? requests : historyLogs;
    const q = searchText.trim().toLowerCase();
    if (!q) return source;
    return source.filter((item) =>
      [item?.studentName, item?.studentId, item?.reason, item?.outTime, item?.status]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [activeTab, historyLogs, requests, searchText]);

  const stats = useMemo(() => {
    const allRows = [...requests, ...historyLogs];
    return {
      pending:  requests.length,
      approved: allRows.filter((i) => normalizeStatus(i?.status) === STATUS.APPROVED).length,
      rejected: allRows.filter((i) => normalizeStatus(i?.status) === STATUS.REJECTED).length,
    };
  }, [historyLogs, requests]);

  // ─── Clay Action Button ────────────────────────────────────────────────────
  const ClayBtn = ({ label, color, textColor, onPress, disabled }) => (
    <TouchableOpacity
      activeOpacity={0.82}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.clayBtn,
        { backgroundColor: color || '#FF8C42', borderColor: lighten(color) },
        disabled && styles.clayBtnDisabled,
      ]}
    >
      <Text style={[styles.clayBtnText, textColor && { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );

  const lighten = (hex) => {
    if (!hex) return '#FFB880';
    const map = {
      '#FF8C42': '#FFB880', '#4ADE80': '#86EFAC', '#EF4444': '#FCA5A5',
      '#3B82F6': '#93C5FD', '#F5A623': '#FCD34D', '#E5E7EB': '#F3F4F6',
      '#FFFFFF': '#F3F4F6',
    };
    return map[hex] || '#FFD6B8';
  };

  if (!fontsLoaded && !fontError) {
    return (
      <View style={[styles.screen, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF8C42" />
        <Text style={{ color: '#FF8C42', fontWeight: '700', marginTop: 10 }}>Loading dashboard…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ClayBg />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerBrand}>Smart Campus</Text>
          <Text style={styles.headerTitle}>Warden Dashboard</Text>
          <Text style={styles.headerSub}>Manage gate pass requests</Text>
        </View>
        <View style={styles.headerRight}>
          <WardenCharacter />
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeNum}>{stats.pending}</Text>
            <Text style={styles.pendingBadgeLbl}>Pending</Text>
          </View>
        </View>
      </View>

      <View style={styles.contentWrap}>
        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Pending',  val: stats.pending,  bg: '#FEF3C7', border: '#FCD34D', tc: '#92400E' },
            { label: 'Approved', val: stats.approved, bg: '#D1FAE5', border: '#6EE7B7', tc: '#064E3B' },
            { label: 'Rejected', val: stats.rejected, bg: '#FEE2E2', border: '#FCA5A5', tc: '#7F1D1D' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.statLbl, { color: s.tc }]}>{s.label}</Text>
              <Text style={[styles.statNum, { color: s.tc }]}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* ── Toolbar ── */}
        <View style={styles.toolbarCard}>
          <View style={styles.tabRow}>
            {[TAB.PENDING, TAB.HISTORY].map((t) => (
              <TouchableOpacity
                key={t}
                activeOpacity={0.82}
                style={[styles.tabBtn, activeTab === t && styles.tabBtnActive]}
                onPress={() => setActiveTab(t)}
              >
                <Text style={[styles.tabBtnText, activeTab === t && styles.tabBtnTextActive]}>
                  {t === TAB.PENDING ? '⏳ Pending' : '📋 History'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Search by name, reason, id…"
              placeholderTextColor="#C4907A"
            />
            <TouchableOpacity
              style={[styles.refreshBtn, (activeTab === TAB.PENDING ? loadingPend : loadingHist) && { opacity: 0.6 }]}
              onPress={refreshTab}
              disabled={activeTab === TAB.PENDING ? loadingPend : loadingHist}
              activeOpacity={0.82}
            >
              <Text style={styles.refreshBtnText}>↻</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Request List ── */}
        <ScrollView
          style={styles.listArea}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={activeTab === TAB.PENDING ? loadingPend : loadingHist}
              onRefresh={refreshTab}
              tintColor="#FF8C42"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredData.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>{activeTab === TAB.PENDING ? '⏰' : '📂'}</Text>
              <Text style={styles.emptyTitle}>
                {activeTab === TAB.PENDING ? 'No pending requests' : 'No history logs'}
              </Text>
              <Text style={styles.emptyTxt}>Nothing to show right now.</Text>
            </View>
          ) : (
            filteredData.map((item, index) => {
              const id = getPassId(item) || `row-${index}`;
              const isBusy = actionId === id;
              const sm = getStatusMeta(item?.status);
              const mentorStatus  = normalizeStatus(item?.mentorStatus || 'NONE');
              const mentorNeeded  = !!item?.mentorRequired || ['REQUESTED', 'SUBMITTED', 'APPLICABLE', 'NOT_APPLICABLE'].includes(mentorStatus);
              const parentStatus  = normalizeStatus(item?.parentApprovalStatus || 'PENDING');
              const parentMode    = normalizeStatus(item?.parentApprovalMode || 'NONE');
              const mentorProofImage = String(item?.mentorProofImage || '').trim();

              return (
                <View key={id} style={styles.card}>
                  {/* Card header */}
                  <View style={styles.cardTopRow}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={[styles.studentName, { fontFamily: 'Poppins_800ExtraBold' }]}>
                        {item?.studentName || item?.studentId || 'Unknown Student'}
                      </Text>
                      <Text style={[styles.studentId, { fontFamily: 'Poppins_600SemiBold' }]}>
                        ID: {item?.studentId || 'N/A'}
                      </Text>
                    </View>
                    <View style={[styles.statusChip, { backgroundColor: sm.bg, borderColor: sm.border }]}>
                      <Text style={[styles.statusChipText, { color: sm.text, fontFamily: 'Poppins_700Bold' }]}>
                        {normalizeStatus(item?.status) || 'N/A'}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.detailLabel, { fontFamily: 'Poppins_700Bold' }]}>Reason</Text>
                  <Text style={[styles.detailValue, { fontFamily: 'Poppins_500Medium' }]}>
                    {item?.reason || 'No reason provided'}
                  </Text>

                  {/* Parent Section */}
                  <View style={styles.subCard}>
                    <Text style={[styles.subCardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>👨‍👩‍👧 Parent Consent</Text>
                    <Text style={[styles.infoText, { fontFamily: 'Poppins_500Medium' }]}>
                      {item?.parentConsentNote || 'Parent note missing'}
                    </Text>
                    <Text style={[styles.infoStrong, { fontFamily: 'Poppins_700Bold' }]}>
                      Status: {parentStatus}{parentMode !== 'NONE' ? ` (${parentMode})` : ''}
                    </Text>
                    {activeTab === TAB.PENDING && (
                      <View style={styles.btnRow}>
                        <ClayBtn 
                          label="Not Verified" 
                          color="#E5E7EB" 
                          textColor="#6B7280" 
                          onPress={() => handleParentReview(item, false, 'NONE')} 
                          disabled={isBusy || parentStatus === 'REJECTED'} 
                        />
                        <ClayBtn 
                          label={parentStatus === 'APPROVED' && parentMode === 'CALL' ? "Call ✓" : "Call"} 
                          color={parentStatus === 'APPROVED' && parentMode === 'CALL' ? "#4ADE80" : "#3B82F6"} 
                          onPress={() => handleParentReview(item, true, 'CALL')} 
                          disabled={isBusy || parentStatus === 'APPROVED'} 
                        />
                        <ClayBtn 
                          label={parentStatus === 'APPROVED' && parentMode === 'WHATSAPP' ? "WA ✓" : "WA"} 
                          color={parentStatus === 'APPROVED' && parentMode === 'WHATSAPP' ? "#4ADE80" : "#3B82F6"} 
                          onPress={() => handleParentReview(item, true, 'WHATSAPP')} 
                          disabled={isBusy || parentStatus === 'APPROVED'} 
                        />
                      </View>
                    )}
                  </View>

                  {/* Mentor Section */}
                  <View style={styles.subCard}>
                    <Text style={[styles.subCardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>📄 Mentor Application</Text>
                    <Text style={[styles.infoStrong, { fontFamily: 'Poppins_700Bold' }]}>
                      Required: {mentorNeeded ? 'Yes' : 'No'}
                    </Text>
                    {mentorStatus === 'APPLICABLE' && (
                      <View style={styles.approvedBadge}>
                        <Text style={[styles.approvedBadgeText, { fontFamily: 'Poppins_700Bold' }]}>✓ Mentor Proof APPROVED</Text>
                      </View>
                    )}
                    {mentorStatus === 'NOT_APPLICABLE' && (
                      <View style={styles.rejectedBadge}>
                        <Text style={[styles.rejectedBadgeText, { fontFamily: 'Poppins_700Bold' }]}>✗ Mentor Proof REJECTED</Text>
                      </View>
                    )}
                    {mentorStatus !== 'APPLICABLE' && mentorStatus !== 'NOT_APPLICABLE' && (
                      <Text style={[styles.infoText, { fontFamily: 'Poppins_500Medium' }]}>
                        {mentorStatus === 'REQUESTED'
                          ? 'Upload request sent to student.'
                          : mentorStatus === 'SUBMITTED'
                          ? 'Student uploaded proof. Please review.'
                          : 'Mentor proof not yet uploaded.'}
                      </Text>
                    )}
                    {!!mentorProofImage && (
                      <TouchableOpacity onPress={() => Linking.openURL(mentorProofImage)} style={styles.proofLink}>
                        <Text style={[styles.proofLinkText, { fontFamily: 'Poppins_600SemiBold' }]}>📎 View Mentor Proof</Text>
                      </TouchableOpacity>
                    )}
                    {activeTab === TAB.PENDING && (
                      <View style={styles.btnRow}>
                        {!mentorNeeded && <ClayBtn label="Mentor Needed" color="#FF8C42" onPress={() => handleSetMentorRequirement(item, true)} disabled={isBusy} />}
                        {mentorNeeded && mentorStatus !== 'APPLICABLE' && <ClayBtn label="No Mentor" color="#E5E7EB" textColor="#6B7280" onPress={() => handleSetMentorRequirement(item, false)} disabled={isBusy} />}
                        {mentorNeeded && mentorStatus === 'NONE' && <ClayBtn label="Ask Photo" color="#FF8C42" onPress={() => handleMentorRequest(item)} disabled={isBusy} />}
                        {mentorNeeded && mentorStatus === 'REQUESTED' && <ClayBtn label="Approve Direct" color="#4ADE80" onPress={() => handleMentorReview(item, true)} disabled={isBusy} />}
                        {(mentorStatus === 'SUBMITTED' || (!!mentorProofImage && !['APPLICABLE', 'NOT_APPLICABLE'].includes(mentorStatus))) && (
                          <>
                            <ClayBtn label="Reject Proof" color="#E5E7EB" textColor="#991B1B" onPress={() => handleMentorReview(item, false)} disabled={isBusy} />
                            <ClayBtn label="Approve Proof" color="#4ADE80" onPress={() => handleMentorReview(item, true)} disabled={isBusy} />
                          </>
                        )}
                      </View>
                    )}
                  </View>

                  {/* Meta Row */}
                  <View style={styles.metaRow}>
                    <View style={styles.metaPill}>
                      <Text style={[styles.metaKey, { fontFamily: 'Poppins_700Bold' }]}>Out Time</Text>
                      <Text style={[styles.metaVal, { fontFamily: 'Poppins_500Medium' }]}>{item?.outTime || 'N/A'}</Text>
                    </View>
                    <View style={[styles.metaPill, { marginRight: 0 }]}>
                      <Text style={[styles.metaKey, { fontFamily: 'Poppins_700Bold' }]}>Updated</Text>
                      <Text style={[styles.metaVal, { fontFamily: 'Poppins_500Medium' }]}>{formatDate(item?.updatedAt || item?.createdAt, id)}</Text>
                    </View>
                  </View>

                  {activeTab === TAB.PENDING && (
                    <View style={styles.btnRow}>
                      <ClayBtn label="✗ Reject" color="#EF4444" onPress={() => confirmReject(item)} disabled={isBusy} />
                      <ClayBtn label="✓ Approve" color="#3B82F6" onPress={() => confirmApprove(item)} disabled={isBusy} />
                    </View>
                  )}
                </View>
              );
            })
          )}

          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.85}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={[styles.logoutBtnText, { fontFamily: 'Poppins_800ExtraBold' }]}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EEF6FF' },

  // Header
  header: {
    backgroundColor: '#4B9EFF',
    paddingTop: Platform.OS === 'android' ? 42 : 54,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 14,
  },
  headerLeft: { flex: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerBrand: { color: 'rgba(255,255,255,0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 3 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  headerSub: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', marginTop: 4, maxWidth: 220 },
  pendingBadge: {
    minWidth: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.28)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#fff', shadowOpacity: 0.15, shadowRadius: 8,
  },
  pendingBadgeNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  pendingBadgeLbl: { fontSize: 10, fontWeight: '800', color: '#fff', opacity: 0.9 },

  // Content
  contentWrap: { flex: 1, padding: 12, paddingTop: 10 },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 10, gap: 8 },
  statCard: {
    flex: 1, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 10,
    borderWidth: 2.5,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.18, shadowRadius: 10, elevation: 6,
  },
  statLbl: { fontSize: 11, fontWeight: '800' },
  statNum: { fontSize: 24, fontWeight: '900', marginTop: 2 },

  // Toolbar
  toolbarCard: {
    backgroundColor: '#FFFFFF', borderRadius: 22, borderWidth: 3, borderColor: '#BFDBFE',
    padding: 12,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15, shadowRadius: 12, elevation: 7,
    marginBottom: 10,
  },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  tabBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 16,
    backgroundColor: '#F0F7FF', borderWidth: 2.5, borderColor: '#BFDBFE',
    alignItems: 'center',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 3,
  },
  tabBtnActive: { backgroundColor: '#3B82F6', borderColor: '#2563EB' },
  tabBtnText: { fontSize: 13, fontWeight: '800', color: '#64A4D8' },
  tabBtnTextActive: { color: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: '#F5F9FF', borderRadius: 16, borderWidth: 2.5,
    borderColor: '#BFDBFE', paddingHorizontal: 14, paddingVertical: 10,
    color: '#1E3A5F', fontSize: 14,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
    fontFamily: 'Poppins_500Medium',
  },
  refreshBtn: {
    width: 44, height: 44, borderRadius: 14, backgroundColor: '#3B82F6',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 7,
    borderWidth: 2, borderColor: '#60A5FA',
  },
  refreshBtnText: { color: '#fff', fontSize: 22, fontWeight: '900' },

  // List
  listArea: { flex: 1 },
  listContent: { paddingBottom: 16 },

  // Card
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 26, borderWidth: 3, borderColor: '#BFDBFE',
    padding: 14, marginBottom: 12,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.18, shadowRadius: 14, elevation: 9,
  },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  studentName: { color: '#1E3A5F', fontSize: 16, marginBottom: 2 },
  studentId: { color: '#64A4D8', fontSize: 12 },
  statusChip: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 2,
  },
  statusChipText: { fontSize: 11 },
  detailLabel: { fontSize: 11, color: '#3B82F6', marginBottom: 2 },
  detailValue: { fontSize: 14, color: '#1E3A5F', marginBottom: 8, lineHeight: 20 },

  // Sub-cards within a card
  subCard: {
    backgroundColor: '#F0F7FF', borderRadius: 18, borderWidth: 2.5, borderColor: '#BFDBFE',
    padding: 12, marginBottom: 8,
  },
  subCardTitle: { color: '#2563EB', fontSize: 14, marginBottom: 6 },
  infoText: { color: '#3B6FA0', fontSize: 13, lineHeight: 19, marginBottom: 3 },
  infoStrong: { color: '#1D4ED8', fontSize: 12, marginBottom: 4, fontWeight: '700' },
  proofLink: {
    backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 12, borderWidth: 2,
    borderColor: '#BFDBFE', paddingVertical: 10, paddingHorizontal: 12, marginTop: 8, marginBottom: 6,
  },
  proofLinkText: { color: '#2563EB', fontSize: 13 },

  // Badges
  approvedBadge: {
    backgroundColor: '#D1FAE5', borderRadius: 12, borderWidth: 2, borderColor: '#6EE7B7',
    paddingVertical: 7, paddingHorizontal: 12, marginBottom: 6, alignSelf: 'flex-start',
  },
  approvedBadgeText: { color: '#064E3B', fontSize: 12 },
  rejectedBadge: {
    backgroundColor: '#FEE2E2', borderRadius: 12, borderWidth: 2, borderColor: '#FCA5A5',
    paddingVertical: 7, paddingHorizontal: 12, marginBottom: 6, alignSelf: 'flex-start',
  },
  rejectedBadgeText: { color: '#7F1D1D', fontSize: 12 },

  // Meta pills
  metaRow: { flexDirection: 'row', marginBottom: 4, gap: 8 },
  metaPill: {
    flex: 1, backgroundColor: '#EEF6FF', borderRadius: 14, borderWidth: 2,
    borderColor: '#BFDBFE', paddingVertical: 8, paddingHorizontal: 10,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  metaKey: { color: '#60A5FA', fontSize: 11, marginBottom: 2 },
  metaVal: { color: '#1E3A5F', fontSize: 12 },

  // Clay Buttons
  btnRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10, justifyContent: 'flex-end' },
  clayBtn: {
    minWidth: 90, alignItems: 'center', justifyContent: 'center',
    borderRadius: 14, paddingVertical: 9, paddingHorizontal: 14,
    shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 6,
    borderWidth: 2,
  },
  clayBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  clayBtnDisabled: { opacity: 0.5 },

  // Empty
  emptyBox: {
    backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 3, borderColor: '#BFDBFE',
    padding: 28, alignItems: 'center', marginTop: 10,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.14, shadowRadius: 12, elevation: 6,
  },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyTitle: { color: '#2563EB', fontSize: 17, fontWeight: '900', fontFamily: 'Poppins_800ExtraBold' },
  emptyTxt: { color: '#64A4D8', fontSize: 13, marginTop: 4, textAlign: 'center', fontFamily: 'Poppins_500Medium' },

  // Logout
  logoutBtn: {
    backgroundColor: '#3B82F6', borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    minHeight: 52, marginTop: 6, borderWidth: 2.5, borderColor: '#60A5FA',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 10,
  },
  logoutBtnText: { color: '#FFFFFF', fontSize: 15 },
});
