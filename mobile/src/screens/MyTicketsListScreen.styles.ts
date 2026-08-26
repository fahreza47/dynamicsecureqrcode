import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
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
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
  headerCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#007BFF', // Azure Blue
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  listContainer: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 },
  listContainerEmpty: { flex: 1 },
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  ticketTop: { padding: 20 },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#007BFF', // Azure Blue
    letterSpacing: 1,
  },
  ticketId: { fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' },
  eventName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 6,
  },
  eventDate: { fontSize: 12, color: '#6c757d', marginBottom: 4 },
  ticketTypeBadge: { fontSize: 11, color: '#6c757d', marginTop: 4, fontWeight: '600' },
  // Efek garis putus-putus dan lingkaran untuk simulasi tiket sobek
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: -1,
  },
  dividerCircleLeft: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f8f9fa', // Sesuaikan dengan safeArea background
    marginLeft: -10,
  },
  dividerDashed: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderStyle: 'dashed',
  },
  dividerCircleRight: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#f8f9fa', // Sesuaikan dengan safeArea background
    marginRight: -10,
  },
  ticketBottom: {
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchasedLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#84cc16', // Lime green untuk status DIBELI
    letterSpacing: 1,
    marginBottom: 2,
    backgroundColor: '#f7fee7', // Light green bg
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  purchasedDate: { fontSize: 12, color: '#212529', fontWeight: '600' },
  qrButton: {
    backgroundColor: '#007BFF', // Azure Blue
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  qrButtonText: { color: '#ffffff', fontSize: 12, fontWeight: 'bold' },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
});
