import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Svg, { Circle, Ellipse, Rect, Path, G } from 'react-native-svg';
import { request } from '../config/api';
import { crossAlert, crossConfirm } from '../config/utils';

// ─── Utility ─────────────────────────────────────────────────────────────────
const parsePassIdFromQr = (rawData) => {
  const text = String(rawData || '').trim();
  if (!text) return '';
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      return String(parsed.passId || parsed.id || '').trim();
    } catch { return ''; }
  }
  if (text.includes('/')) {
    const cleaned = text.replace(/\/$/, '');
    return String(cleaned.split('/').pop() || '').trim();
  }
  return text;
};

const getDateFromObjectId = (id) => {
  const str = String(id || '');
  if (!/^[0-9a-fA-F]{24}$/.test(str)) return null;
  const ms = parseInt(str.slice(0, 8), 16) * 1000;
  return Number.isNaN(ms) ? null : new Date(ms);
};

const formatDate = (value, fallbackId) => {
  let d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) d = getDateFromObjectId(fallbackId);
  return d ? d.toLocaleString() : 'N/A';
};

const getResultMeta = (status) => {
  const s = String(status || '').toUpperCase();
  if (s === 'APPROVED') return { allowed: true,  label: 'Entry Allowed', text: '#064E3B', bg: '#D1FAE5', border: '#6EE7B7' };
  return               { allowed: false, label: 'Entry Denied',  text: '#7F1D1D', bg: '#FEE2E2', border: '#FCA5A5' };
};

const getNormalizedStatus  = (value) => String(value || '').toUpperCase();
const isAllowedScanStatus  = (value) => ['APPROVED', 'USED', 'EXITED', 'COMPLETED'].includes(getNormalizedStatus(value));
const isDeniedScanStatus   = (value) => ['REJECTED', 'DENIED', 'INVALID'].includes(getNormalizedStatus(value));

// ─── Clay Guard Character ─────────────────────────────────────────────────────
function GuardCharacter() {
  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Ellipse cx="40" cy="78" rx="18" ry="4" fill="rgba(27,188,163,0.2)" />
      {/* Body — teal uniform */}
      <Rect x="16" y="48" width="48" height="34" rx="16" fill="#1BBCA3" />
      {/* Uniform badge */}
      <Rect x="26" y="54" width="28" height="20" rx="8" fill="#0D9C83" />
      <Rect x="30" y="58" width="20" height="3" rx="2" fill="#fff" opacity="0.8" />
      <Rect x="33" y="63" width="14" height="2" rx="1" fill="#fff" opacity="0.5" />
      {/* Shield emblem */}
      <Path d="M40 56 L38 60 L40 62 L42 60Z" fill="#FFD700" opacity="0.9" />
      {/* Neck */}
      <Rect x="32" y="40" width="16" height="12" rx="6" fill="#FDDCB0" />
      {/* Head */}
      <Circle cx="40" cy="30" r="22" fill="#FDDCB0" />
      {/* Cap */}
      <Rect x="18" y="13" width="44" height="6" rx="3" fill="#0D9C83" />
      <Rect x="22" y="8"  width="36" height="12" rx="6" fill="#1BBCA3" />
      {/* Cap badge */}
      <Ellipse cx="40" cy="10" rx="5" ry="4" fill="#FFD700" opacity="0.9" />
      {/* Eyes */}
      <Circle cx="34" cy="28" r="3.5" fill="#fff" />
      <Circle cx="46" cy="28" r="3.5" fill="#fff" />
      <Circle cx="34.8" cy="28.8" r="2"   fill="#3D2314" />
      <Circle cx="46.8" cy="28.8" r="2"   fill="#3D2314" />
      <Circle cx="35.3" cy="28"   r="0.9" fill="#fff" />
      <Circle cx="47.3" cy="28"   r="0.9" fill="#fff" />
      {/* Mouth firm line */}
      <Path d="M34 39 Q40 43 46 39" stroke="#D97540" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Cheeks */}
      <Ellipse cx="27" cy="35" rx="4" ry="2.5" fill="#FFB3A0" opacity="0.65" />
      <Ellipse cx="53" cy="35" rx="4" ry="2.5" fill="#FFB3A0" opacity="0.65" />
    </Svg>
  );
}

