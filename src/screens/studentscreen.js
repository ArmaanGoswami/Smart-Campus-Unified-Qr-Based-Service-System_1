import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Linking,
  Modal,
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
import { crossAlert } from '../config/utils';
import { getUsername } from '../config/auth';

const STUDENT_ID = getUsername() || 'STU123';
const PARENT_VERIFICATION_NUMBER = '9876543210';

const STATUS = {
  NONE: 'NONE', PENDING: 'PENDING', APPROVED: 'APPROVED',
  REJECTED: 'REJECTED', USED: 'USED', EXITED: 'EXITED', COMPLETED: 'COMPLETED',
};

const normalizeStatus = (value) => String(value || '').toUpperCase();
const getPassId      = (item)  => String(item?.id || item?._id || item?.passId || '').trim();

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

const formatDateLabel = (d) => {
  if (!d) return '';
  const dd   = String(d.getDate()).padStart(2, '0');
  const mm   = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const formatTimeLabel = (h, m, period) => {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm} ${period}`;
};

// ─── ClayClock ───────────────────────────────────────────────────────────────
function ClayClock({ visible, onClose, onConfirm, initialHour = 5, initialMinute = 30, initialPeriod = 'PM' }) {
  const [hour,   setHour]   = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);
  const [period, setPeriod] = useState(initialPeriod);

  const hours   = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const hourRef   = useRef(null);
  const minuteRef = useRef(null);

  useEffect(() => {
    if (visible) {
      setHour(initialHour); setMinute(initialMinute); setPeriod(initialPeriod);
      setTimeout(() => {
        hourRef.current?.scrollTo({ y: (initialHour - 1) * 52, animated: false });
        minuteRef.current?.scrollTo({ y: initialMinute * 52, animated: false });
      }, 100);
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={cs.overlay}>
        <View style={cs.clockBox}>
          {/* Clock face */}
          <View style={cs.clockFace}>
            <Svg width={130} height={130} viewBox="0 0 130 130">
              <Circle cx="65" cy="65" r="60" fill="#EEF6FF" stroke="#BFDBFE" strokeWidth="4" />
              <Circle cx="65" cy="65" r="50" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="2" />
              {Array.from({ length: 12 }, (_, i) => {
                const angle = (i * 30 - 90) * (Math.PI / 180);
                const r = 38;
                const x = 65 + r * Math.cos(angle);
                const y = 65 + r * Math.sin(angle);
                const num = i === 0 ? 12 : i;
                return (
                  <React.Fragment key={num}>
                    <Circle cx={x} cy={y} r={num === hour ? 11 : 8}
                      fill={num === hour ? '#3B82F6' : '#EEF6FF'}
                      stroke={num === hour ? '#2563EB' : '#BFDBFE'} strokeWidth="2" />
                    <Path
                      d={`M${x} ${y - 5}L${x} ${y + 5}`}
                      stroke="transparent"
                    />
                  </React.Fragment>
                );
              })}
              {/* Hour hand */}
              {(() => {
                const angle = ((hour % 12) * 30 + minute * 0.5 - 90) * (Math.PI / 180);
                return <Path d={`M65 65 L${65 + 28 * Math.cos(angle)} ${65 + 28 * Math.sin(angle)}`}
                  stroke="#2563EB" strokeWidth="4" strokeLinecap="round" />;
              })()}
              {/* Minute hand */}
              {(() => {
                const angle = (minute * 6 - 90) * (Math.PI / 180);
                return <Path d={`M65 65 L${65 + 38 * Math.cos(angle)} ${65 + 38 * Math.sin(angle)}`}
                  stroke="#60A5FA" strokeWidth="2.5" strokeLinecap="round" />;
              })()}
              <Circle cx="65" cy="65" r="4" fill="#2563EB" />
            </Svg>
          </View>

          <Text style={cs.timeDisplay}>{formatTimeLabel(hour, minute, period)}</Text>

          {/* Scroll wheels */}
          <View style={cs.wheelsRow}>
            {/* Hour */}
            <View style={cs.wheelWrap}>
              <Text style={cs.wheelLabel}>Hour</Text>
              <View style={cs.wheelBorder}>
                <ScrollView
                  ref={hourRef}
                  style={cs.wheel}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={52}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.y / 52);
                    setHour(hours[Math.max(0, Math.min(11, idx))]);
                  }}
                >
                  {hours.map((h) => (
                    <TouchableOpacity key={h} style={cs.wheelItem} onPress={() => {
                      setHour(h);
                      hourRef.current?.scrollTo({ y: (h - 1) * 52, animated: true });
                    }}>
                      <Text style={[cs.wheelItemText, h === hour && cs.wheelItemActive]}>
                        {String(h).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={cs.wheelHighlight} pointerEvents="none" />
              </View>
            </View>

            <Text style={cs.wheelSep}>:</Text>

            {/* Minute */}
            <View style={cs.wheelWrap}>
              <Text style={cs.wheelLabel}>Min</Text>
              <View style={cs.wheelBorder}>
                <ScrollView
                  ref={minuteRef}
                  style={cs.wheel}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={52}
                  decelerationRate="fast"
                  onMomentumScrollEnd={(e) => {
                    const idx = Math.round(e.nativeEvent.contentOffset.y / 52);
                    setMinute(Math.max(0, Math.min(59, idx)));
                  }}
                >
                  {minutes.map((m) => (
                    <TouchableOpacity key={m} style={cs.wheelItem} onPress={() => {
                      setMinute(m);
                      minuteRef.current?.scrollTo({ y: m * 52, animated: true });
                    }}>
                      <Text style={[cs.wheelItemText, m === minute && cs.wheelItemActive]}>
                        {String(m).padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <View style={cs.wheelHighlight} pointerEvents="none" />
              </View>
            </View>

            {/* AM/PM */}
            <View style={cs.wheelWrap}>
              <Text style={cs.wheelLabel}>Period</Text>
              <View style={cs.periodCol}>
                {['AM', 'PM'].map((p) => (
                  <TouchableOpacity key={p} style={[cs.periodBtn, period === p && cs.periodBtnActive]} onPress={() => setPeriod(p)}>
                    <Text style={[cs.periodBtnText, period === p && cs.periodBtnTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={cs.actionRow}>
            <TouchableOpacity style={cs.cancelBtn} onPress={onClose}>
              <Text style={cs.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={cs.confirmBtn} onPress={() => onConfirm(hour, minute, period)}>
              <Text style={cs.confirmBtnText}>Set Time ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── ClayCalendar ─────────────────────────────────────────────────────────────
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Su','Mo','Tu','We','Th','Fr','Sa'];

function ClayCalendar({ visible, onClose, onConfirm, initialDate, minDate }) {
  const today = new Date();
  const init  = initialDate || today;
  const [viewYear,  setViewYear]  = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());
  const [selected,  setSelected]  = useState(initialDate || null);

  useEffect(() => {
    if (visible) {
      const d = initialDate || today;
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
      setSelected(initialDate || null);
    }
  }, [visible]);

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells     = Array.from({ length: firstDay + daysInMon }, (_, i) => i < firstDay ? null : i - firstDay + 1);
  while (cells.length % 7 !== 0) cells.push(null);

  const isSelected = (d) => selected && selected.getFullYear() === viewYear && selected.getMonth() === viewMonth && selected.getDate() === d;
  const isToday    = (d) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === d;
  const isDisabled = (d) => {
    if (!minDate) return false;
    const cell = new Date(viewYear, viewMonth, d);
    return cell < new Date(minDate.getFullYear(), minDate.getMonth(), minDate.getDate());
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={cs.overlay}>
        <View style={cs.calBox}>
          {/* Nav */}
          <View style={cs.calNav}>
            <TouchableOpacity style={cs.calNavBtn} onPress={prevMonth}>
              <Text style={cs.calNavArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={cs.calMonthTitle}>{MONTH_NAMES[viewMonth]} {viewYear}</Text>
            <TouchableOpacity style={cs.calNavBtn} onPress={nextMonth}>
              <Text style={cs.calNavArrow}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={cs.calDayRow}>
            {DAY_NAMES.map((d) => <Text key={d} style={cs.calDayHeader}>{d}</Text>)}
          </View>

          {/* Grid */}
          <View style={cs.calGrid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e-${idx}`} style={cs.calCell} />;
              const sel = isSelected(day);
              const tod = isToday(day);
              const dis = isDisabled(day);
              return (
                <TouchableOpacity
                  key={`d-${day}`}
                  style={[cs.calCell, sel && cs.calCellSelected, tod && !sel && cs.calCellToday, dis && cs.calCellDisabled]}
                  onPress={() => !dis && setSelected(new Date(viewYear, viewMonth, day))}
                  disabled={dis}
                >
                  <Text style={[cs.calCellText, sel && cs.calCellTextSelected, dis && cs.calCellTextDisabled]}>{day}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selected && (
            <Text style={cs.calSelectedLabel}>Selected: {formatDateLabel(selected)}</Text>
          )}

          {/* Actions */}
          <View style={cs.actionRow}>
            <TouchableOpacity style={cs.cancelBtn} onPress={onClose}>
              <Text style={cs.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[cs.confirmBtn, !selected && { opacity: 0.5 }]}
              onPress={() => selected && onConfirm(selected)}
              disabled={!selected}
            >
              <Text style={cs.confirmBtnText}>Set Date ✓</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStatusMeta = (status) => {
  const state = normalizeStatus(status);
  if (state === STATUS.APPROVED)
    return { label: 'Approved', icon: 'checkmark-circle', color: '#064E3B', bg: '#D1FAE5', border: '#6EE7B7' };
  if (state === STATUS.REJECTED)
    return { label: 'Rejected', icon: 'close-circle', color: '#7F1D1D', bg: '#FEE2E2', border: '#FCA5A5' };
  if ([STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(state))
    return {
      label: state === STATUS.EXITED ? 'Exited' : state === STATUS.COMPLETED ? 'Completed' : 'Used',
      icon: 'time', color: '#1E3A5F', bg: '#DBEAFE', border: '#93C5FD',
    };
  if (state === STATUS.PENDING)
    return { label: 'Pending', icon: 'hourglass', color: '#92400E', bg: '#FEF3C7', border: '#FCD34D' };
  return { label: 'Unknown', icon: 'help-circle', color: '#6B7280', bg: '#F3F4F6', border: '#D1D5DB' };
};

// ─── Clay Student Character ──────────────────────────────────────────────────
function StudentHero() {
  return (
    <Svg width={90} height={90} viewBox="0 0 90 90">
      <Ellipse cx="45" cy="86" rx="20" ry="5" fill="rgba(75,158,255,0.15)" />
      {/* Backpack */}
      <Rect x="28" y="52" width="34" height="34" rx="14" fill="#4B9EFF" />
      <Rect x="32" y="56" width="26" height="26" rx="10" fill="#6BB3FF" />
      {/* Pocket */}
      <Rect x="36" y="66" width="18" height="12" rx="6" fill="#3B82F6" />
      {/* Neck */}
      <Rect x="36" y="44" width="18" height="14" rx="7" fill="#FDDCB0" />
      {/* Head */}
      <Circle cx="45" cy="32" r="22" fill="#FDDCB0" />
      {/* Hair */}
      <Path d="M23 28 Q26 10 45 9 Q64 10 67 28 Q58 18 45 18 Q32 18 23 28Z" fill="#5C3A1E" />
      {/* Eyes */}
      <Circle cx="38" cy="29" r="3.5" fill="#fff" />
      <Circle cx="52" cy="29" r="3.5" fill="#fff" />
      <Circle cx="38.8" cy="29.8" r="2" fill="#3D2314" />
      <Circle cx="52.8" cy="29.8" r="2" fill="#3D2314" />
      <Circle cx="39.2" cy="29" r="0.9"  fill="#fff" />
      <Circle cx="53.2" cy="29" r="0.9"  fill="#fff" />
      {/* Star */}
      <Path d="M45 12 L46 15 L49 15 L47 17 L48 20 L45 18 L42 20 L43 17 L41 15 L44 15Z" fill="#FFD700" opacity="0.9" />
      {/* Smile */}
      <Path d="M38 40 Q45 46 52 40" stroke="#5B8FD9" strokeWidth="2.2" strokeLinecap="round" fill="none" />
      {/* Blush */}
      <Ellipse cx="31" cy="36" rx="4" ry="2.5" fill="#BFD9FF" opacity="0.8" />
      <Ellipse cx="59" cy="36" rx="4" ry="2.5" fill="#BFD9FF" opacity="0.8" />
    </Svg>
  );
}

// ─── Clay Background ─────────────────────────────────────────────────────────
function ClayBg() {
  return (
    <Svg style={StyleSheet.absoluteFillObject} viewBox="0 0 400 860" preserveAspectRatio="xMidYMid slice">
      <Ellipse cx="350" cy="100" rx="130" ry="130" fill="#C7E0FF" opacity="0.5"  />
      <Ellipse cx="20"  cy="400" rx="110" ry="110" fill="#D6EAFF" opacity="0.4"  />
      <Ellipse cx="380" cy="750" rx="120" ry="120" fill="#BDD9FF" opacity="0.38" />
    </Svg>
  );
}

// ─── Module-level clay components (MUST be outside StudentScreen to avoid remount on every render) ──
function ClayInput({ style, ...props }) {
  return <TextInput style={[styles.input, style]} placeholderTextColor="#C4907A" {...props} />;
}

function ClayBtn({ label, onPress, disabled, color, textColor, style }) {
  const bg = color || '#FF6B2C';
  const tc = textColor || '#fff';
  return (
    <TouchableOpacity
      style={[styles.clayPrimaryBtn, { backgroundColor: bg }, disabled && { opacity: 0.55 }, style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.86}
    >
      <Text style={[styles.clayPrimaryBtnText, { color: tc }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function StudentScreen({ navigation }) {
  const [reason,            setReason]            = useState('');
  const [parentConsentNote, setParentConsentNote]  = useState('');

  // Clock picker state
  const [clockHour,   setClockHour]   = useState(5);
  const [clockMinute, setClockMinute] = useState(30);
  const [clockPeriod, setClockPeriod] = useState('PM');
  const [clockVisible, setClockVisible] = useState(false);
  const outTimeLabel = formatTimeLabel(clockHour, clockMinute, clockPeriod);

  // Calendar picker state
  const [fromDateObj,   setFromDateObj]   = useState(null);
  const [toDateObj,     setToDateObj]     = useState(null);
  const [calTarget,     setCalTarget]     = useState(null); // 'from' | 'to'
  const [calVisible,    setCalVisible]    = useState(false);

  const [latestPass,  setLatestPass]  = useState(null);
  const [passStatus,  setPassStatus]  = useState(STATUS.NONE);

  const [isSubmitting,  setIsSubmitting]  = useState(false);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [historyLoading,setHistoryLoading]= useState(false);
  const [history,       setHistory]       = useState([]);

  const updateFromPass = (pass) => {
    if (!pass) { setLatestPass(null); setPassStatus(STATUS.NONE); return; }
    setLatestPass(pass);
    setPassStatus(normalizeStatus(pass?.status) || STATUS.PENDING);
  };

  const refreshHistory = async () => {
    try {
      setHistoryLoading(true);
      const passes  = await request(`/student/${STUDENT_ID}/history`, { method: 'GET' });
      const records = Array.isArray(passes) ? passes : [];
      setHistory(
        records.filter((item) =>
          [STATUS.APPROVED, STATUS.REJECTED, STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(
            normalizeStatus(item?.status)
          )
        )
      );
    } catch { setHistory([]); }
    finally { setHistoryLoading(false); }
  };

  const refreshStatus = async ({ silent = false } = {}) => {
    try {
      if (!silent) setIsRefreshing(true);
      const currentPass = await request(`/student/${STUDENT_ID}`, { method: 'GET' });
      updateFromPass(currentPass);
      if (!silent) crossAlert('Updated', `Status: ${normalizeStatus(currentPass?.status) || STATUS.PENDING}`);
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('No gate pass found for student')) {
        setLatestPass(null); setPassStatus(STATUS.NONE);
        if (!silent) crossAlert('Info', 'No active gate pass found yet.');
      } else if (!silent) {
        crossAlert('API Error', error?.message || 'Unable to refresh status.');
      }
    } finally { if (!silent) setIsRefreshing(false); }
  };

  const handleApply = async () => {
    if (!reason.trim()) {
      crossAlert('Validation', 'Reason is required.'); return;
    }
    if (!parentConsentNote.trim()) {
      crossAlert('Parent Approval Mandatory', 'Parent consent details are mandatory.'); return;
    }
    if (!fromDateObj || !toDateObj) {
      crossAlert('Date Range Required', 'Please select both from date and to date.'); return;
    }
    if (fromDateObj > toDateObj) {
      crossAlert('Invalid Date Range', 'From Date cannot be after To Date.'); return;
    }
    const outTime = outTimeLabel;
    const fromDate = formatDateLabel(fromDateObj);
    const toDate   = formatDateLabel(toDateObj);
    try {
      setIsSubmitting(true);
      const payload = {
        studentId: STUDENT_ID, studentName: 'Student',
        reason: reason.trim(), outTime,
        fromDate, toDate,
        parentConsentNote: parentConsentNote.trim(),
      };
      const createdPass = await request('', { method: 'POST', body: JSON.stringify(payload) });
      updateFromPass(createdPass);
      await refreshHistory();
      setReason(''); setFromDateObj(null); setToDateObj(null); setParentConsentNote('');
      setClockHour(5); setClockMinute(30); setClockPeriod('PM');
      crossAlert('Success 🎉', 'Gate pass request has been submitted.');
    } catch (error) {
      crossAlert('API Error', error?.message || 'Unable to submit request.');
    } finally { setIsSubmitting(false); }
  };

  const handleUploadMentorProof = async () => {
    const resolvedPassId = getPassId(latestPass);
    if (!resolvedPassId) { crossAlert('No Active Request', 'An active request is required first.'); return; }
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) { crossAlert('Permission Required', 'Gallery access permission is required.'); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7, base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!asset?.base64) { crossAlert('Upload Failed', 'Unable to read image data.'); return; }
      const mime    = asset.mimeType || 'image/jpeg';
      const dataUrl = `data:${mime};base64,${asset.base64}`;
      const updated = await request(`/${resolvedPassId}/mentor-upload`, {
        method: 'PUT', body: JSON.stringify({ mentorProofImage: dataUrl }),
      });
      updateFromPass(updated);
      await refreshHistory();
      crossAlert('Uploaded', 'Mentor proof uploaded successfully.');
    } catch (error) {
      crossAlert('Upload Failed', error?.message || 'Unable to upload mentor proof.');
    }
  };

  const handleBottomNav = (target) => {
    if (target === 'PASSES') return;
    if (target === 'PROFILE') navigation?.navigate?.('Profile');
  };

  const handleOpenNotifications = () => crossAlert('Notifications', 'No new notifications right now.');
  const handleOpenProfile       = () => navigation?.navigate?.('Profile');

  useEffect(() => { refreshStatus({ silent: true }); refreshHistory(); }, []);

  useEffect(() => {
    if (passStatus !== STATUS.PENDING) return undefined;
    const timer = setInterval(() => refreshStatus({ silent: true }), 8000);
    return () => clearInterval(timer);
  }, [passStatus]);

  const statusMeta = useMemo(() => getStatusMeta(passStatus), [passStatus]);
  const [fontsLoaded, fontError] = useFonts({
    Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold,
    Poppins_700Bold, Poppins_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) return <View style={styles.screen} />;

  const currentPassId = getPassId(latestPass);

  return (
    <View style={styles.screen}>
      <ClayBg />

      {/* ── Clay Clock Modal ── */}
      <ClayClock
        visible={clockVisible}
        onClose={() => setClockVisible(false)}
        onConfirm={(h, m, p) => { setClockHour(h); setClockMinute(m); setClockPeriod(p); setClockVisible(false); }}
        initialHour={clockHour}
        initialMinute={clockMinute}
        initialPeriod={clockPeriod}
      />

      {/* ── Clay Calendar Modal ── */}
      <ClayCalendar
        visible={calVisible}
        onClose={() => setCalVisible(false)}
        onConfirm={(date) => {
          if (calTarget === 'from') setFromDateObj(date);
          else setToDateObj(date);
          setCalVisible(false);
        }}
        initialDate={calTarget === 'from' ? fromDateObj : toDateObj}
        minDate={calTarget === 'to' && fromDateObj ? fromDateObj : null}
      />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={styles.logoMark}>
            <Text style={styles.logoMarkText}>SC</Text>
          </View>
          <View>
            <Text style={[styles.brandName, { fontFamily: 'Poppins_800ExtraBold' }]}>Smart Campus</Text>
            <Text style={[styles.welcomeText, { fontFamily: 'Poppins_500Medium' }]}>Student Portal</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <StudentHero />
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={handleOpenNotifications}>
              <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={handleOpenProfile}>
              <Ionicons name="person-circle-outline" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => { refreshStatus(); refreshHistory(); }}
            tintColor="#FF7A3E"
          />
        }
      >
        {/* ── Stats Bar ── */}
        <View style={styles.statsBar}>
          {[
            { label: 'Status',  val: passStatus === STATUS.NONE ? '—' : passStatus, bg: '#FEF3C7', border: '#FCD34D', tc: '#92400E' },
            { label: 'Active',  val: passStatus === STATUS.APPROVED ? '✓' : '—',    bg: '#D1FAE5', border: '#6EE7B7', tc: '#064E3B' },
            { label: 'Pending', val: passStatus === STATUS.PENDING  ? '⏳' : '—',   bg: '#FFE8D0', border: '#FFB880', tc: '#7C3D0C' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, { backgroundColor: s.bg, borderColor: s.border }]}>
              <Text style={[styles.statLabel, { color: s.tc, fontFamily: 'Poppins_600SemiBold' }]}>{s.label}</Text>
              <Text style={[styles.statValue, { color: s.tc, fontFamily: 'Poppins_800ExtraBold' }]}>{s.val}</Text>
            </View>
          ))}
        </View>

        {/* ── Apply Pass Card ── */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>🎟️ Apply Gate Pass</Text>
          <Text style={[styles.cardDescription, { fontFamily: 'Poppins_400Regular' }]}>
            Fill all required details to request a pass.
          </Text>

          <ClayInput
            style={[styles.input, { fontFamily: 'Poppins_500Medium' }]}
            placeholder="Purpose / Reason"
            value={reason}
            onChangeText={setReason}
          />

          {/* Clay Clock Trigger */}
          <TouchableOpacity
            style={styles.pickerTrigger}
            onPress={() => setClockVisible(true)}
            activeOpacity={0.82}
          >
            <Ionicons name="time-outline" size={18} color="#FF6B2C" />
            <Text style={[styles.pickerTriggerText, { fontFamily: 'Poppins_500Medium' }]}>
              {outTimeLabel || 'Select Exit Time'}
            </Text>
            <Ionicons name="chevron-down" size={14} color="#C4907A" />
          </TouchableOpacity>

          {/* Date Range */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionLabel, { fontFamily: 'Poppins_700Bold' }]}>📅 Pass Duration</Text>
            <View style={styles.dateRow}>
              {[
                { label: 'From Date', key: 'from', val: fromDateObj },
                { label: 'To Date',   key: 'to',   val: toDateObj   },
              ].map((d) => (
                <View key={d.label} style={styles.dateCol}>
                  <Text style={[styles.dateLabel, { fontFamily: 'Poppins_600SemiBold' }]}>{d.label}</Text>
                  <TouchableOpacity
                    style={styles.dateTrigger}
                    onPress={() => { setCalTarget(d.key); setCalVisible(true); }}
                    activeOpacity={0.82}
                  >
                    <Ionicons name="calendar-outline" size={14} color="#FF6B2C" />
                    <Text style={[styles.dateTriggerText, { fontFamily: 'Poppins_500Medium' }]}>
                      {d.val ? formatDateLabel(d.val) : 'DD/MM/YYYY'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>

          {/* Parent Consent */}
          <View style={styles.subSection}>
            <Text style={[styles.subSectionLabel, { fontFamily: 'Poppins_700Bold' }]}>👨‍👩‍👧 Parent Consent</Text>
            <ClayInput
              style={[styles.input, styles.multiInput, { fontFamily: 'Poppins_500Medium' }]}
              placeholder="Parent consent details (required)"
              value={parentConsentNote}
              onChangeText={setParentConsentNote}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Mentor Section */}
          {!!latestPass?.mentorRequired && passStatus === STATUS.PENDING && (
            <View style={styles.subCard}>
              <Text style={[styles.subSectionLabel, { fontFamily: 'Poppins_700Bold' }]}>📄 Mentor Application</Text>
              <Text style={[styles.sectionInfo, { fontFamily: 'Poppins_500Medium' }]}>Required: Yes</Text>
              {latestPass?.mentorStatus === 'APPLICABLE' && (
                <View style={styles.approvedBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#064E3B" />
                  <Text style={[styles.approvedBadgeText, { fontFamily: 'Poppins_700Bold' }]}>Mentor Proof APPROVED</Text>
                </View>
              )}
              {latestPass?.mentorStatus === 'NOT_APPLICABLE' && (
                <View style={styles.rejectedBadge}>
                  <Ionicons name="close-circle" size={14} color="#991B1B" />
                  <Text style={[styles.rejectedBadgeText, { fontFamily: 'Poppins_700Bold' }]}>Mentor Proof REJECTED</Text>
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
                <TouchableOpacity style={styles.proofLink} onPress={() => Linking.openURL(latestPass.mentorProofImage)}>
                  <Ionicons name="document-text-outline" size={14} color="#D94E0E" />
                  <Text style={[styles.proofLinkText, { fontFamily: 'Poppins_600SemiBold' }]}>View Current Upload</Text>
                </TouchableOpacity>
              )}
              {latestPass?.mentorStatus !== 'APPLICABLE' && (
                <ClayBtn
                  label={latestPass?.mentorStatus === 'NOT_APPLICABLE' ? '📷 Upload New Photo' : '📷 Upload Mentor Proof'}
                  onPress={handleUploadMentorProof}
                  color="#FF8C42"
                  style={{ marginTop: 6 }}
                />
              )}
            </View>
          )}

          <ClayBtn
            label={isSubmitting ? 'Submitting…' : '🎫 Apply for Gate Pass'}
            onPress={handleApply}
            disabled={isSubmitting}
            style={{ marginTop: 8 }}
          />
        </View>

        {/* ── Active Pass Status ── */}
        <View style={styles.card}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>🔖 Active Pass Status</Text>
            <TouchableOpacity
              style={[styles.refreshBtn, isRefreshing && { opacity: 0.6 }]}
              onPress={() => { refreshStatus(); refreshHistory(); }}
              disabled={isRefreshing}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={13} color="#D94E0E" />
              <Text style={[styles.refreshBtnText, { fontFamily: 'Poppins_600SemiBold' }]}>
                {isRefreshing ? 'Refreshing…' : 'Refresh'}
              </Text>
            </TouchableOpacity>
          </View>

          {passStatus === STATUS.NONE && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={[styles.emptyStateText, { fontFamily: 'Poppins_600SemiBold' }]}>No Active Pass</Text>
              <Text style={[styles.emptyStateHint, { fontFamily: 'Poppins_400Regular' }]}>Submit a request above to get started.</Text>
            </View>
          )}

          {passStatus === STATUS.PENDING && (
            <View style={styles.statusSection}>
              <View style={[styles.statusChip, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D' }]}>
                <Ionicons name="hourglass-outline" size={15} color="#92400E" />
                <Text style={[styles.statusChipText, { color: '#92400E', fontFamily: 'Poppins_700Bold' }]}>Pending Approval</Text>
              </View>
              <Text style={[styles.statusHint, { fontFamily: 'Poppins_500Medium' }]}>
                Your request is under warden review.
              </Text>
            </View>
          )}

          {passStatus === STATUS.APPROVED && (
            <View style={styles.approvedSection}>
              <Text style={[styles.approvedTitle, { fontFamily: 'Poppins_700Bold' }]}>✓ Pass Approved!</Text>
              <View style={styles.qrContainer}>
                <QRCode value={currentPassId || 'N/A'} size={160} />
              </View>
              <View style={styles.passDetailsGrid}>
                {[
                  { label: 'Pass ID',    val: currentPassId || 'N/A' },
                  { label: 'Exit Time',  val: latestPass?.outTime || 'N/A' },
                  { label: 'Entry Time', val: latestPass?.inTime  || 'N/A' },
                ].map((d) => (
                  <View key={d.label} style={styles.passDetail}>
                    <Text style={[styles.passDetailLabel, { fontFamily: 'Poppins_500Medium' }]}>{d.label}</Text>
                    <Text style={[styles.passDetailValue, { fontFamily: 'Poppins_700Bold' }]}>{d.val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {[STATUS.REJECTED, STATUS.USED, STATUS.EXITED, STATUS.COMPLETED].includes(passStatus) && (
            <View style={styles.statusSection}>
              <View style={[styles.statusChip, { backgroundColor: statusMeta.bg, borderColor: statusMeta.border }]}>
                <Ionicons
                  name={passStatus === STATUS.REJECTED ? 'close-circle-outline' : 'checkmark-done-outline'}
                  size={15}
                  color={statusMeta.color}
                />
                <Text style={[styles.statusChipText, { color: statusMeta.color, fontFamily: 'Poppins_700Bold' }]}>
                  {passStatus}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Pass History ── */}
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { fontFamily: 'Poppins_800ExtraBold' }]}>📋 Pass History</Text>

          {historyLoading ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyStateText, { fontFamily: 'Poppins_500Medium' }]}>Loading history…</Text>
            </View>
          ) : history.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>📂</Text>
              <Text style={[styles.emptyStateText, { fontFamily: 'Poppins_500Medium' }]}>No History</Text>
            </View>
          ) : (
            <>
              <View style={styles.historyHeader}>
                {['Date', 'Type', 'Reason', 'Status'].map((h) => (
                  <Text key={h} style={[styles.historyHeaderText, h === 'Date' && styles.historyDateCol, h === 'Type' && styles.historyTypeCol, h === 'Reason' && styles.historyReasonCol, h === 'Status' && styles.historyStatusCol, { fontFamily: 'Poppins_600SemiBold' }]}>
                    {h}
                  </Text>
                ))}
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
                      <View style={[styles.historyStatusBadge, { backgroundColor: meta.bg, borderColor: meta.border }]}>
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

        {/* Logout */}
        <ClayBtn
          label="Logout"
          onPress={() => navigation.replace('Login')}
          color="rgba(255,107,44,0.18)"
          textColor="#B85221"
          style={styles.logoutBtn}
        />
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <View style={styles.bottomNav}>
        {[
          { key: 'PASSES',  icon: 'card-outline',   label: 'PASSES'  },
          { key: 'PROFILE', icon: 'person-outline',  label: 'PROFILE' },
        ].map((item) => {
          const active = item.key === 'PASSES';
          return (
            <Pressable key={item.key} onPress={() => handleBottomNav(item.key)} style={styles.navItem}>
              <Ionicons name={item.icon} size={20} color={active ? '#FF6B2C' : '#B87D5B'} />
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
  screen: { flex: 1, backgroundColor: '#EEF6FF' },

  // Header
  header: {
    backgroundColor: '#3B82F6',
    paddingTop: Platform.OS === 'android' ? 40 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#1D4ED8',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 14,
  },
  brandWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoMark: {
    width: 42, height: 42, borderRadius: 14,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.6)',
  },
  logoMarkText: { color: '#3B82F6', fontFamily: 'Poppins_800ExtraBold', fontSize: 14 },
  brandName: { color: '#FFFFFF', fontSize: 15 },
  welcomeText: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 1 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  headerActions: { gap: 8 },
  iconButton: {
    width: 38, height: 38, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },

  // Scroll
  scrollContent: { padding: 14, paddingBottom: 110 },

  // Stats
  statsBar: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  statCard: {
    flex: 1, borderRadius: 20, padding: 12, borderWidth: 2.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
  },
  statLabel: { fontSize: 11, marginBottom: 3 },
  statValue: { fontSize: 16 },

  // Clay Cards
  card: {
    backgroundColor: '#FFFFFF', borderRadius: 26, borderWidth: 3, borderColor: '#BFDBFE',
    padding: 16, marginBottom: 14,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.18, shadowRadius: 14, elevation: 8,
  },
  cardTitle: { color: '#1E3A5F', fontSize: 16, marginBottom: 3 },
  cardDescription: { color: '#64A4D8', fontSize: 12, marginBottom: 12 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },

  // Input
  input: {
    backgroundColor: '#F5F9FF', borderRadius: 16, borderWidth: 2.5, borderColor: '#BFDBFE',
    paddingHorizontal: 14, paddingVertical: 12, color: '#1E3A5F', fontSize: 13, marginBottom: 10,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  multiInput: { minHeight: 90, textAlignVertical: 'top' },

  // Picker triggers
  pickerTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#F5F9FF', borderRadius: 16, borderWidth: 2.5, borderColor: '#BFDBFE',
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 2,
  },
  pickerTriggerText: { flex: 1, color: '#1E3A5F', fontSize: 13 },
  dateTrigger: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#F5F9FF', borderRadius: 14, borderWidth: 2.5, borderColor: '#BFDBFE',
    paddingHorizontal: 12, paddingVertical: 10,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2,
  },
  dateTriggerText: { color: '#1E3A5F', fontSize: 12, flex: 1 },

  // Sub sections inside card
  subSection: { marginBottom: 14, paddingBottom: 12, borderBottomWidth: 2, borderBottomColor: '#DBEAFE' },
  subSectionLabel: { color: '#1E3A5F', fontSize: 13, marginBottom: 10 },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateCol: { flex: 1 },
  dateLabel: { color: '#3B7DC4', fontSize: 11, marginBottom: 6 },
  sectionInfo: { color: '#64A4D8', fontSize: 12 },
  infoBox: {
    backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 14, borderLeftWidth: 3,
    borderLeftColor: '#3B82F6', paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 10, flexDirection: 'row', alignItems: 'center',
  },
  infoBoxText: { color: '#1E40AF', fontSize: 12, marginLeft: 8, flex: 1 },

  // subCard (mentor)
  subCard: {
    backgroundColor: '#F0F7FF', borderRadius: 18, borderWidth: 2.5, borderColor: '#BFDBFE',
    padding: 12, marginBottom: 12,
  },

  // Approved / Rejected badges
  approvedBadge: {
    backgroundColor: '#D1FAE5', borderRadius: 12, borderWidth: 2, borderColor: '#6EE7B7',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8, alignSelf: 'flex-start',
  },
  approvedBadgeText: { color: '#064E3B', fontSize: 12 },
  rejectedBadge: {
    backgroundColor: '#FEE2E2', borderRadius: 12, borderWidth: 2, borderColor: '#FCA5A5',
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 8, alignSelf: 'flex-start',
  },
  rejectedBadgeText: { color: '#991B1B', fontSize: 12 },
  proofLink: {
    backgroundColor: 'rgba(59,130,246,0.08)', borderRadius: 12, borderWidth: 2, borderColor: '#BFDBFE',
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', gap: 6,
  },
  proofLinkText: { color: '#2563EB', fontSize: 12 },

  // Clay Primary Button
  clayPrimaryBtn: {
    borderRadius: 20, paddingVertical: 14, alignItems: 'center',
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
  },
  clayPrimaryBtnText: { fontSize: 14, fontWeight: '900', letterSpacing: 0.3, fontFamily: 'Poppins_800ExtraBold' },

  // Refresh
  refreshBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#DBEAFE', borderRadius: 14, paddingHorizontal: 10, paddingVertical: 7,
    borderWidth: 2, borderColor: '#93C5FD',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4,
  },
  refreshBtnText: { color: '#1E40AF', fontSize: 11 },

  // Status section
  statusSection: { paddingVertical: 10 },
  statusChip: {
    borderRadius: 999, borderWidth: 2.5, paddingHorizontal: 14, paddingVertical: 9,
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 8,
  },
  statusChipText: { fontSize: 13 },
  statusHint: { color: '#64A4D8', fontSize: 12 },

  // Approved QR Section
  approvedSection: { alignItems: 'center', paddingVertical: 8 },
  approvedTitle: { color: '#064E3B', fontSize: 14, marginBottom: 14 },
  qrContainer: {
    borderWidth: 3, borderColor: '#3B82F6', borderRadius: 20,
    padding: 14, backgroundColor: '#FFFFFF', marginBottom: 14,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
  },
  passDetailsGrid: { width: '100%', borderTopWidth: 2, borderTopColor: '#DBEAFE', paddingTop: 12 },
  passDetail: { alignItems: 'center', paddingVertical: 6 },
  passDetailLabel: { color: '#64A4D8', fontSize: 11 },
  passDetailValue: { color: '#1E3A5F', fontSize: 13, marginTop: 2, textAlign: 'center' },

  // Empty
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 24 },
  emptyIcon: { fontSize: 36, marginBottom: 6 },
  emptyStateText: { color: '#64A4D8', fontSize: 13, marginTop: 4 },
  emptyStateHint: { color: '#A8C8F0', fontSize: 11, marginTop: 3 },

  // History
  historyHeader: {
    flexDirection: 'row', paddingVertical: 10, marginTop: 8, marginBottom: 4,
    borderBottomWidth: 2, borderBottomColor: '#DBEAFE',
  },
  historyHeaderText: { color: '#64A4D8', fontSize: 10, textTransform: 'uppercase' },
  historyDateCol:   { width: '30%' },
  historyTypeCol:   { width: '15%' },
  historyReasonCol: { width: '30%' },
  historyStatusCol: { width: '25%' },
  historyRow: {
    flexDirection: 'row', paddingVertical: 11, borderBottomWidth: 1.5,
    borderBottomColor: '#EEF6FF', alignItems: 'center',
  },
  historyCell: { color: '#1E3A5F', fontSize: 12 },
  historyStatusBadge: {
    borderRadius: 12, borderWidth: 2, paddingHorizontal: 6, paddingVertical: 4,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  historyStatusText: { marginLeft: 2, fontSize: 10 },

  // Logout
  logoutBtn: {
    borderWidth: 2.5, borderColor: '#BFDBFE',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4,
    marginTop: 4,
  },

  // Bottom Nav
  bottomNav: {
    position: 'absolute', left: 12, right: 12, bottom: 12,
    backgroundColor: '#FFFFFF', borderRadius: 24,
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
    paddingVertical: 10,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 10,
    borderWidth: 3, borderColor: '#BFDBFE',
  },
  navItem: { alignItems: 'center', justifyContent: 'flex-end', minWidth: 60, paddingVertical: 4 },
  navLabel: { marginTop: 4, fontSize: 9, color: '#64A4D8' },
  navLabelActive: { color: '#3B82F6' },
});

// ─── Clock & Calendar Modal Styles (cs) ──────────────────────────────────────
const cs = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(10,30,70,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },

  // Clock
  clockBox: {
    backgroundColor: '#EEF6FF', borderRadius: 32, borderWidth: 3.5, borderColor: '#BFDBFE',
    padding: 22, width: 340, alignItems: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
  },
  clockFace: {
    backgroundColor: '#FFFFFF', borderRadius: 80, borderWidth: 3, borderColor: '#BFDBFE',
    padding: 6, marginBottom: 10,
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
  },
  timeDisplay: {
    fontSize: 28, fontWeight: '900', color: '#2563EB',
    letterSpacing: 1, marginBottom: 14,
    textShadowColor: 'rgba(59,130,246,0.18)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4,
  },
  wheelsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18 },
  wheelWrap: { alignItems: 'center' },
  wheelLabel: { fontSize: 10, fontWeight: '700', color: '#60A5FA', marginBottom: 6, letterSpacing: 0.5 },
  wheelBorder: {
    width: 70, height: 156, borderRadius: 18, borderWidth: 2.5, borderColor: '#BFDBFE',
    backgroundColor: '#FFFFFF', overflow: 'hidden',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  wheel: { flex: 1 },
  wheelHighlight: {
    position: 'absolute', top: 52, left: 0, right: 0, height: 52,
    borderRadius: 12, borderWidth: 2, borderColor: '#BFDBFE',
    backgroundColor: 'rgba(59,130,246,0.1)',
  },
  wheelItem: { height: 52, alignItems: 'center', justifyContent: 'center' },
  wheelItemText: { fontSize: 20, fontWeight: '700', color: '#93C5FD' },
  wheelItemActive: { color: '#2563EB', fontSize: 24, fontWeight: '900' },
  wheelSep: { fontSize: 28, fontWeight: '900', color: '#2563EB', marginTop: 18, paddingHorizontal: 2 },
  periodCol: { gap: 10, marginTop: 22 },
  periodBtn: {
    width: 58, height: 42, borderRadius: 14, borderWidth: 2.5, borderColor: '#BFDBFE',
    backgroundColor: '#F5F9FF', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  periodBtnActive: { backgroundColor: '#3B82F6', borderColor: '#2563EB' },
  periodBtnText: { fontSize: 14, fontWeight: '800', color: '#60A5FA' },
  periodBtnTextActive: { color: '#FFFFFF' },

  // Calendar
  calBox: {
    backgroundColor: '#EEF6FF', borderRadius: 32, borderWidth: 3.5, borderColor: '#BFDBFE',
    padding: 20, width: 340,
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 20,
  },
  calNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  calNavBtn: {
    width: 40, height: 40, borderRadius: 14, backgroundColor: '#FFFFFF',
    borderWidth: 2.5, borderColor: '#BFDBFE', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 6, elevation: 4,
  },
  calNavArrow: { fontSize: 24, fontWeight: '900', color: '#2563EB', lineHeight: 28 },
  calMonthTitle: { fontSize: 16, fontWeight: '800', color: '#1E3A5F', letterSpacing: 0.3 },
  calDayRow: { flexDirection: 'row', marginBottom: 6 },
  calDayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '800', color: '#60A5FA', paddingVertical: 4 },
  calGrid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  calCell: {
    width: `${100/7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, marginVertical: 2,
  },
  calCellSelected: { backgroundColor: '#3B82F6', borderWidth: 2, borderColor: '#2563EB' },
  calCellToday: { backgroundColor: '#DBEAFE', borderWidth: 2, borderColor: '#93C5FD' },
  calCellDisabled: { opacity: 0.3 },
  calCellText: { fontSize: 14, fontWeight: '700', color: '#1E3A5F' },
  calCellTextSelected: { color: '#FFFFFF', fontWeight: '900' },
  calCellTextDisabled: { color: '#A8C8F0' },
  calSelectedLabel: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: '#2563EB', marginBottom: 10 },

  // Shared action row
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, backgroundColor: '#EEF6FF', borderRadius: 18, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2.5, borderColor: '#BFDBFE',
    shadowColor: '#93C5FD', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 4,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '800', color: '#60A5FA' },
  confirmBtn: {
    flex: 2, backgroundColor: '#3B82F6', borderRadius: 18, paddingVertical: 14, alignItems: 'center',
    borderWidth: 2.5, borderColor: '#2563EB',
    shadowColor: '#1D4ED8', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  confirmBtnText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF', letterSpacing: 0.3 },
});
