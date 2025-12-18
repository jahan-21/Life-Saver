import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

// Import Firebase config
import { auth, db } from './config/firebase';
import { theme } from './config/theme';

// Import screens
import AuthScreen from './screens/AuthScreen';
import HomeScreen from './screens/HomeScreen';
import FindBloodScreen from './screens/FindBloodScreen';
import BecomeDonorScreen from './screens/BecomeDonorScreen';
import TrackerScreen from './screens/TrackerScreen';
import AwarenessScreen from './screens/AwarenessScreen';
import ProfileScreen from './screens/ProfileScreen';
import BloodCampDetailScreen from './screens/BloodCampDetailScreen';
import BloodRequestDetailScreen from './screens/BloodRequestDetailScreen';
import MapViewScreen from './screens/MapViewScreen';

// Import context
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function HomeStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.white,
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="HomeMain"
                component={HomeScreen}
                options={{ title: 'LifeSaver' }}
            />
            <Stack.Screen
                name="BloodCampDetail"
                component={BloodCampDetailScreen}
                options={{ title: 'Blood Camp Details' }}
            />
            <Stack.Screen
                name="BloodRequestDetail"
                component={BloodRequestDetailScreen}
                options={{ title: 'Blood Request Details' }}
            />
            <Stack.Screen
                name="MapView"
                component={MapViewScreen}
                options={{ title: 'Hospital Map' }}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ title: 'Profile' }}
            />
        </Stack.Navigator>
    );
}
function FindBloodStack() {
    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: { backgroundColor: theme.colors.primary },
                headerTintColor: theme.colors.white,
                headerTitleStyle: { fontWeight: 'bold' },
            }}
        >
            <Stack.Screen
                name="FindBloodMain"
                component={FindBloodScreen}
                options={{ title: 'Find Blood' }}
            />
            <Stack.Screen
                name="BloodRequestDetail"
                component={BloodRequestDetailScreen}
                options={{ title: 'Blood Request Details' }}
            />
        </Stack.Navigator>
    );
}

function MainTabs() {
    const { userProfile } = useAuth();
    const isDonor = userProfile?.role === 'donor';

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Map') {
                        iconName = focused ? 'map' : 'map-outline';
                    } else if (route.name === 'FindBlood') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'BecomeDonor') {
                        iconName = focused ? 'heart' : 'heart-outline';
                    } else if (route.name === 'Tracker') {
                        iconName = focused ? 'analytics' : 'analytics-outline';
                    }
                    else if (route.name === 'Awareness') {
                        iconName = focused ? 'bulb' : 'bulb-outline';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: theme.colors.textSecondary,
                tabBarStyle: {
                    backgroundColor: theme.colors.white,
                    borderTopColor: theme.colors.border,
                    paddingBottom: 5,
                    height: 60,
                },
                tabBarLabelStyle: {
                    fontSize: 11,
                },
                headerShown: false,
            })}
        >
            <Tab.Screen name="Home" component={HomeStack} />
            <Tab.Screen name="Map" component={MapViewScreen} options={{ title: 'Map' }} />
            <Tab.Screen name="FindBlood" component={FindBloodStack} options={{ title: 'Find Blood' }} />
            <Tab.Screen name="BecomeDonor" component={BecomeDonorScreen} options={{ title: 'Donor' }} />
            {/* Only show Tracker tab for donors */}
            {isDonor && (
                <Tab.Screen name="Tracker" component={TrackerScreen} />
            )}
            <Tab.Screen name="Awareness" component={AwarenessScreen} />
        </Tab.Navigator>
    );
}

function AppContent() {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            {user ? <MainTabs /> : <AuthScreen />}
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <StatusBar style="light" backgroundColor={theme.colors.primary} />
                <AppContent />
            </NotificationProvider>
        </AuthProvider>
    );
}
