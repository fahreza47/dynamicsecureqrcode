import { StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f8fafc',
  },
  loadingContainer: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 12,
  },
  loadingText: { 
    fontSize: 13, 
    color: '#64748b', 
    fontWeight: '600',
  },

  // Hero Event Banner di Atas
  heroCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 22,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  eventBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventThumbnail: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventThumbnailIcon: {
    width: 22,
    height: 22,
    tintColor: '#2563eb',
  },
  eventBannerTitle: { 
    fontSize: 16, 
    fontWeight: '800', 
    color: '#0f172a', 
    flex: 1, 
  },
  eventBannerCount: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#2563eb', // Royal Blue
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },

  // Banner Catatan Data Minimization
  privacyBanner: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: '#dcfce7',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  privacyIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyIcon: {
    width: 17,
    height: 17,
    tintColor: '#16a34a',
  },
  privacyTextBox: {
    flex: 1,
  },
  privacyTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803d',
    marginBottom: 1,
  },
  privacySubtitle: {
    fontSize: 10.5,
    color: '#166534',
    lineHeight: 14,
    fontWeight: '500',
  },
  privacyCheckCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyCheckIcon: {
    width: 10,
    height: 10,
    tintColor: '#16a34a',
  },

  listContainer: { 
    paddingHorizontal: 16, 
    paddingTop: 8, 
    paddingBottom: 110, 
  },
  listContainerEmpty: { 
    flex: 1,
  },

  // Timeline & Kartu Log Pemindaian
  logItem: { 
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

  logCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 14,
    marginLeft: 8,
    marginBottom: 10,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  typeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  typeLabel: { 
    fontSize: 10, 
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeIcon: {
    width: 11,
    height: 11,
    tintColor: '#94a3b8',
  },
  logTime: { 
    fontSize: 10.5, 
    color: '#64748b',
    fontWeight: '500',
  },

  // 3 Baris Info Terstruktur
  logDetailsContainer: { 
    gap: 6,
  },
  logRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  logRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logRowIconBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logRowIcon: {
    width: 13,
    height: 13,
    tintColor: '#2563eb',
  },
  logKey: { 
    fontSize: 12, 
    color: '#64748b',
    fontWeight: '600',
  },
  logVal: { 
    fontSize: 12.5, 
    color: '#0f172a', 
    fontWeight: '800',
  },

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

  retryButton: {
    marginTop: 16,
    backgroundColor: '#2563eb', // Royal Blue
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: { 
    color: '#ffffff', 
    fontWeight: '700', 
    fontSize: 13,
  },
});
