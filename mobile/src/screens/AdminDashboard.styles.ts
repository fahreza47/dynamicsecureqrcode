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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: theme.colors.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.primary,
  },
  welcomeSection: { 
    flex: 1 
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: 2 
  },
  subtitle: { 
    fontSize: 13, 
    color: theme.colors.textSecondary 
  },
  addEventBtn: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addEventBtnText: { 
    color: theme.colors.white, 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  container: { 
    paddingHorizontal: theme.spacing.xxl 
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginTop: 16,
    marginBottom: 10,
  },
  statsRow: { 
    flexDirection: 'row', 
    gap: 10, 
    width: '100%', 
    marginBottom: 14 
  },
  statCard: {
    flex: 1, 
    backgroundColor: theme.colors.cardBackground, 
    borderRadius: 14, 
    padding: 16,
    alignItems: 'center', 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.04,
    shadowRadius: 6, 
    elevation: 2,
    borderWidth: 1, 
    borderColor: theme.colors.primary,
  },
  statValue: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    marginBottom: 4 
  },
  statLabel: { 
    fontSize: 10, 
    fontWeight: '700', 
    color: theme.colors.textSecondary 
  },
  infoBar: {
    width: '100%', 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    alignItems: 'center', 
    backgroundColor: theme.colors.background, 
    borderRadius: 10,
    paddingHorizontal: 14, 
    paddingVertical: 10, 
    marginBottom: 16,
    borderWidth: 1, 
    borderColor: theme.colors.border,
  },
  infoBarText: { 
    fontSize: 12, 
    color: theme.colors.textSecondary 
  },
  refreshText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: theme.colors.primary 
  },
  
  // Event Cards
  eventCard: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1.5,
  },
  eventCardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 8 
  },
  eventName: { 
    fontSize: 15, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary, 
    flex: 1 
  },
  eventInfoRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 4 
  },
  eventInfoIcon: { 
    width: 14, 
    height: 14, 
    tintColor: '#6c757d', // Abu-abu default
    marginRight: 6 
  },
  eventDate: { 
    fontSize: 11, 
    color: theme.colors.textSecondary 
  },
  eventLocation: { 
    fontSize: 11, 
    color: theme.colors.textSecondary 
  },
  eventTime: { 
    fontSize: 11, 
    color: theme.colors.textSecondary 
  },
  eventStatsDivider: { 
    height: 1, 
    backgroundColor: '#f1f5f9', 
    marginVertical: 10 
  },
  eventStatsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  eventStatText: { 
    fontSize: 11, 
    color: theme.colors.textSecondary 
  },
  eventStatVal: { 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary 
  },
  emptyCard: { 
    backgroundColor: theme.colors.background, 
    borderRadius: 16, 
    padding: 24, 
    borderWidth: 1, 
    borderStyle: 'dashed', 
    borderColor: '#cbd5e1', 
    alignItems: 'center' 
  },
  emptyText: { 
    color: theme.colors.textSecondary, 
    fontSize: 12, 
    textAlign: 'center', 
    lineHeight: 18 
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
