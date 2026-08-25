import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  headerSection: { paddingHorizontal: 16, paddingTop: 12 },
  content: { flex: 1, paddingHorizontal: 16, paddingBottom: 16, justifyContent: 'center' },

  // Gate banner  warna berbeda per status (found/scanning/missed)
  gateBanner: {
    borderRadius: 14, padding: 12, borderWidth: 1, marginBottom: 8,
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8,
  },
  gateBannerFound: { backgroundColor: '#f0fdf4', borderColor: '#86efac' },      // Hijau  berhasil
  gateBannerScanning: { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' },   // Biru  sedang scan
  gateBannerMissed: { backgroundColor: '#fffbeb', borderColor: '#fde68a', flexDirection: 'column', alignItems: 'flex-start' }, // Kuning  gagal
  gateDot: { width: 10, height: 10, borderRadius: 5 },
  gateBannerTextGroup: { flex: 1 },
  gateBannerTitle: { fontSize: 13, fontWeight: 'bold', color: '#166534' },
  gateBannerSub: { fontSize: 10, color: '#4ade80' },
  gateBannerScanningText: { fontSize: 13, color: '#007BFF', fontWeight: '600' }, // Azure Blue
  gateBannerMissedText: { fontSize: 12, fontWeight: 'bold', color: '#92400e' },
  reScanBtn: {backgroundColor: '#007BFF',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, marginLeft: 6,},
  reScanText: { fontSize: 11, color: '#ffffff', fontWeight: 'bold', marginLeft: 4 }, // Azure Blue
  manualPickerBtn: {
    backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#fcd34d',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10,
  },
  manualPickerBtnText: { fontSize: 12, fontWeight: 'bold', color: '#92400e' },

  // Kartu tiket
  ticketCard: {
    backgroundColor: '#ffffff', borderRadius: 24, padding: 24, alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04, shadowRadius: 15, elevation: 8,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  eventName: { fontSize: 20, fontWeight: 'bold', color: '#212529', marginBottom: 4, textAlign: 'center' },
  eventDate: { fontSize: 13, color: '#6c757d', marginBottom: 12 },
  gateIndicator: {
    borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, marginBottom: 16,
  },
  gateIndicatorText: { fontSize: 12, fontWeight: 'bold', letterSpacing: 0.3 },
  qrContainer: {
    padding: 14, backgroundColor: '#ffffff', borderRadius: 20,
    borderWidth: 2, borderColor: '#e2e8f0', borderStyle: 'dashed', marginBottom: 24,
  },
  qrContainerDisabled: { borderColor: '#e2e8f0', backgroundColor: '#f8f9fa' }, // Warna memudar saat terkunci
  qrPlaceholder: {
    width: 200, height: 200, justifyContent: 'center', alignItems: 'center',
  },
  qrPlaceholderIcon: { fontSize: 40, marginBottom: 12 },
  qrPlaceholderText: { fontSize: 12, color: '#6c757d', textAlign: 'center', lineHeight: 18 },
  timerContainer: { width: '100%', marginBottom: 12 },
  timerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  timerLabel: { fontSize: 9, fontWeight: 'bold', color: '#6c757d', letterSpacing: 1 },
  timerValue: { fontSize: 11, fontWeight: 'bold', color: '#007BFF' }, // Azure Blue
  progressBarBg: { width: '100%', height: 5, backgroundColor: '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%' },
  payloadText: { fontSize: 9, color: '#cbd5e1', fontFamily: 'monospace', textAlign: 'center' },

  // Modal bottom sheet untuk pemilihan gate manual
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#6c757d', marginBottom: 20 },
  gateOption: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    backgroundColor: '#f8f9fa', borderRadius: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#e2e8f0',
  },
  gateOptionEmoji: { fontSize: 22, marginRight: 14 },
  gateOptionName: { fontSize: 15, fontWeight: 'bold', color: '#212529', flex: 1 },
  gateOptionCheck: { fontSize: 18, fontWeight: 'bold' },
  modalCancelBtn: { alignItems: 'center', marginTop: 8, padding: 12 },
  modalCancelText: { color: '#6c757d', fontWeight: 'bold', fontSize: 14 },
});
