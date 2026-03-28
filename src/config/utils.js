import { Alert, Platform } from 'react-native';

export const crossAlert = (title, message) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
};

export const crossConfirm = (title, message, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', onPress: onConfirm },
  ]);
};
