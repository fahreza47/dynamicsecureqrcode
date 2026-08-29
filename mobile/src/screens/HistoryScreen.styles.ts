import { StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  listContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 14, 
    paddingBottom: 110, 
  },
  listContainerEmpty: { 
    flex: 1,
  },

  historyItem: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  timelineCol: {
    width: 24,
    alignItems: 'center',
    paddingTop: 18,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: '#e2e8f0',
    marginTop: 4,
    marginBottom: -6,
  },

  historyCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 14,
    marginLeft: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },

  // Bagian Atas Kartu
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventThumbnailIcon: {
    width: 26,
    height: 26,
    tintColor: '#ffffff',
  },
  eventInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
    justifyContent: 'center',
  },
  historyEvent: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    width: 11,
    height: 11,
    tintColor: '#94a3b8',
    marginRight: 5,
  },
  historyEventDate: { 
    fontSize: 11, 
    color: '#64748b', 
    fontWeight: '500',
  },

  // Badge Tipe & Watermark Kanan
  badgeWatermarkCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 52,
  },
  typeBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
  },
  typeBadgeText: { 
    fontSize: 9.5, 
    fontWeight: '800', 
    letterSpacing: 0.5,
  },
  watermarkIcon: {
    width: 24,
    height: 24,
    opacity: 0.12,
  },

  // Garis Putus-putus
  dashedLine: {
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
    marginVertical: 10,
  },

  // Bagian Bawah Kartu
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ticketIcon: {
    width: 12,
    height: 12,
    tintColor: '#94a3b8',
  },
  historyTicketId: {
    fontSize: 11.5,
    color: '#64748b',
    fontWeight: '600',
  },
  historyTime: { 
    fontSize: 11, 
    color: '#64748b',
    fontWeight: '500',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 80,
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