// ─── Clay Background ──────────────────────────────────────────────────────────
function ClayBg() {
  return (
    <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
      <Ellipse cx="340" cy="80"  rx="120" ry="120" fill="#B8F0E8" opacity="0.55" />
      <Ellipse cx="20"  cy="380" rx="100" ry="100" fill="#C8F5EE" opacity="0.5"  />
      <Ellipse cx="370" cy="720" rx="110" ry="110" fill="#D0F5F0" opacity="0.4"  />
    </Svg>
  );
}

export default function GuardScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();

  const [cameraActive,  setCameraActive]  = useState(false);
  const [scanned,       setScanned]       = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [lastResult,    setLastResult]    = useState(null);
  const [todayScans,    setTodayScans]    = useState([]);
  const [histLoading,   setHistLoading]   = useState(false);

  const screenOpacity   = useRef(new Animated.Value(0)).current;
  const screenTranslate = useRef(new Animated.Value(16)).current;
  const pendingPulse    = useRef(new Animated.Value(1)).current;
  const resultScale     = useRef(new Animated.Value(0.88)).current;
  const resultOpacity   = useRef(new Animated.Value(0)).current;
  const pressScales     = useRef({}).current;

  const getPressScale = (key) => {
    if (!pressScales[key]) pressScales[key] = new Animated.Value(1);
    return pressScales[key];
  };

  const animPress = (anim, to) =>
    Animated.spring(anim, { toValue: to, friction: 7, tension: 130, useNativeDriver: true }).start();

  const showResultAnim = () => {
    resultScale.setValue(0.88);
    resultOpacity.setValue(0);
    Animated.parallel([
      Animated.spring(resultScale,   { toValue: 1,   friction: 6,               useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1,   duration: 220,             useNativeDriver: true }),
    ]).start();
  };

  const fetchTodayScans = useCallback(async () => {
    try {
      setHistLoading(true);
      const logs = await request('/guard/history', { method: 'GET' });
      setTodayScans(Array.isArray(logs) ? logs : []);
    } catch { setTodayScans([]); }
    finally { setHistLoading(false); }
  }, []);

  useEffect(() => {
    fetchTodayScans();
    Animated.parallel([
      Animated.timing(screenOpacity,   { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(screenTranslate, { toValue: 0, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(pendingPulse, { toValue: 1.06, duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pendingPulse, { toValue: 1,    duration: 850, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [fetchTodayScans, pendingPulse, screenOpacity, screenTranslate]);

  const handleStartScan = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) { 
        crossAlert('Permission Required', 'Camera permission is required to scan QR codes.'); 
        return; 
      }
    }
    setLastResult(null); setScanned(false); setCameraActive(true);
  };

  const handleStopScan = () => { setCameraActive(false); setScanned(false); };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || verifyLoading) return;
    setScanned(true); setVerifyLoading(true);
    try {
      const passId = parsePassIdFromQr(data);
      if (!passId) throw new Error('Invalid QR code. A valid Gate Pass ID was not found.');
      const passDetails = await request(`/${encodeURIComponent(passId)}/verify`, { method: 'GET' });
      const meta = getResultMeta(passDetails?.status);
      setLastResult({ passDetails, meta });
      showResultAnim(); setCameraActive(false);
      await fetchTodayScans();
    } catch (error) {
      setLastResult(null);
      crossConfirm('Verification Failed', error?.message || 'Unable to verify pass.',
        () => { setScanned(false); setCameraActive(true); }
      );
    } finally { setVerifyLoading(false); }
  };

  const todayAllowed = todayScans.filter((i) => isAllowedScanStatus(i?.status)).length;
  const todayDenied  = todayScans.filter((i) => isDeniedScanStatus(i?.status)).length;

  const renderScanItem = ({ item }) => {
    const isAllowed = isAllowedScanStatus(item?.status);
    return (
      <View style={styles.scanRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanName}>{item?.studentName || item?.studentId || 'Unknown'}</Text>
          <Text style={styles.scanMeta}>{item?.reason || 'N/A'}   {formatDate(item?.scannedAt || item?.createdAt, item?.id)}</Text>
        </View>
        <View style={[styles.scanChip, { backgroundColor: isAllowed ? '#D1FAE5' : '#FEE2E2', borderColor: isAllowed ? '#6EE7B7' : '#FCA5A5' }]}>
          <Text style={[styles.scanChipTxt, { color: isAllowed ? '#064E3B' : '#7F1D1D' }]}>
            {getNormalizedStatus(item?.status || 'N/A')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.screen}>
      <ClayBg />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerEyebrow}>Smart Campus</Text>
          <Text style={styles.headerTitle}>Guard Scanner</Text>
          <Text style={styles.headerSub}>Scan student QR codes to verify passes</Text>
        </View>
        <View style={styles.headerRight}>
          <GuardCharacter />
          <Animated.View style={[styles.scanCountBadge, { transform: [{ scale: pendingPulse }] }]}>
            <Text style={styles.scanCountNum}>{todayScans.length}</Text>
            <Text style={styles.scanCountLbl}>Today</Text>
          </Animated.View>
        </View>
      </View>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={histLoading} onRefresh={fetchTodayScans} tintColor="#1BBCA3" />}
        style={{ opacity: screenOpacity, transform: [{ translateY: screenTranslate }] }}
      >
        {/* ── Stats ── */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Scans', val: todayScans.length, bg: '#DBEAFE', border: '#93C5FD', tc: '#1E3A5F' },
            { label: 'Allowed',     val: todayAllowed,       bg: '#D1FAE5', border: '#6EE7B7', tc: '#064E3B' },
            { label: 'Denied',      val: todayDenied,        bg: '#FEE2E2', border: '#FCA5A5', tc: '#7F1D1D' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.statLbl, { color: s.tc }]}>{s.label}</Text>
              <Text style={[styles.statNum, { color: s.tc }]}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* ── Scan Button ── */}
        {!cameraActive && (
          <Animated.View style={{ transform: [{ scale: getPressScale('scan') }] }}>
            <Pressable
              style={styles.scanCta}
              onPressIn={() => animPress(getPressScale('scan'), 0.97)}
              onPressOut={() => animPress(getPressScale('scan'), 1)}
              onPress={handleStartScan}
            >
              <Text style={styles.scanCtaIcon}>📷</Text>
              <Text style={styles.scanCtaTitle}>Scan QR Code</Text>
              <Text style={styles.scanCtaSub}>The camera will open when you tap here</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* ── Camera ── */}
        {cameraActive && (
          <View style={styles.cameraCard}>
            <Text style={styles.cameraLabel}>
              {verifyLoading ? 'Verifying…' : 'Keep the QR code inside the frame'}
            </Text>
            <View style={styles.cameraBox}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              {/* Clay corner markers */}
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {verifyLoading && (
                <View style={styles.verifyOverlay}>
                  <Text style={styles.verifyOverlayTxt}>Verifying Pass…</Text>
                </View>
              )}
            </View>
            <Pressable style={styles.cancelScanBtn} onPress={handleStopScan}>
              <Text style={styles.cancelScanTxt}>✕ Cancel</Text>
            </Pressable>
          </View>
        )}

        {/* ── Result Card ── */}
        {lastResult && (
          <Animated.View
            style={[
              styles.resultCard,
              {
                borderColor: lastResult.meta.border,
                backgroundColor: lastResult.meta.bg,
                transform: [{ scale: resultScale }],
                opacity: resultOpacity,
              },
            ]}
          >
            <View style={styles.resultBanner}>
              <Text style={[styles.resultBannerTxt, { color: lastResult.meta.text }]}>
                {lastResult.meta.allowed ? '✅  Entry Allowed' : '🚫  Entry Denied'}
              </Text>
            </View>
            <View style={styles.resultBody}>
              <Text style={styles.resultName}>
                {lastResult.passDetails?.studentName || lastResult.passDetails?.studentId || 'Unknown Student'}
              </Text>
              <View style={styles.resultMetaRow}>
                {[
                  { k: 'Reason',   v: lastResult.passDetails?.reason  || 'N/A' },
                  { k: 'Out Time', v: lastResult.passDetails?.outTime  || 'N/A' },
                ].map((m) => (
                  <View key={m.k} style={styles.resultMetaPill}>
                    <Text style={styles.metaKey}>{m.k}</Text>
                    <Text style={styles.metaVal}>{m.v}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.resultActions}>
                <Animated.View style={{ transform: [{ scale: getPressScale('rescan') }] }}>
                  <Pressable
                    style={styles.rescanBtn}
                    onPressIn={() => animPress(getPressScale('rescan'), 0.96)}
                    onPressOut={() => animPress(getPressScale('rescan'), 1)}
                    onPress={handleStartScan}
                  >
                    <Text style={styles.rescanTxt}>📷 Scan Next</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        )}

        {/* ── Today's Scan Log ── */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeaderRow}>
            <Text style={styles.historyTitle}>Today's Scan Log</Text>
            <Animated.View style={{ transform: [{ scale: getPressScale('refresh') }] }}>
              <Pressable
                style={[styles.refreshBtn, histLoading && { opacity: 0.55 }]}
                disabled={histLoading}
                onPressIn={() => animPress(getPressScale('refresh'), 0.92)}
                onPressOut={() => animPress(getPressScale('refresh'), 1)}
                onPress={fetchTodayScans}
              >
                <Text style={styles.refreshBtnTxt}>↻</Text>
              </Pressable>
            </Animated.View>
          </View>
          <FlatList
            data={todayScans}
            keyExtractor={(item) => String(item?.id || Math.random())}
            renderItem={renderScanItem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={styles.emptyTxt}>
                {histLoading ? 'Loading scan history…' : 'No scan records found for today.'}
              </Text>
            }
          />
        </View>

        {/* ── Logout ── */}
        <Animated.View style={{ transform: [{ scale: getPressScale('logout') }] }}>
          <Pressable
            style={styles.logoutBtn}
            onPressIn={() => animPress(getPressScale('logout'), 0.97)}
            onPressOut={() => animPress(getPressScale('logout'), 1)}
            onPress={() => navigation.replace('Login')}
          >
            <Text style={styles.logoutTxt}>Logout</Text>
          </Pressable>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
}

const CORNER_SIZE  = 24;
const CORNER_THICK = 3.5;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#EDFCF8' },

  // Header
  header: {
    backgroundColor: '#1BBCA3',
    paddingTop: Platform.OS === 'android' ? 42 : 54,
    paddingBottom: 18,
    paddingHorizontal: 18,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#0D7A6A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.38,
    shadowRadius: 16,
    elevation: 14,
  },
  headerEyebrow: { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: 3 },
  headerTitle:   { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  headerSub:     { color: 'rgba(255,255,255,0.82)', fontSize: 12, fontWeight: '600', marginTop: 4, maxWidth: 200 },
  headerRight:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scanCountBadge: {
    minWidth: 64, height: 64, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.28)', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    justifyContent: 'center', alignItems: 'center',
  },
  scanCountNum: { fontSize: 22, fontWeight: '900', color: '#fff' },
  scanCountLbl: { fontSize: 10, fontWeight: '800', color: '#fff', opacity: 0.9 },

  // Scroll
  scrollContent: { padding: 14, paddingTop: 12, paddingBottom: 28 },

  // Stats
  statsRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  statCard: {
    flex: 1, borderRadius: 20, paddingVertical: 10, paddingHorizontal: 10, borderWidth: 2.5,
    shadowColor: '#1BBCA3', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.18, shadowRadius: 10, elevation: 5,
  },
  statLbl: { fontSize: 11, fontWeight: '800' },
  statNum: { fontSize: 24, fontWeight: '900', marginTop: 2 },

  // Scan Button
  scanCta: {
    backgroundColor: '#1BBCA3', borderRadius: 26, padding: 24,
    alignItems: 'center', marginBottom: 14,
    shadowColor: '#0D7A6A', shadowOpacity: 0.38, shadowRadius: 12,
    shadowOffset: { width: 0, height: 7 }, elevation: 10,
    borderWidth: 3, borderColor: '#4ED9C8',
  },
  scanCtaIcon:  { fontSize: 40, marginBottom: 6 },
  scanCtaTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '900' },
  scanCtaSub:   { color: 'rgba(255,255,255,0.82)', fontSize: 12, marginTop: 5, textAlign: 'center' },

  // Camera
  cameraCard: {
    backgroundColor: '#FFFFFF', borderRadius: 26, borderWidth: 3, borderColor: '#B8F0E8',
    padding: 14, marginBottom: 12, alignItems: 'center',
    shadowColor: '#1BBCA3', shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 7,
  },
  cameraLabel: { color: '#0D7A6A', fontWeight: '800', fontSize: 13, marginBottom: 12 },
  cameraBox: {
    width: 270, height: 270, borderRadius: 20, overflow: 'hidden',
    backgroundColor: '#000', position: 'relative',
  },
  corner: {
    position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: '#1BBCA3',
  },
  cornerTL: { top: 10, left: 10, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderTopLeftRadius: 7 },
  cornerTR: { top: 10, right: 10, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderTopRightRadius: 7 },
  cornerBL: { bottom: 10, left: 10, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderBottomLeftRadius: 7 },
  cornerBR: { bottom: 10, right: 10, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderBottomRightRadius: 7 },
  verifyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  verifyOverlayTxt: { color: '#FFFFFF', fontWeight: '900', fontSize: 16 },
  cancelScanBtn: {
    marginTop: 12, backgroundColor: '#EDFCF8', borderRadius: 14,
    paddingVertical: 10, paddingHorizontal: 28,
    borderWidth: 2.5, borderColor: '#B8F0E8',
    shadowColor: '#1BBCA3', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  cancelScanTxt: { color: '#0D7A6A', fontWeight: '800', fontSize: 14 },

  // Result
  resultCard: {
    borderRadius: 26, borderWidth: 3, overflow: 'hidden', marginBottom: 14,
    shadowColor: '#1BBCA3', shadowOpacity: 0.2, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 8,
  },
  resultBanner: { paddingVertical: 16, alignItems: 'center' },
  resultBannerTxt: { fontSize: 18, fontWeight: '900' },
  resultBody: { padding: 14, backgroundColor: '#FFFFFF' },
  resultName: { color: '#1A1A1A', fontSize: 17, fontWeight: '900', marginBottom: 10 },
  resultMetaRow: { flexDirection: 'row', marginBottom: 12, gap: 8 },
  resultMetaPill: {
    flex: 1, backgroundColor: '#EDFCF8', borderRadius: 14, borderWidth: 2,
    borderColor: '#B8F0E8', paddingVertical: 8, paddingHorizontal: 10,
  },
  metaKey: { color: '#0D7A6A', fontSize: 11, fontWeight: '800', marginBottom: 2 },
  metaVal: { color: '#1A1A1A', fontSize: 13, fontWeight: '700' },
  resultActions: { alignItems: 'flex-end' },
  rescanBtn: {
    backgroundColor: '#1BBCA3', borderRadius: 14,
    paddingVertical: 11, paddingHorizontal: 22,
    borderWidth: 2.5, borderColor: '#4ED9C8',
    shadowColor: '#0D7A6A', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 7,
  },
  rescanTxt: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },

  // History
  historyCard: {
    backgroundColor: '#FFFFFF', borderRadius: 26, borderWidth: 3, borderColor: '#B8F0E8',
    padding: 14, marginBottom: 12,
    shadowColor: '#1BBCA3', shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  historyHeaderRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10,
  },
  historyTitle: { color: '#0D7A6A', fontSize: 16, fontWeight: '900' },
  refreshBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: '#1BBCA3', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: '#4ED9C8',
    shadowColor: '#0D7A6A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  refreshBtnTxt: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  scanRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  scanName: { color: '#1A1A1A', fontSize: 14, fontWeight: '800' },
  scanMeta: { color: '#6B8F8A', fontSize: 11, marginTop: 2 },
  scanChip: {
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 2,
  },
  scanChipTxt: { fontWeight: '900', fontSize: 11 },
  separator: { height: 1.5, backgroundColor: '#D0F5F0' },
  emptyTxt: { color: '#6B8F8A', fontSize: 13, textAlign: 'center', paddingVertical: 12, fontWeight: '600' },

  // Logout
  logoutBtn: {
    backgroundColor: '#1BBCA3', borderRadius: 22, alignItems: 'center', justifyContent: 'center',
    minHeight: 52,
    borderWidth: 2.5, borderColor: '#4ED9C8',
    shadowColor: '#0D7A6A', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.38, shadowRadius: 12, elevation: 10,
  },
  logoutTxt: { color: '#FFFFFF', fontWeight: '900', fontSize: 16, letterSpacing: 0.2 },
});
