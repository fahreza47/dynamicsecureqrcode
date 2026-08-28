import { StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: '#f8fafc', // Slate 50 clean background
  },
  
  // Header Bersih dengan Handwave Badge (Matching AdminDashboard)
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#f8fafc',
  },
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0f172a', // Slate 900
    letterSpacing: -0.5,
  },
  waveBadge: {
    backgroundColor: '#eff6ff',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  waveText: {
    fontSize: 16,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b', // Slate 500
    marginTop: 3,
    fontWeight: '500',
  },

  listContainer: { 
    paddingHorizontal: 20, 
    paddingTop: 4, 
    paddingBottom: 110, // Safe clearance for floating tab bar
  },

  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 14,
    marginLeft: 2,
  },

  // Event Card (Modern Horizontal Compact Layout)
  eventCard: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },

  // Thumbnail Visual Kiri (Music / Sing / Ticket)
  eventThumbnail: {
    width: 76,
    height: 76,
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
    width: 34,
    height: 34,
    tintColor: '#ffffff',
  },

  // Kolom Tengah (Info Event)
  eventInfoCol: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
    justifyContent: 'center',
  },
  eventBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  eventBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563eb', // Royal Blue
    letterSpacing: 0.5,
  },
  eventName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    lineHeight: 18,
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

  // Kolom Kanan (2x2 Quota + Tombol Beli)
  eventActionCol: {
    width: 112,
    justifyContent: 'space-between',
    alignItems: 'stretch',
  },
  quotaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  quotaItem: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  quotaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 3,
  },
  quotaText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#475569',
  },
  quotaTextSoldOut: {
    color: '#dc2626',
    fontWeight: '700',
  },

  // Tombol Beli Tiket
  buyButton: {
    height: 36,
    backgroundColor: '#2563eb', // Royal Blue
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  buyButtonDisabled: { 
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  buyButtonText: { 
    color: '#ffffff', 
    fontSize: 12, 
    fontWeight: '700',
  },

  // 🎟 Modern Bottom Sheet Pilih Tipe Tiket
  modalOverlay: {
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end', 
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#ffffff', 
    borderTopLeftRadius: 28, 
    borderTopRightRadius: 28,
    width: '100%', 
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
    marginBottom: 10,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  modalThumbnailIcon: {
    width: 22,
    height: 22,
    tintColor: '#ffffff',
  },
  modalTitleCol: {
    flex: 1,
  },
  modalSheetTitle: {
    fontSize: 15.5,
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
  modalExplainerNote: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 12,
    lineHeight: 16,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },

  // Kartu Pilihan Tipe Tiket
  typeOption: {
    flexDirection: 'row', 
    alignItems: 'center',
    borderWidth: 1.5, 
    borderRadius: 18, 
    padding: 12, 
    marginBottom: 9,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  typeOptionSoldOut: { 
    opacity: 0.55, 
    backgroundColor: '#fafafa',
    borderColor: '#e2e8f0',
  },
  typeIconBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 11,
  },
  typeIcon: {
    width: 20,
    height: 20,
  },
  typeInfo: { 
    flex: 1,
  },
  typeLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  typeLabel: { 
    fontSize: 13.5, 
    fontWeight: '800',
  },
  typeDesc: { 
    fontSize: 10.5, 
    color: '#64748b',
    lineHeight: 14,
    marginBottom: 4,
  },
  typeQuotaPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeQuotaText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  typeArrow: { 
    fontSize: 20, 
    fontWeight: 'bold',
    marginLeft: 8,
  },
  soldOutBadge: {
    backgroundColor: '#fef2f2', 
    borderRadius: 6,
    paddingHorizontal: 6, 
    paddingVertical: 1.5, 
    borderWidth: 1, 
    borderColor: '#fecaca',
  },
  soldOutText: { 
    fontSize: 9, 
    fontWeight: '800', 
    color: '#dc2626', 
    letterSpacing: 0.5,
  },
});
