import 'dotenv/config';

export default {
    expo: {
        name: 'LifeSaver - Blood Donation',
        slug: 'lifesaver-blood-donation',
        version: '1.0.0',
        orientation: 'portrait',
        userInterfaceStyle: 'light',
        assetBundlePatterns: ['**/*'],
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.lifesaver.blooddonation',
            config: {
                googleMapsApiKey: process.env.MAPS_API_KEY,
            },
        },
        android: {
            package: 'com.lifesaver.blooddonation',
            permissions: [
                'ACCESS_FINE_LOCATION',
                'ACCESS_COARSE_LOCATION',
                'RECEIVE_BOOT_COMPLETED',
                'VIBRATE',
                'android.permission.ACCESS_COARSE_LOCATION',
                'android.permission.ACCESS_FINE_LOCATION',
                'android.permission.FOREGROUND_SERVICE',
            ],
            config: {
                googleMaps: {
                    apiKey: process.env.MAPS_API_KEY,
                },
            },
        },
        plugins: [
            [
                'expo-location',
                {
                    locationAlwaysAndWhenInUsePermission:
                        'Allow LifeSaver to use your location to find nearby blood camps and donation centers.',
                },
            ],
        ],
        extra: {
            eas: {
                projectId: '87bfa0d5-ff02-473a-bb83-9fcc5e5f5fba',
            },
        },
    },
};

