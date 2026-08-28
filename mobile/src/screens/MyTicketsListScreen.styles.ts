import { StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  listContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 12, 
    paddingBottom: 110, 
  },
  listContainerEmpty: { 
    flex: 1,
  },

  // 3-Grid Statistik Ringkasan Tiket di Atas List
  statsRow: { 
    flexDirection: 'row', 
    gap: 10, 
    width: '100%', 
    marginBottom: 16,
  },
  statCard: {
    flex: 1, 
    backgroundColor: '#ffffff', 
    borderRadius: 20, 
    padding: 14,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.04,
    shadowRadius: 10, 
    elevation: 2,
    borderWidth: 1, 
    borderColor: '#f1f5f9',
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
    marginBottom: 2,
  },
  statLabel: { 
    fontSize: 10.5, 
    fontWeight: '600', 
    color: '#64748b',
  },

  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 2,
  },

  // Kartu Tiket Fisik (Ticket Stub Design)
  ticketCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
  },
  ticketCardUsed: {
    opacity: 0.72,
    backgroundColor: '#fafafa',
  },

  // Bagian Atas Tiket (Info & QR Watermark)
  ticketTop: { 
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  ticketHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  eventBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  eventBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#2563eb', // Royal Blue
    letterSpacing: 0.5,
  },
  ticketId: { 
    fontSize: 12, 
    color: '#94a3b8', 
    fontWeight: '800',
  },
  usedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#64748b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  usedBadgeIcon: {
    width: 10,
    height: 10,
    tintColor: '#ffffff',
  },
  usedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  ticketMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventThumbnail: {
    width: 66,
    height: 66,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventThumbnailIcon: {
    width: 30,
    height: 30,
    tintColor: '#ffffff',
  },
  ticketInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: 'center',
  },
  eventName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 18,
  },
  eventNameUsed: {
    color: '#64748b',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaIcon: {
    width: 11,
    height: 11,
    tintColor: '#94a3b8',
    marginRight: 5,
  },
  metaText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '500',
  },
  typeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    marginRight: 5,
  },
  typeText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },

  // QR Code Silhouette / Watermark Kanan
  qrSilhouetteBox: {
    width: 66,
    height: 66,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrSilhouetteIcon: {
    width: 44,
    height: 44,
    tintColor: '#64748b',
    opacity: 0.14,
  },

  // Pembatas Garis Putus-putus & Notch Lekukan Sobekan Tiket
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
    marginVertical: 4,
    overflow: 'hidden',
  },
  notchLeft: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginLeft: -8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  dashedDivider: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    marginHorizontal: 6,
  },
  notchRight: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    marginRight: -8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  // Bagian Bawah Tiket (Tanggal Pembelian & Tombol Aksi)
  ticketBottom: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  purchasedCol: {
    justifyContent: 'center',
  },
  purchasedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#dcfce7',
    marginBottom: 2,
  },
  purchasedBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#16a34a',
    letterSpacing: 0.5,
  },
  purchasedDateText: { 
    fontSize: 11.5, 
    color: '#0f172a', 
    fontWeight: '600',
  },

  // Tombol Tampilkan QR & Status Tidak Tersedia
  showQrBtn: {
    height: 36,
    backgroundColor: '#2563eb', // Royal Blue
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  showQrIcon: {
    width: 13,
    height: 13,
    tintColor: '#ffffff',
  },
  showQrText: { 
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: '700',
  },

  disabledBtn: {
    height: 36,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  disabledBtnText: {
    color: '#94a3b8',
    fontSize: 11.5,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    tintColor: '#94a3b8',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
