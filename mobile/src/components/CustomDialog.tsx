import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';

export type DialogType = 'success' | 'info' | 'warning' | 'error' | 'confirm';

export type CustomDialogProps = {
  visible: boolean;
  type?: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmColor?: string;
  confirmStyle?: 'default' | 'danger';
};

const TYPE_CONFIG = {
  success: {
    icon: require('../assets/flaticon/check-no-bg.png'),
    iconColor: '#16a34a',
    bg: '#f0fdf4',
    border: '#dcfce7',
    defaultConfirmColor: '#16a34a',
  },
  info: {
    icon: require('../assets/flaticon/info.png'),
    iconColor: '#2563eb',
    bg: '#eff6ff',
    border: '#dbeafe',
    defaultConfirmColor: '#2563eb',
  },
  warning: {
    icon: require('../assets/flaticon/triangle-warning.png'),
    iconColor: '#d97706',
    bg: '#fffbeb',
    border: '#fef3c7',
    defaultConfirmColor: '#d97706',
  },
  confirm: {
    icon: require('../assets/flaticon/triangle-warning.png'),
    iconColor: '#2563eb',
    bg: '#eff6ff',
    border: '#dbeafe',
    defaultConfirmColor: '#2563eb',
  },
  error: {
    icon: require('../assets/flaticon/x-no-bg.png'),
    iconColor: '#dc2626',
    bg: '#fef2f2',
    border: '#fee2e2',
    defaultConfirmColor: '#dc2626',
  },
};

export default function CustomDialog({
  visible,
  type = 'info',
  title,
  message,
  confirmText = 'OK',
  cancelText,
  onConfirm,
  onCancel,
  confirmColor,
  confirmStyle = 'default',
}: CustomDialogProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.info;
  const btnColor =
    confirmColor ||
    (confirmStyle === 'danger' ? '#dc2626' : config.defaultConfirmColor);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onCancel || onConfirm}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Circular Icon Badge */}
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: config.bg, borderColor: config.border },
            ]}
          >
            <Image
              source={config.icon}
              style={[styles.iconImg, { tintColor: config.iconColor }]}
            />
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            {Boolean(cancelText) && (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                {
                  backgroundColor: btnColor,
                  shadowColor: btnColor,
                },
              ]}
              onPress={onConfirm}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  iconCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    marginBottom: 6,
  },
  iconImg: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    marginTop: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 6,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748b',
  },
  confirmBtn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  confirmBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ffffff',
  },
});
