import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#6c757d' },

  eventBanner: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventBannerTitle: { fontSize: 15, fontWeight: 'bold', color: '#212529', flex: 1 },
  eventBannerCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007BFF', // Azure Blue
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },

  privacyNote: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#bbf7d0',
  },
  privacyNoteText: { fontSize: 11, color: '#15803d' },

  listContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  listContainerEmpty: { flex: 1 },

  logItem: { flexDirection: 'row', marginBottom: 0 },
  timelineCol: { width: 28, alignItems: 'center', paddingTop: 14 },
  timelineDot: {
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2, shadowRadius: 2, elevation: 2,
  },
  timelineLine: {
    flex: 1, width: 2, backgroundColor: '#e2e8f0',
    marginTop: 4, marginBottom: -4,
  },

  logCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginLeft: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  typeEmoji: { fontSize: 12 },
  typeLabel: { fontSize: 12, fontWeight: 'bold' },
  logTime: { fontSize: 10, color: '#6c757d' },

  logDetails: { gap: 4 },
  logDetailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  logDetailKey: { fontSize: 11, color: '#6c757d' },
  logDetailValue: { fontSize: 11, color: '#212529', fontFamily: 'monospace' },

  emptyContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#212529', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#6c757d', textAlign: 'center', lineHeight: 20 },

  retryButton: {
    marginTop: 16,
    backgroundColor: '#007BFF', // Azure Blue
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
});
