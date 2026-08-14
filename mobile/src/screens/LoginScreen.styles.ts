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
    justifyContent: 'space-between',
  },
  header: { 
    marginBottom: 32 
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
  inputGroup: { 
    marginBottom: theme.spacing.lg 
  },
  label: {
    fontSize: 10,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
  eyeButtonText: {
    fontSize: 18,
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
  primaryButtonDisabled: { 
    backgroundColor: theme.colors.textMuted, 
    shadowOpacity: 0 
  },
  primaryButtonText: { 
    color: theme.colors.white, 
    fontWeight: 'bold', 
    fontSize: 14 
  },
  footerLinkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xxl,
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
    marginTop: 40 
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
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
