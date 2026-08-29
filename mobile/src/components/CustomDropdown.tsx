import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { styles } from './CustomDropdown.styles';

export interface DropdownOption {
  label: string;
  value: number | string;
}

interface CustomDropdownProps {
  options: DropdownOption[];
  selectedValue: number | string;
  onValueChange: (value: number | string) => void;
  placeholder?: string;
  style?: any;
}

export default function CustomDropdown({
  options,
  selectedValue,
  onValueChange,
  placeholder = 'Pilih...',
  style,
}: CustomDropdownProps) {
  const [visible, setVisible] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<View>(null);

  const openDropdown = () => {
    if (buttonRef.current) {
      buttonRef.current.measureInWindow((pageX, pageY, width, height) => {
        setDropdownPosition({
          top: pageY + height + 4,
          left: Math.max(16, pageX),
          width: Math.max(140, width),
        });
        setVisible(true);
      });
    } else {
      setVisible(true);
    }
  };

  const closeDropdown = () => setVisible(false);

  const handleSelect = (value: number | string) => {
    onValueChange(value);
    closeDropdown();
  };

  const selectedOption = options.find(opt => opt.value === selectedValue);
  const selectedLabel = selectedOption?.label || placeholder;

  return (
    <>
      <TouchableOpacity
        ref={buttonRef}
        style={[styles.dropdownButton, style]}
        onPress={openDropdown}
        activeOpacity={0.8}
      >
        <Text style={styles.dropdownButtonText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <Text style={styles.dropdownChevron}>▾</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeDropdown}
      >
        <TouchableWithoutFeedback onPress={closeDropdown}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View
                style={[
                  styles.dropdownListContainer,
                  {
                    top: dropdownPosition.top,
                    left: dropdownPosition.left,
                    width: dropdownPosition.width,
                  },
                ]}
              >
                {options.map((item, index) => {
                  const isSelected = item.value === selectedValue;
                  const isLast = index === options.length - 1;
                  return (
                    <TouchableOpacity
                      key={String(item.value)}
                      style={[styles.dropdownItem, isLast && styles.dropdownItemLast]}
                      onPress={() => handleSelect(item.value)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.radioCircle,
                          isSelected && styles.radioCircleSelected,
                        ]}
                      >
                        {isSelected && <View style={styles.radioSelectedDot} />}
                      </View>
                      <Text
                        style={[
                          styles.dropdownItemText,
                          isSelected && styles.dropdownItemTextSelected,
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}
