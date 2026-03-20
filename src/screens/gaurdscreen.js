import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Easing,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { request } from '../config/api';

const parsePassIdFromQr = (rawData) => {
  const text = String(rawData || '').trim();
  if (!text) return '';
  if (text.startsWith('{')) {
    try {
      const parsed = JSON.parse(text);
      return String(parsed.passId || parsed.id || '').trim();
    } catch {
      return '';
    }
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
  if (s === 'APPROVED') return { allowed: true,  label: 'Entry Allowed',  text: '#4ADE80', bg: 'rgba(74, 222, 128, 0.2)', border: 'rgba(74, 222, 128, 0.4)' };
  return                        { allowed: false, label: 'Entry Denied',   text: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)' };
};

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
      Animated.spring(resultScale,   { toValue: 1,   friction: 6, useNativeDriver: true }),
      Animated.timing(resultOpacity, { toValue: 1,   duration: 220, useNativeDriver: true }),
    ]).start();
  };

  const fetchTodayScans = useCallback(async () => {
    try {
      setHistLoading(true);
      const logs = await request('/guard/history', { method: 'GET' });
      setTodayScans(Array.isArray(logs) ? logs : []);
    } catch {
      setTodayScans([]);
    } finally {
      setHistLoading(false);
    }
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
        Alert.alert('Permission Required', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    setLastResult(null);
    setScanned(false);
    setCameraActive(true);
  };

  const handleStopScan = () => {
    setCameraActive(false);
    setScanned(false);
  };

  const handleBarCodeScanned = async ({ data }) => {
    if (scanned || verifyLoading) return;
    setScanned(true);
    setVerifyLoading(true);

    try {
      const passId = parsePassIdFromQr(data);
      if (!passId) throw new Error('Invalid QR code. A valid Gate Pass ID was not found.');

      const passDetails = await request(`/${encodeURIComponent(passId)}/verify`, { method: 'GET' });
      const meta        = getResultMeta(passDetails?.status);

      setLastResult({ passDetails, meta });
      showResultAnim();
      setCameraActive(false);
      await fetchTodayScans();
    } catch (error) {
      setLastResult(null);
      Alert.alert('Verification Failed', error?.message || 'Unable to verify pass.', [
        { text: 'Try Again', onPress: () => { setScanned(false); setCameraActive(true); } },
        { text: 'Cancel',    onPress: () => { setScanned(false); setCameraActive(false); } },
      ]);
    } finally {
      setVerifyLoading(false);
    }
  };

  const todayAllowed  = todayScans.filter((i) => String(i?.status || '').toUpperCase() === 'APPROVED').length;
  const todayDenied   = todayScans.filter((i) => String(i?.status || '').toUpperCase() !== 'APPROVED').length;

  const renderScanItem = ({ item }) => (
    <View style={styles.scanRow}>
      <View style={{ flex: 1 }}>
        <Text style={styles.scanName}>{item?.studentName || item?.studentId || 'Unknown'}</Text>
        <Text style={styles.scanMeta}>{item?.reason || 'N/A'}    {formatDate(item?.scannedAt || item?.createdAt, item?.id)}</Text>
      </View>
      <View style={[
        styles.scanChip,
        { backgroundColor: String(item?.status || '').toUpperCase() === 'APPROVED' ? '#DCFCE7' : '#FEE2E2' },
      ]}>
        <Text style={[
          styles.scanChipTxt,
          { color: String(item?.status || '').toUpperCase() === 'APPROVED' ? '#166534' : '#991B1B' },
        ]}>
          {String(item?.status || 'N/A').toUpperCase()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <LinearGradient 
        colors={['#FFF1DD', '#FFEBE3', '#FF9A58', '#FF7A3E']} 
        start={{ x: 0.2, y: 0 }} 
        end={{ x: 1, y: 1.2 }}
        style={styles.backgroundGradient}
      />
      <View style={styles.blobTopRight} />
      <View style={styles.blobBottomLeft} />

      <LinearGradient
        colors={['#FF9C5E', '#FF8C42', '#FF7A3E']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerEyebrow}>Smart Campus</Text>
          <Text style={styles.headerTitle}>Guard Scanner</Text>
          <Text style={styles.headerSub}>Scan student QR codes to verify gate passes</Text>
        </View>
        <Animated.View style={[styles.scanCountBadge, { transform: [{ scale: pendingPulse }] }]}>
          <Text style={styles.scanCountNum}>{todayScans.length}</Text>
          <Text style={styles.scanCountLbl}>Today</Text>
        </Animated.View>
      </LinearGradient>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={histLoading} onRefresh={fetchTodayScans} tintColor="#CF202E" />}
        style={{ opacity: screenOpacity, transform: [{ translateY: screenTranslate }] }}
      >
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statBlue]}>
            <Text style={styles.statLbl}>Total Scans</Text>
            <Text style={styles.statNum}>{todayScans.length}</Text>
          </View>
          <View style={[styles.statCard, styles.statGreen]}>
            <Text style={styles.statLbl}>Allowed</Text>
            <Text style={styles.statNum}>{todayAllowed}</Text>
          </View>
          <View style={[styles.statCard, styles.statRed]}>
            <Text style={styles.statLbl}>Denied</Text>
            <Text style={styles.statNum}>{todayDenied}</Text>
          </View>
        </View>

        {!cameraActive && (
          <Animated.View style={{ transform: [{ scale: getPressScale('scan') }] }}>
            <Pressable
              style={styles.scanCta}
              onPressIn={() => animPress(getPressScale('scan'), 0.97)}
              onPressOut={() => animPress(getPressScale('scan'), 1)}
              onPress={handleStartScan}
            >
              <Text style={styles.scanCtaIcon}></Text>
              <Text style={styles.scanCtaTitle}>Scan QR Code</Text>
              <Text style={styles.scanCtaSub}>The camera will open when you tap here</Text>
            </Pressable>
          </Animated.View>
        )}

        {cameraActive && (
          <View style={styles.cameraCard}>
            <Text style={styles.cameraLabel}>
              {verifyLoading ? 'Verifying...' : 'Keep the QR code inside the box'}
            </Text>
            <View style={styles.cameraBox}>
              <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
              />
              <View style={styles.scanCornerTL} />
              <View style={styles.scanCornerTR} />
              <View style={styles.scanCornerBL} />
              <View style={styles.scanCornerBR} />
              {verifyLoading && (
                <View style={styles.verifyOverlay}>
                  <Text style={styles.verifyOverlayTxt}>Verifying Pass...</Text>
                </View>
              )}
            </View>
            <Pressable
              style={styles.cancelScanBtn}
              onPress={handleStopScan}
            >
              <Text style={styles.cancelScanTxt}>Cancel</Text>
            </Pressable>
          </View>
        )}

        {lastResult && (
          <Animated.View
            style={[
              styles.resultCard,
              { borderColor: lastResult.meta.border, transform: [{ scale: resultScale }], opacity: resultOpacity },
            ]}
          >
            <View style={[styles.resultBanner, { backgroundColor: lastResult.meta.bg }]}>
              <Text style={[styles.resultBannerTxt, { color: lastResult.meta.text }]}>
                {lastResult.meta.allowed ? '  Entry Allowed' : '  Entry Denied'}
              </Text>
            </View>
            <View style={styles.resultBody}>
              <Text style={styles.resultName}>
                {lastResult.passDetails?.studentName || lastResult.passDetails?.studentId || 'Unknown Student'}
              </Text>
              <View style={styles.resultMetaRow}>
                <View style={styles.resultMetaPill}>
                  <Text style={styles.metaKey}>Reason</Text>
                  <Text style={styles.metaVal}>{lastResult.passDetails?.reason || 'N/A'}</Text>
                </View>
                <View style={styles.resultMetaPill}>
                  <Text style={styles.metaKey}>Out Time</Text>
                  <Text style={styles.metaVal}>{lastResult.passDetails?.outTime || 'N/A'}</Text>
                </View>
              </View>
              <View style={styles.resultActions}>
                <Animated.View style={{ transform: [{ scale: getPressScale('rescan') }] }}>
                  <Pressable
                    style={styles.rescanBtn}
                    onPressIn={() => animPress(getPressScale('rescan'), 0.96)}
                    onPressOut={() => animPress(getPressScale('rescan'), 1)}
                    onPress={handleStartScan}
                  >
                    <Text style={styles.rescanTxt}>Scan Next</Text>
                  </Pressable>
                </Animated.View>
              </View>
            </View>
          </Animated.View>
        )}

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
                <Text style={styles.refreshBtnTxt}>{histLoading ? '' : ''}</Text>
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
                {histLoading ? 'Loading scan history...' : 'No scan records found for today.'}
              </Text>
            }
          />
        </View>

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

