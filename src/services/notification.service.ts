import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Configure notification behavior when notification is received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  async registerForPushNotifications(): Promise<string | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions denied by user.');
        return null;
      }

      const tokenData = await Notifications.getExpoPushTokenAsync();
      return tokenData.data;
    } catch (err) {
      console.warn('Failed getting Expo Push Token:', err);
      return null;
    }
  },

  async scheduleLocalNotification(title: string, body: string, data?: Record<string, any>) {
    if (Platform.OS === 'web') return;
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data,
        },
        trigger: null, // trigger immediately
      });
    } catch (err) {
      console.error('Error scheduling local notification:', err);
    }
  },
};
