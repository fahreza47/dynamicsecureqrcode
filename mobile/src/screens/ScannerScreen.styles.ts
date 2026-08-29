import { StyleSheet, Platform } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  scrollContent: { 
    paddingBottom: 110,
  },

  // Event Banner di dalam Halaman (Pengganti AppHeader Subtitle)
  eventBanner: {
    backgroundColor: theme.colors.cardBackground,
    padding: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 12,
  },
  eventBannerLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  eventBannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  eventBannerLocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  eventBannerLocIcon: {
    width: 14,
    height: 14,
    tintColor: theme.colors.textSecondary,
    marginRight: 4,
  },
  eventBannerLocText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },

  // BLE Status Bar
  bleStatusBar: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginHorizontal: 16, 
    marginTop: 16,
    borderRadius: 14, 
    borderWidth: 1,
  },
  bleBarActive: { 
    backgroundColor: '#f0fdf4', 
    borderColor: '#86efac' 
  },
  bleBarInactive: { 
    backgroundColor: theme.colors.cardBackground, 
    borderColor: theme.colors.border 
  },
  bleBarLeft: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    gap: 10 
  },
  bleDot: { 
    width: 10, 
    height: 10, 
    borderRadius: 5 
  },
  bleDotActive: { 
    backgroundColor: '#22c55e', 
    shadowColor: '#22c55e', 
    shadowRadius: 4, 
    shadowOpacity: 0.6, 
    elevation: 3 
  },
  bleDotInactive: { 
    backgroundColor: theme.colors.textMuted 
  },
  bleBarTitle: { 
    fontSize: 13, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary 
  },
  bleBarSubtitle: { 
    fontSize: 10, 
    color: theme.colors.textSecondary, 
    marginTop: 1 
  },
  bleToggleBtn: { 
    paddingHorizontal: 14, 
    paddingVertical: 7, 
    borderRadius: 8 
  },
  bleToggleBtnStart: { 
    backgroundColor: theme.colors.primary 
  },
  bleToggleBtnStop: { 
    backgroundColor: theme.colors.danger 
  },
  bleToggleBtnPermission: { 
    backgroundColor: theme.colors.warning 
  },
  bleToggleBtnText: { 
    color: theme.colors.white, 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  bleUnsupportedBanner: {
    marginHorizontal: 16, 
    marginTop: 8, 
    padding: 10, 
    backgroundColor: '#fef3c7',
    borderRadius: 10, 
    borderWidth: 1, 
    borderColor: '#fcd34d',
  },
  bleUnsupportedText: { 
    fontSize: 11, 
    color: '#92400e' 
  },

  // Gate selector button and modal styles
  section: { 
    paddingHorizontal: 16, 
    marginTop: 16 
  },
  sectionTitle: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary, 
    letterSpacing: 1, 
    marginBottom: 10 
  },
  gateSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gateSelectorBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gateSelectorIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gateSelectorIcon: {
    width: 18,
    height: 18,
  },
  gateSelectorBtnText: { 
    fontSize: 13.5, 
    fontWeight: '800', 
    color: '#0f172a',
  },
  gateSelectorBtnId: { 
    fontSize: 11, 
    fontWeight: 'normal', 
    color: '#64748b',
  },
  gateSelectorBtnAction: { 
    fontSize: 12, 
    fontWeight: '800',
  },

  // Modal Gate Picker
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.55)', 
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#ffffff', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28,
    paddingHorizontal: 20, 
    paddingTop: 12,
    paddingBottom: 28,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  dragHandleBar: {
    width: 38,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalHeaderLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  modalThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalThumbnailIcon: {
    width: 22,
    height: 22,
    tintColor: '#2563eb',
  },
  modalTitleCol: {
    flex: 1,
  },
  modalSheetTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  modalSheetSub: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalCloseIcon: {
    width: 11,
    height: 11,
    tintColor: '#64748b',
  },
  modalGateList: { 
    gap: 8, 
    marginBottom: 8,
  },
  modalGateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
  },
  modalGateRowLabel: { 
    fontSize: 12.5, 
    fontWeight: '800', 
    color: '#475569', 
    flex: 1,
  },
  modalGateLetterGroup: { 
    flexDirection: 'row', 
    gap: 8,
  },
  modalGateLetterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  modalGateLetterText: { 
    fontSize: 13, 
    fontWeight: '800', 
    color: '#475569',
  },
  modalGateLetterTextActive: { 
    color: '#ffffff',
  },

  // Area Kamera Riil
  cameraContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    height: 260,
    backgroundColor: '#000000',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#212529',
  },
  cameraFallbackText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
    fontWeight: 'bold',
  },
  cameraWrapper: {
    flex: 1,
    position: 'relative',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cameraScanBox: {
    width: 150,
    height: 150,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanLockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraOverlayText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.6)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },

  // ── Tombol Sinkronisasi & Auto-Sync 1 Row Sejajar ──
  syncRowContainer: {
    flexDirection: 'row',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
    alignItems: 'center',
  },
  syncButtonHalf: {
    flex: 1,
    height: 52,
    backgroundColor: '#2563eb', // Royal Blue
    borderRadius: 16,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  syncButtonHalfContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  syncButtonIcon: {
    width: 15,
    height: 15,
    tintColor: '#ffffff',
  },
  syncButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    width: 80
  },

  // Kotak Auto Sync Sebelah Kanan
  autoSyncBoxHalf: {
  flex: 1,
  // Hapus height: 52, biarkan fleksibel
  backgroundColor: '#ffffff',
  borderRadius: 16,
  borderWidth: 1,
  borderColor: '#e2e8f0',
  paddingHorizontal: 10,
  paddingVertical: 6,
  justifyContent: 'space-between', // penting: pisahkan header dan picker
  shadowColor: '#0f172a',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 2,
  },
  autoSyncHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  marginLeft: 2,
  marginBottom: 0, // hilangkan margin negatif
  },
  autoSyncIcon: {
    width: 11,
    height: 11,
    tintColor: '#64748b',
  },
  autoSyncLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  syncPickerWrapper: {
  // Hapus height: 36, biarkan menyesuaikan
  justifyContent: 'center',
  marginTop: -4, // sedikit naikkan agar dekat dengan header
  },
  syncPicker: {
  height: 50, // beri tinggi cukup
  color: '#0f172a', // warna teks gelap
  fontSize: 12,
  fontWeight: '600',
  backgroundColor: 'transparent',
  // Android: pastikan tidak ada padding yang memotong
  paddingHorizontal: 0,
  },

  // 4 Grid Statistik Pemindaian
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 17,
    height: 17,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10.5,
    color: '#64748b',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Banner Info di Bawah 4 Grid
  syncInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    gap: 8,
  },
  infoIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoIconImg: {
    width: 12,
    height: 12,
    tintColor: '#2563eb',
  },
  syncInfoBannerText: {
    fontSize: 11,
    color: '#475569',
    fontStyle: 'italic',
    flex: 1,
  },

  // Area feedback hasil validasi
  feedbackContainer: { 
    minHeight: 68, 
    marginHorizontal: 16, 
    marginTop: 10, 
    justifyContent: 'center',
  },
  waitingFeedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  waitingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  waitingText: { 
    textAlign: 'center', 
    color: '#64748b', 
    fontStyle: 'italic', 
    fontSize: 12.5,
    fontWeight: '500',
  },
  feedbackAlert: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 18, 
    borderWidth: 1, 
    gap: 12,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  alertSuccess: { 
    backgroundColor: '#f0fdf4', 
    borderColor: '#bbf7d0',
  },
  alertError: { 
    backgroundColor: '#fef2f2', 
    borderColor: '#fecaca',
  },
  feedbackBadgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackTextGroup: { 
    flex: 1,
  },
  feedbackMessage: { 
    fontSize: 13.5, 
    fontWeight: '800',
  },
  feedbackDetail: { 
    fontSize: 11, 
    color: '#64748b', 
    marginTop: 2,
    fontWeight: '500',
  },
  textSuccess: { 
    color: '#15803d',
  },
  textError: { 
    color: '#b91c1c',
  },
});
