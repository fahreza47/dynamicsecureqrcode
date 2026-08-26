import { StyleSheet } from 'react-native';
import { theme } from './theme';

export const globalStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
  },
  card: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textTitle: {
    fontSize: theme.typography.xxl,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  textSubtitle: {
    fontSize: theme.typography.sm,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  sectionHeader: {
    fontSize: theme.typography.xs,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  buttonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.round,
    ...theme.shadows.buttonPrimary,
    gap: theme.spacing.sm,
  },
  buttonPrimaryText: {
    color: theme.colors.white,
    fontSize: theme.typography.sm,
    fontWeight: '700',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.round,
    backgroundColor: theme.colors.primarySoft,
  },
  badgePillText: {
    fontSize: theme.typography.xs,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
