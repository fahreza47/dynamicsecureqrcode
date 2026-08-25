import { StyleSheet, Platform } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  scrollContent: { 
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
  },
  welcomeSection: { 
    flex: 1,
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: { 
    fontSize: 22, 
    fontWeight: '800', 
    color: '#0f172a', 
  },
  waveBadge: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveText: {
    fontSize: 16,
  },
  subtitle: { 
    fontSize: 12, 
    color: '#64748b',
    fontWeight: '500',
    marginTop: 2,
  },
  addEventBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    gap: 8,
  },
  addEventIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addEventPlusText: {
    color: '#2563eb',
    fontSize: 12,
    fontWeight: '900',
    marginTop: -1,
  },
  addEventBtnText: { 
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: '700',
  },
  container: { 
    paddingHorizontal: 20,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginTop: 18,
    marginBottom: 12,
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    width: '100%', 
    marginBottom: 16,
  },
  statCard: {
    flex: 1, 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.04,
    shadowRadius: 10, 
    elevation: 2,
    borderWidth: 1, 
    borderColor: '#f1f5f9',
  },
  statIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statIcon: {
    width: 18,
    height: 18,
  },
  statValue: { 
    fontSize: 22, 
    fontWeight: '800', 
    marginBottom: 2,
  },
  statLabel: { 
    fontSize: 11, 
    fontWeight: '600', 
    color: '#64748b',
  },
  infoBar: {
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    backgroundColor: '#ffffff', 
    borderRadius: 16,
    paddingHorizontal: 16, 
    paddingVertical: 12, 
    marginBottom: 16,
    borderWidth: 1, 
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1.5,
  },
  infoBarText: { 
    fontSize: 12, 
    fontWeight: '600',
    color: '#334155',
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  refreshText: { 
    fontSize: 11, 
    fontWeight: '700', 
    color: '#2563eb',
  },
  
  // Event Cards
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  eventCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 12,
  },
  eventThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventThumbnailIcon: {
    width: 28,
    height: 28,
    tintColor: '#ffffff',
  },
  eventMetaContainer: {
    flex: 1,
  },
  eventName: { 
    fontSize: 15, 
    fontWeight: '700', 
    color: '#0f172a', 
    marginBottom: 5,
  },
  eventMetaRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 3,
  },
  eventMetaIcon: { 
    width: 12, 
    height: 12, 
    tintColor: '#94a3b8',
    marginRight: 6,
  },
  eventMetaText: { 
    fontSize: 11, 
    color: '#64748b',
    fontWeight: '500',
  },
  eventArrow: {
    fontSize: 20,
    color: '#3b82f6',
    fontWeight: '600',
    paddingHorizontal: 4,
  },
  eventDivider: { 
    height: 1, 
    backgroundColor: '#f1f5f9', 
    marginVertical: 10,
  },
  eventStatsGrid: { 
    flexDirection: 'row', 
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  eventStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  eventStatColLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 3,
  },
  eventStatColVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  eventStatColDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#f1f5f9',
  },
  emptyCard: { 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 24, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#cbd5e1', 
    alignItems: 'center',
    marginTop: 8,
  },
  emptyText: { 
    color: '#64748b', 
    fontSize: 12, 
    textAlign: 'center', 
    lineHeight: 18,
  },

  // Modal Styles
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.5)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 24 
  },
  modalContent: { 
    backgroundColor: theme.colors.cardBackground, 
    borderRadius: 24, 
    width: '100%', 
    padding: 24, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 10 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 20, 
    elevation: 8, 
    borderWidth: 1, 
    borderColor: theme.colors.border 
  },
  modalHeaderTitle: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary, 
    letterSpacing: 1, 
    textTransform: 'uppercase', 
    marginBottom: 8 
  },
  modalEventName: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: 4 
  },
  modalEventDate: { 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  modalStatsGrid: { 
    flexDirection: 'row', 
    gap: 10, 
    marginBottom: 20 
  },
  modalStatBox: { 
    flex: 1, 
    backgroundColor: theme.colors.background, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    borderRadius: 12, 
    padding: 12, 
    alignItems: 'center' 
  },
  modalStatVal: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: 2 
  },
  modalStatLbl: { 
    fontSize: 10, 
    color: theme.colors.textSecondary, 
    fontWeight: 'bold' 
  },
  modalDescContainer: { 
    backgroundColor: theme.colors.background, 
    borderRadius: 14, 
    padding: 14, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    marginBottom: 24 
  },
  modalDescHeader: { 
    fontSize: 11, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: 4 
  },
  modalDescText: { 
    fontSize: 11, 
    color: theme.colors.textSecondary, 
    lineHeight: 16 
  },
  modalActionBtn: { 
    backgroundColor: theme.colors.primary, 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  modalActionBtnText: { 
    color: theme.colors.white, 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  modalHistoryBtn: { 
    backgroundColor: theme.colors.background, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    padding: 14, 
    borderRadius: 14, 
    alignItems: 'center', 
    marginBottom: 8 
  },
  modalHistoryBtnText: { 
    color: theme.colors.textPrimary, 
    fontSize: 14, 
    fontWeight: 'bold' 
  },
  modalCloseBtn: { 
    padding: 12, 
    alignItems: 'center' 
  },
  modalCloseBtnText: { 
    color: theme.colors.textSecondary, 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  modalEventLocation: { 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  modalEventTime: { 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  modalDetailsContainer: { 
    marginBottom: 20, 
    gap: 8 
  },
  modalDetailRow: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  modalDetailIcon: { 
    width: 14, 
    height: 14, 
    tintColor: '#6c757d', 
    marginRight: 8 
  },
  ticketTypeRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 5, 
    borderBottomWidth: 1, 
    borderBottomColor: '#f1f5f9' 
  },
  ticketTypeDot: { 
    fontSize: 13, 
    marginRight: 8 
  },
  ticketTypeLabel: { 
    flex: 1, 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  ticketTypeCount: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary 
  },

  // Form Styles
  formGroup: { 
    marginBottom: 16 
  },
  formLabel: { 
    fontSize: 9, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary, 
    letterSpacing: 0.8, 
    marginBottom: 6 
  },
  formInput: { 
    backgroundColor: theme.colors.background, 
    borderWidth: 1, 
    borderColor: theme.colors.border, 
    borderRadius: 8, 
    padding: 12, 
    fontSize: 13, 
    color: theme.colors.textPrimary 
  },
  formHint: { 
    fontSize: 10, 
    color: theme.colors.textSecondary, 
    marginTop: 4 
  },
  formErrorBox: {
    backgroundColor: '#fef2f2', 
    borderRadius: 10, 
    padding: 10,
    borderWidth: 1, 
    borderColor: '#fecaca', 
    marginBottom: 14,
  },
  formErrorText: { 
    fontSize: 12, 
    color: theme.colors.danger, 
    lineHeight: 17 
  },
  formInputPicker: {
    backgroundColor: theme.colors.background,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    minHeight: 46,
  },
  formInputPickerText: {
    fontSize: 13,
    color: theme.colors.textPrimary,
  },
  inputPickerIcon: {
    width: 16,
    height: 16,
    tintColor: theme.colors.primary,
    marginRight: 10,
  },
});
