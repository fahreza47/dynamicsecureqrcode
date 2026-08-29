import { StyleSheet, Platform } from 'react-native';
import { theme } from '../styles/theme';

export const styles = StyleSheet.create({
  safeArea: { 
    flex: 1, 
    backgroundColor: theme.colors.background 
  },
  container: { 
    flex: 1 
  },
  content: { 
    flex: 1, 
    paddingHorizontal: theme.spacing.xxl, 
    paddingTop: 64, 
    paddingBottom: theme.spacing.xxl, 
    justifyContent: 'space-between' 
  },
  header: { 
    marginBottom: 24 
  },
  backButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    width: 20,
    height: 20,
    tintColor: theme.colors.primary,
  },
  title: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: theme.colors.textPrimary 
  },
  subtitle: { 
    fontSize: 14, 
    color: theme.colors.textSecondary, 
    marginTop: 4 
  },
  form: { 
    flex: 1 
  },
  roleToggleContainer: { 
    flexDirection: 'row', 
    backgroundColor: '#e2e8f0', 
    borderRadius: theme.borderRadius.md, 
    padding: 4, 
    marginBottom: 20 
  },
  roleButton: { 
    flex: 1, 
    paddingVertical: 10, 
    borderRadius: theme.borderRadius.sm, 
    alignItems: 'center' 
  },
  roleButtonActive: { 
    backgroundColor: theme.colors.white, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 2, 
    elevation: 2 
  },
  roleText: { 
    fontSize: 12, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary 
  },
  roleTextActive: { 
    color: theme.colors.primary 
  },
  inputGroup: { 
    marginBottom: theme.spacing.lg 
  },
  label: { 
    fontSize: 10, 
    fontWeight: 'bold', 
    color: theme.colors.textSecondary, 
    marginBottom: theme.spacing.xs, 
    textTransform: 'uppercase' 
  },
  input: {
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.xl,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  passwordInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
  },
  passwordInput: {
    flex: 1,
    padding: theme.spacing.xl,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  eyeButton: {
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: { 
    color: theme.colors.white, 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  footerLinkContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginTop: 24 
  },
  footerText: { 
    color: theme.colors.textSecondary, 
    fontSize: 12 
  },
  linkText: { 
    color: theme.colors.primary, 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  bottomLogo: { 
    alignItems: 'center', 
    marginTop: 40,
    marginBottom: 40
  },
  logoBox: {
    width: 48,
    height: 48,
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#93c5fd',
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  logoText: { 
    fontSize: 10, 
    color: theme.colors.textSecondary, 
    letterSpacing: 1.5, 
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' 
  }
});
