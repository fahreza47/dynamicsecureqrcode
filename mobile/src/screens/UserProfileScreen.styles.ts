import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 32 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#212529' },
  backButton: { padding: 4 },
  backButtonText: { fontSize: 24, color: '#007BFF', fontWeight: 'bold' }, // Azure Blue

  avatarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#007BFF', // Azure Blue
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLetter: { fontSize: 28, fontWeight: 'bold', color: '#ffffff' }, // Putih agar kontras
  username: { fontSize: 20, fontWeight: 'bold', color: '#212529', marginBottom: 8 },
  roleBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#93c5fd', // Azure light border
  },
  roleText: { fontSize: 11, fontWeight: 'bold', color: '#007BFF', letterSpacing: 0.5 }, // Azure Blue

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: 14, padding: 16,
    alignItems: 'center', shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#212529', marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#6c757d', fontWeight: '600', textAlign: 'center' },

  infoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04,
    shadowRadius: 6, elevation: 2,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  infoCardHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  infoTitle: {
    fontSize: 13, fontWeight: 'bold', color: '#6c757d',
    letterSpacing: 0.5, textTransform: 'uppercase',
  },
  editBtn: { fontSize: 13, color: '#007BFF', fontWeight: '600' }, // Azure Blue
  dataNoteBox: {
    backgroundColor: '#f0fdf4', borderRadius: 10, padding: 10,
    borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 14,
  },
  dataNoteText: { fontSize: 11, color: '#15803d', lineHeight: 17 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  infoRowLast: { borderBottomWidth: 0 },
  infoLabel: { fontSize: 13, color: '#6c757d' },
  infoValue: { fontSize: 13, color: '#212529', fontWeight: '600', flex: 1, textAlign: 'right' },
  infoValueEmpty: { color: '#94a3b8', fontStyle: 'italic', fontWeight: 'normal' },

  originEditRow: { flex: 1, marginLeft: 12 },
  originInput: {
    backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#007BFF', // Azure Blue
    borderRadius: 8, padding: 8, fontSize: 13, color: '#212529', marginBottom: 8,
  },
  originBtnRow: { flexDirection: 'row', gap: 8 },
  saveBtn: {
    flex: 1, backgroundColor: '#007BFF', borderRadius: 8, // Azure Blue
    paddingVertical: 8, alignItems: 'center',
  },
  saveBtnDisabled: { backgroundColor: '#94a3b8' },
  saveBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  cancelBtn: {
    flex: 1, backgroundColor: '#f1f5f9', borderRadius: 8,
    paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0',
  },
  cancelBtnText: { color: '#6c757d', fontSize: 12 },

  warningBox: {
    backgroundColor: '#fffbeb', borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: '#fde68a', marginTop: 10,
  },
  warningText: { fontSize: 11, color: '#92400e', lineHeight: 16, marginBottom: 6 },
  warningLink: { fontSize: 12, fontWeight: 'bold', color: '#d97706' },

  logoutButton: {
    backgroundColor: '#dc2626',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    alignSelf: 'center',
    width: '60%',
    marginTop: 8,
    marginBottom: 8,
  },
  logoutText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
});
