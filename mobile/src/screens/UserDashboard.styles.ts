import { StyleSheet } from 'react-native';
import { theme } from '../styles/theme';


export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' }, // Pure white / Light grey
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerGreeting: { fontSize: 22, fontWeight: 'bold', color: '#212529' },
  headerSub: { fontSize: 12, color: '#6c757d', marginTop: 2 },
  listContainer: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 },

  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04, shadowRadius: 8, elevation: 3,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  eventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 3, marginBottom: 10,
  },
  eventBadgeText: { fontSize: 9, fontWeight: 'bold', color: '#007BFF', letterSpacing: 1 },
  eventName: { fontSize: 18, fontWeight: 'bold', color: '#212529', marginBottom: 6 },
  eventVenue: { fontSize: 12, color: '#6c757d', marginBottom: 3 },
  eventDate: { fontSize: 12, color: '#6c757d', marginBottom: 3 },
  eventTime: { fontSize: 12, color: '#6c757d', marginBottom: 12 },

  quotaRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16,
  },
  quotaBadge: {
    backgroundColor: '#f8f9fa', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  quotaBadgeSoldOut: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  quotaText: { fontSize: 10, color: '#6c757d' },
  quotaTextSoldOut: { color: '#dc2626', fontWeight: 'bold' },

  buyButton: {
    backgroundColor: '#007BFF', borderRadius: 10, // Azure Blue
    paddingVertical: 12, alignItems: 'center',
  },
  buyButtonDisabled: { backgroundColor: '#cbd5e1' },
  buyButtonText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },

  // Modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    width: '100%', padding: 24, paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18, fontWeight: 'bold', color: '#212529', marginBottom: 4,
  },
  modalEventName: { fontSize: 13, color: '#007BFF', fontWeight: '600', marginBottom: 8 },
  modalSubtitle: { fontSize: 12, color: '#6c757d', marginBottom: 16, lineHeight: 18 },

  typeOption: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 14, padding: 14, marginBottom: 10,
  },
  typeOptionSoldOut: { opacity: 0.6, backgroundColor: '#f8f9fa' },
  typeEmoji: { fontSize: 28, marginRight: 14 },
  typeInfo: { flex: 1 },
  typeLabel: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
  typeDesc: { fontSize: 11, color: '#6c757d' },
  typeQuota: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  typeArrow: { fontSize: 22, fontWeight: 'bold' },
  soldOutBadge: {
    backgroundColor: '#fef2f2', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, borderColor: '#fecaca',
  },
  soldOutText: { fontSize: 9, fontWeight: 'bold', color: '#dc2626', letterSpacing: 0.5 },

  modalCancelBtn: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  modalCancelText: { fontSize: 14, color: '#6c757d', fontWeight: '600' },
});
