import { StyleSheet, Platform } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  scrollContent: { 
    paddingBottom: 32 
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
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  gateSelectorBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gateSelectorBtnEmoji: { 
    fontSize: 20 
  },
  gateSelectorBtnText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary 
  },
  gateSelectorBtnId: { 
    fontSize: 11, 
    fontWeight: 'normal', 
    color: theme.colors.textSecondary 
  },
  gateSelectorBtnAction: { 
    fontSize: 12, 
    fontWeight: 'bold' 
  },

  // Modal styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  modalSheet: {
    backgroundColor: theme.colors.cardBackground, 
    borderTopLeftRadius: 24, 
    borderTopRightRadius: 24,
    padding: 24, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: 4 
  },
  modalSubtitle: { 
    fontSize: 12, 
    color: theme.colors.textSecondary, 
    marginBottom: 20 
  },
  modalGateList: { 
    gap: 12, 
    marginBottom: 24 
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
    fontSize: 12, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary, 
    flex: 1 
  },
  modalGateLetterGroup: { 
    flexDirection: 'row', 
    gap: 10 
  },
  modalGateLetterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  modalGateLetterText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary 
  },
  modalGateLetterTextActive: { 
    color: theme.colors.white 
  },
  modalCloseBtn: { 
    backgroundColor: '#f1f5f9', 
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  modalCloseBtnText: { 
    fontSize: 14, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary 
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

  // Tombol sinkronisasi
  syncButton: {
    backgroundColor: theme.colors.primary, 
    marginHorizontal: 16, 
    marginTop: 16,
    padding: 14, 
    borderRadius: 12, 
    alignItems: 'center',
  },
  syncButtonText: { 
    color: theme.colors.white, 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  
  // Custom Sync Status Info
  syncStatusContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: theme.colors.cardBackground,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  syncStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  syncStatusLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  syncStatusValue: {
    fontSize: 11,
    color: theme.colors.textPrimary,
    fontWeight: 'bold',
  },
  syncTimeText: {
    fontSize: 10,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Sync Settings (Auto-sync picker)
  syncSettingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  syncSettingsLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  syncPickerWrapper: {
    width: 150,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  syncPicker: {
    height: 48,
    color: theme.colors.textPrimary,
    width: '100%',
    backgroundColor: 'transparent',
  },

  // Area feedback hasil validasi
  feedbackContainer: { 
    minHeight: 72, 
    marginHorizontal: 16, 
    marginTop: 12, 
    justifyContent: 'center' 
  },
  waitingText: { 
    textAlign: 'center', 
    color: theme.colors.textSecondary, 
    fontStyle: 'italic', 
    fontSize: 13 
  },
  feedbackAlert: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 14, 
    borderRadius: 14, 
    borderWidth: 1, 
    gap: 12 
  },
  alertSuccess: { 
    backgroundColor: '#f0fdf4', 
    borderColor: '#86efac' 
  },
  alertError: { 
    backgroundColor: '#fef2f2', 
    borderColor: '#fecaca' 
  },
  feedbackIcon: { 
    fontSize: 22 
  },
  feedbackTextGroup: { 
    flex: 1 
  },
  feedbackMessage: { 
    fontSize: 13, 
    fontWeight: 'bold' 
  },
  feedbackDetail: { 
    fontSize: 11, 
    color: theme.colors.textSecondary, 
    marginTop: 2 
  },
  textSuccess: { 
    color: '#166534' 
  },
  textError: { 
    color: '#991b1b' 
  },
});
