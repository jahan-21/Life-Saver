import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

// Configure notification behavior
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
    }),
});

const NotificationContext = createContext();

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [expoPushToken, setExpoPushToken] = useState('');
    const [notification, setNotification] = useState(false);

    useEffect(() => {
        async function registerForPushNotificationsAsync() {
            // Skip push token registration for now
            return null;
            
            // ... rest of the code stays but won't execute
        }

        // Listen for incoming notifications
        const notificationListener = Notifications.addNotificationReceivedListener(notification => {
            setNotification(notification);
        });

        // Listen for notification interactions
        const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
            // Handle notification tap here
        });

        return () => {
            Notifications.removeNotificationSubscription(notificationListener);
            Notifications.removeNotificationSubscription(responseListener);
        };
    }, [user]);

    const updateUserPushToken = async (token) => {
        try {
            if (user) {
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    pushToken: token,
                    updatedAt: new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error('Error updating push token:', error);
        }
    };

    const sendLocalNotification = async (title, body, data = {}) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: null, // Send immediately
        });
    };

    const scheduleNotification = async (title, body, trigger, data = {}) => {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger,
        });
    };

    const value = {
        expoPushToken,
        notification,
        sendLocalNotification,
        scheduleNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

async function registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#DC143C',
        });
    }

    if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;

        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            alert('Failed to get push token for push notification!');
            return;
        }

        // try {
        //     token = (await Notifications.getExpoPushTokenAsync({
        //         projectId: Constants.expoConfig?.extra?.eas?.projectId ?? 'lifesaver-blood-donation',
        //     })).data;
        // } catch (error) {
        //     console.error('Error getting push token:', error);
        // }
    }

    return token;
}