const CORNER_SIZE = 22;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  blobTopRight: { position: 'absolute', top: -60, right: -50, width: 200, height: 200, borderRadius: 120, backgroundColor: 'rgba(255, 195, 132, 0.25)', zIndex: 1 },
  blobBottomLeft: { position: 'absolute', bottom: 100, left: -80, width: 220, height: 220, borderRadius: 130, backgroundColor: 'rgba(255, 154, 88, 0.2)', opacity: 0.7, zIndex: 1 },

  header: {
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 18,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.24, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 9, zIndex: 3,
  },
  headerEyebrow: { color: 'rgba(255, 255, 255, 0.7)', fontSize: 11, fontWeight: '700', letterSpacing: 0.4, marginBottom: 4 },
  headerTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '800' },
  headerSub: { color: 'rgba(255, 255, 255, 0.8)', fontSize: 12, fontWeight: '500', marginTop: 4, maxWidth: 240 },

  scanCountBadge: {
    minWidth: 70, height: 70, borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.28)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center', alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  scanCountNum: { fontSize: 24, fontWeight: '800', color: '#FFFFFF', lineHeight: 26 },
  scanCountLbl: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  scrollContent: { padding: 14, paddingTop: 12, paddingBottom: 28, zIndex: 2 },

  statsRow: { flexDirection: 'row', marginBottom: 12, justifyContent: 'space-between' },
  statCard: { flex: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 10, marginHorizontal: 3, borderWidth: 1.2 },
  statBlue:  { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: 'rgba(147, 197, 253, 0.3)' },
  statGreen: { backgroundColor: 'rgba(74, 222, 128, 0.18)', borderColor: 'rgba(132, 204, 22, 0.3)' },
  statRed:   { backgroundColor: 'rgba(248, 113, 113, 0.15)', borderColor: 'rgba(239, 68, 68, 0.25)' },
  statLbl: { color: '#999999', fontSize: 11, fontWeight: '700' },
  statNum: { color: '#1A1A1A', fontSize: 22, fontWeight: '800', marginTop: 2 },

  scanCta: {
    backgroundColor: 'rgba(255, 122, 62, 0.8)',
    borderRadius: 16, padding: 22,
    alignItems: 'center', marginBottom: 12,
    shadowColor: '#FF8C42', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 }, elevation: 7,
    borderWidth: 1.2, borderColor: 'rgba(255, 188, 120, 0.3)',
  },
  scanCtaIcon:  { fontSize: 36, color: '#FFFFFF', marginBottom: 6 },
  scanCtaTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800' },
  scanCtaSub:   { color: 'rgba(255, 255, 255, 0.85)', fontSize: 12, marginTop: 5, textAlign: 'center' },

  cameraCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.54)', borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: 14, marginBottom: 12,
    alignItems: 'center',
    shadowColor: 'rgba(255, 122, 62, 0.3)', shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
    backdropFilter: 'blur(12px)',
  },
  cameraLabel: { color: '#FF7A3E', fontWeight: '700', fontSize: 13, marginBottom: 12 },
  cameraBox: {
    width: 270, height: 270,
    borderRadius: 16, overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
  },

  scanCornerTL: { position: 'absolute', top: 10, left: 10, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: '#FF7A3E', borderTopLeftRadius: 6 },
  scanCornerTR: { position: 'absolute', top: 10, right: 10, width: CORNER_SIZE, height: CORNER_SIZE, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: '#FF7A3E', borderTopRightRadius: 6 },
  scanCornerBL: { position: 'absolute', bottom: 10, left: 10, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: '#FF7A3E', borderBottomLeftRadius: 6 },
  scanCornerBR: { position: 'absolute', bottom: 10, right: 10, width: CORNER_SIZE, height: CORNER_SIZE, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: '#FF7A3E', borderBottomLeftRadius: 6 },

  verifyOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center',
  },
  verifyOverlayTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },

  cancelScanBtn: {
    marginTop: 12, backgroundColor: 'rgba(255, 255, 255, 0.32)',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 28,
    borderWidth: 1.1, borderColor: 'rgba(255, 188, 120, 0.32)',
    backdropFilter: 'blur(8px)',
  },
  cancelScanTxt: { color: '#FF7A3E', fontWeight: '700', fontSize: 14 },

  resultCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.54)', borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)', overflow: 'hidden',
    marginBottom: 12,
    shadowColor: 'rgba(255, 122, 62, 0.3)', shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
    backdropFilter: 'blur(12px)',
  },
  resultBanner: { paddingVertical: 14, alignItems: 'center', backgroundColor: 'rgba(255, 195, 132, 0.2)' },
  resultBannerTxt: { fontSize: 18, fontWeight: '800' },
  resultBody: { padding: 14 },
  resultName: { color: '#1A1A1A', fontSize: 17, fontWeight: '800', marginBottom: 10 },
  resultMetaRow: { flexDirection: 'row', marginBottom: 12 },
  resultMetaPill: {
    flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.3)', borderWidth: 0.8, borderColor: 'rgba(255, 188, 120, 0.25)',
    borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, marginRight: 8,
    backdropFilter: 'blur(8px)',
  },
  metaKey: { color: '#999999', fontSize: 11, fontWeight: '700', marginBottom: 2 },
  metaVal: { color: '#1A1A1A', fontSize: 13, fontWeight: '600' },
  resultActions: { alignItems: 'flex-end' },
  rescanBtn: {
    backgroundColor: 'rgba(255, 122, 62, 0.8)', borderRadius: 10,
    paddingVertical: 10, paddingHorizontal: 22,
    borderWidth: 1.1, borderColor: 'rgba(255, 188, 120, 0.28)',
  },
  rescanTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },

  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.54)', borderRadius: 16,
    borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.6)',
    padding: 14, marginBottom: 12,
    shadowColor: 'rgba(255, 122, 62, 0.3)', shadowOpacity: 0.15, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
    backdropFilter: 'blur(12px)',
  },
  historyHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  historyTitle: { color: '#FF7A3E', fontSize: 16, fontWeight: '800' },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: 'rgba(255, 122, 62, 0.8)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.1, borderColor: 'rgba(255, 188, 120, 0.28)',
  },
  refreshBtnTxt: { color: '#FFFFFF', fontSize: 20, fontWeight: '700', lineHeight: 22 },

  scanRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 8,
  },
  scanName: { color: '#1A1A1A', fontSize: 14, fontWeight: '700' },
  scanMeta: { color: '#999999', fontSize: 11, marginTop: 2 },
  scanChip: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, borderWidth: 0.8, borderColor: 'rgba(255, 188, 120, 0.3)' },
  scanChipTxt: { fontWeight: '800', fontSize: 11 },
  separator: { height: 1, backgroundColor: 'rgba(255, 188, 120, 0.15)' },

  emptyTxt: { color: '#999999', fontSize: 13, textAlign: 'center', paddingVertical: 10 },

  logoutBtn: {
    backgroundColor: 'rgba(255, 122, 62, 0.85)', borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    minHeight: 50, borderWidth: 1.2, borderColor: 'rgba(255, 188, 120, 0.32)',
    shadowColor: '#FF7A3E', shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  logoutTxt: { color: '#FFFFFF', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
});


