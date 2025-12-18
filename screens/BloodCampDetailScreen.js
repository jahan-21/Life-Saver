import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Linking,
    Share,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';

const BloodCampDetailScreen = ({ route, navigation }) => {
    const { campId } = route.params;
    const { user, userProfile } = useAuth();
    const [camp, setCamp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isRegistered, setIsRegistered] = useState(false);

    useEffect(() => {
        fetchCampDetails();
    }, [campId]);

    const fetchCampDetails = async () => {
        try {
            const campDoc = await getDoc(doc(db, 'blood_camps', campId));
            if (campDoc.exists()) {
                const campData = { id: campDoc.id, ...campDoc.data() };
                setCamp(campData);
                setIsRegistered(campData.registeredDonors?.includes(user.uid) || false);
            } else {
                Alert.alert('Error', 'Blood camp not found');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching camp details:', error);
            Alert.alert('Error', 'Failed to load camp details');
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterForCamp = async () => {
        try {
            const campRef = doc(db, 'blood_camps', campId);

            if (isRegistered) {
                // Unregister
                await updateDoc(campRef, {
                    registeredDonors: arrayRemove(user.uid),
                    registrationCount: camp.registrationCount - 1,
                });
                setIsRegistered(false);
                Alert.alert('Success', 'You have been unregistered from this blood camp');
            } else {
                // Register
                await updateDoc(campRef, {
                    registeredDonors: arrayUnion(user.uid),
                    registrationCount: (camp.registrationCount || 0) + 1,
                });
                setIsRegistered(true);
                Alert.alert('Success', 'You have been registered for this blood camp');
            }

            // Refresh camp data
            fetchCampDetails();
        } catch (error) {
            console.error('Error registering for camp:', error);
            Alert.alert('Error', 'Failed to register for blood camp');
        }
    };

    const handleGetDirections = () => {
        if (camp?.location) {
            const url = `https://www.google.com/maps/dir/?api=1&destination=${camp.location.latitude},${camp.location.longitude}`;
            Linking.openURL(url);
        }
    };

    const handleCallOrganizer = () => {
        if (camp?.contactNumber) {
            Linking.openURL(`tel:${camp.contactNumber}`);
        }
    };

    const handleShareCamp = async () => {
        try {
            await Share.share({
                message: `Join the blood donation camp at ${camp.name}!\n\nDate: ${new Date(camp.date).toLocaleDateString()}\nTime: ${camp.startTime} - ${camp.endTime}\nLocation: ${camp.address}\n\nDownload LifeSaver app to save lives!`,
                title: 'Blood Donation Camp',
            });
        } catch (error) {
            console.error('Error sharing camp:', error);
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Blood Camp Details</Text>
            <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareCamp}
            >
                <Ionicons name="share-outline" size={24} color={theme.colors.white} />
            </TouchableOpacity>
        </View>
    );

    const renderCampInfo = () => (
        <View style={styles.campInfoCard}>
            <Text style={styles.campName}>{camp.name}</Text>
            <Text style={styles.organizer}>Organized by {camp.organizer}</Text>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Date</Text>
                        <Text style={styles.infoValue}>
                            {new Date(camp.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="time" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Time</Text>
                        <Text style={styles.infoValue}>{camp.startTime} - {camp.endTime}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="location" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Location</Text>
                        <Text style={styles.infoValue}>{camp.address}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="people" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Registered</Text>
                        <Text style={styles.infoValue}>
                            {camp.registrationCount || 0} donors
                        </Text>
                    </View>
                </View>

                {camp.contactNumber && (
                    <View style={styles.infoItem}>
                        <Ionicons name="call" size={20} color={theme.colors.primary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Contact</Text>
                            <Text style={styles.infoValue}>{camp.contactNumber}</Text>
                        </View>
                    </View>
                )}
            </View>

            {camp.description && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>About this Camp</Text>
                    <Text style={styles.description}>{camp.description}</Text>
                </View>
            )}
        </View>
    );

    const renderMap = () => (
        <View style={styles.mapCard}>
            <Text style={styles.mapTitle}>Location</Text>
            {camp.location && (
                <MapView
                    provider={PROVIDER_DEFAULT}
                    style={styles.map}
                    initialRegion={{
                        latitude: camp.location.latitude,
                        longitude: camp.location.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    }}
                    mapType="standard"
                >
                    <Marker
                        coordinate={{
                            latitude: camp.location.latitude,
                            longitude: camp.location.longitude,
                        }}
                        title={camp.name}
                        description={camp.address}
                    />
                </MapView>
            )}
        </View>
    );

    const renderRequirements = () => (
        <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Donation Requirements</Text>
            <View style={styles.requirementsList}>
                <View style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Age between 18-65 years</Text>
                </View>
                <View style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Weight minimum 50kg</Text>
                </View>
                <View style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Good health condition</Text>
                </View>
                <View style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.requirementText}>Valid ID proof</Text>
                </View>
                <View style={styles.requirementItem}>
                    <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                    <Text style={styles.requirementText}>No recent illness or medication</Text>
                </View>
            </View>
        </View>
    );

    const renderActionButtons = () => (
        <View style={styles.actionButtons}>
            <TouchableOpacity
                style={styles.directionsButton}
                onPress={handleGetDirections}
            >
                <Ionicons name="navigate" size={20} color={theme.colors.primary} />
                <Text style={styles.directionsButtonText}>Get Directions</Text>
            </TouchableOpacity>

            {camp.contactNumber && (
                <TouchableOpacity
                    style={styles.callButton}
                    onPress={handleCallOrganizer}
                >
                    <Ionicons name="call" size={20} color={theme.colors.success} />
                    <Text style={styles.callButtonText}>Call Organizer</Text>
                </TouchableOpacity>
            )}

            {userProfile?.role === 'donor' && (
                <TouchableOpacity
                    style={[
                        styles.registerButton,
                        { backgroundColor: isRegistered ? theme.colors.warning : theme.colors.primary }
                    ]}
                    onPress={handleRegisterForCamp}
                >
                    <Ionicons
                        name={isRegistered ? "checkmark" : "add"}
                        size={20}
                        color={theme.colors.white}
                    />
                    <Text style={styles.registerButtonText}>
                        {isRegistered ? 'Registered' : 'Register'}
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );

    if (loading || !camp) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading camp details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {renderCampInfo()}
                {renderMap()}
                {renderRequirements()}
            </ScrollView>
            {renderActionButtons()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: theme.colors.primary,
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: theme.spacing.lg,
    },
    backButton: {
        padding: theme.spacing.xs,
    },
    headerTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.white,
        flex: 1,
        textAlign: 'center',
    },
    shareButton: {
        padding: theme.spacing.xs,
    },
    scrollContainer: {
        flex: 1,
        padding: theme.spacing.md,
    },
    campInfoCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
    },
    campName: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    organizer: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.lg,
    },
    infoGrid: {
        gap: theme.spacing.lg,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    infoContent: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    infoLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    infoValue: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.medium,
        marginTop: theme.spacing.xs,
    },
    descriptionContainer: {
        marginTop: theme.spacing.lg,
        paddingTop: theme.spacing.lg,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    descriptionTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    description: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    mapCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
    },
    mapTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    map: {
        height: 200,
        borderRadius: theme.borderRadius.md,
    },
    requirementsCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
    },
    requirementsTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    requirementsList: {
        gap: theme.spacing.sm,
    },
    requirementItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    requirementText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        gap: theme.spacing.sm,
    },
    directionsButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.primary,
    },
    directionsButtonText: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.success,
    },
    callButtonText: {
        color: theme.colors.success,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    registerButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
    },
    registerButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        marginLeft: theme.spacing.xs,
    },
});

export default BloodCampDetailScreen;
