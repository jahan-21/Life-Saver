import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    Switch,
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';

const ProfileScreen = ({ navigation }) => {
    const { user, userProfile, logout, updateUserProfile } = useAuth();
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [notificationSettings, setNotificationSettings] = useState({
        emergencyRequests: true,
        nearbyBloodCamps: true,
        donationReminders: true,
        generalUpdates: false,
    });
    const [editData, setEditData] = useState({
        fullName: userProfile?.fullName || '',
        phone: userProfile?.phone || '',
        bloodGroup: userProfile?.bloodGroup || 'A+',
        emergencyContact: userProfile?.emergencyContact || '',
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to logout?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        const result = await logout();
                        if (!result.success) {
                            Alert.alert('Error', 'Failed to logout');
                        }
                    }
                },
            ]
        );
    };

    const handleSaveProfile = async () => {
        try {
            await updateUserProfile(editData);
            setEditModalVisible(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            Alert.alert('Error', 'Failed to update profile');
        }
    };

    const handleNotificationToggle = (setting, value) => {
        setNotificationSettings(prev => ({ ...prev, [setting]: value }));
        // Here you would typically save to Firebase or AsyncStorage
    };

    const renderProfileHeader = () => (
        <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                        {userProfile?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                    </Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor() }]}>
                    <Text style={styles.roleText}>{userProfile?.role?.toUpperCase()}</Text>
                </View>
            </View>
            <View style={styles.profileInfo}>
                <Text style={styles.profileName}>{userProfile?.fullName}</Text>
                <Text style={styles.profileEmail}>{user?.email}</Text>
                {userProfile?.bloodGroup && (
                    <View style={styles.bloodGroupContainer}>
                        <Ionicons name="water" size={16} color={theme.colors.primary} />
                        <Text style={styles.bloodGroupText}>{userProfile.bloodGroup}</Text>
                    </View>
                )}
            </View>
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditModalVisible(true)}
            >
                <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const getRoleColor = () => {
        switch (userProfile?.role) {
            case 'donor': return theme.colors.success;
            case 'patient': return theme.colors.info;
            case 'ngo': return theme.colors.warning;
            default: return theme.colors.textSecondary;
        }
    };

    const renderPersonalInfo = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Ionicons name="person" size={20} color={theme.colors.textSecondary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Full Name</Text>
                        <Text style={styles.infoValue}>{userProfile?.fullName || 'Not set'}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="call" size={20} color={theme.colors.textSecondary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Phone</Text>
                        <Text style={styles.infoValue}>{userProfile?.phone || 'Not set'}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="mail" size={20} color={theme.colors.textSecondary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{user?.email}</Text>
                    </View>
                </View>

                {userProfile?.emergencyContact && (
                    <View style={styles.infoItem}>
                        <Ionicons name="medical" size={20} color={theme.colors.textSecondary} />
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Emergency Contact</Text>
                            <Text style={styles.infoValue}>{userProfile.emergencyContact}</Text>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );

    const renderNotificationSettings = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Preferences</Text>
            <View style={styles.settingsList}>
                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="alert-circle" size={20} color={theme.colors.error} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingLabel}>Emergency Blood Requests</Text>
                            <Text style={styles.settingDescription}>Get notified for urgent blood requests</Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationSettings.emergencyRequests}
                        onValueChange={(value) => handleNotificationToggle('emergencyRequests', value)}
                        trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                        thumbColor={notificationSettings.emergencyRequests ? theme.colors.primary : theme.colors.textSecondary}
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="location" size={20} color={theme.colors.info} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingLabel}>Nearby Blood Camps</Text>
                            <Text style={styles.settingDescription}>Get notified about blood camps near you</Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationSettings.nearbyBloodCamps}
                        onValueChange={(value) => handleNotificationToggle('nearbyBloodCamps', value)}
                        trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                        thumbColor={notificationSettings.nearbyBloodCamps ? theme.colors.primary : theme.colors.textSecondary}
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="time" size={20} color={theme.colors.success} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingLabel}>Donation Reminders</Text>
                            <Text style={styles.settingDescription}>Reminders when you're eligible to donate</Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationSettings.donationReminders}
                        onValueChange={(value) => handleNotificationToggle('donationReminders', value)}
                        trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                        thumbColor={notificationSettings.donationReminders ? theme.colors.primary : theme.colors.textSecondary}
                    />
                </View>

                <View style={styles.settingItem}>
                    <View style={styles.settingInfo}>
                        <Ionicons name="information-circle" size={20} color={theme.colors.textSecondary} />
                        <View style={styles.settingContent}>
                            <Text style={styles.settingLabel}>General Updates</Text>
                            <Text style={styles.settingDescription}>News and updates about blood donation</Text>
                        </View>
                    </View>
                    <Switch
                        value={notificationSettings.generalUpdates}
                        onValueChange={(value) => handleNotificationToggle('generalUpdates', value)}
                        trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                        thumbColor={notificationSettings.generalUpdates ? theme.colors.primary : theme.colors.textSecondary}
                    />
                </View>
            </View>
        </View>
    );

    const renderQuickActions = () => (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsList}>
                <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="help-circle" size={20} color={theme.colors.info} />
                    <Text style={styles.actionText}>Help & Support</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="document-text" size={20} color={theme.colors.info} />
                    <Text style={styles.actionText}>Privacy Policy</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
                    <Text style={styles.actionText}>Terms of Service</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="star" size={20} color={theme.colors.warning} />
                    <Text style={styles.actionText}>Rate the App</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionItem}>
                    <Ionicons name="share" size={20} color={theme.colors.primary} />
                    <Text style={styles.actionText}>Share LifeSaver</Text>
                    <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEditModal = () => (
        <Modal
            visible={editModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Edit Profile</Text>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Full Name</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.fullName}
                            onChangeText={(text) => setEditData(prev => ({ ...prev, fullName: text }))}
                            placeholder="Enter your full name"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.phone}
                            onChangeText={(text) => setEditData(prev => ({ ...prev, phone: text }))}
                            placeholder="Enter your phone number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    {userProfile?.role === 'donor' && (
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Blood Group</Text>
                            <Picker
                                selectedValue={editData.bloodGroup}
                                style={styles.picker}
                                onValueChange={(value) => setEditData(prev => ({ ...prev, bloodGroup: value }))}
                            >
                                {bloodGroups.map(group => (
                                    <Picker.Item key={group} label={group} value={group} />
                                ))}
                            </Picker>
                        </View>
                    )}

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Emergency Contact</Text>
                        <TextInput
                            style={styles.input}
                            value={editData.emergencyContact}
                            onChangeText={(text) => setEditData(prev => ({ ...prev, emergencyContact: text }))}
                            placeholder="Emergency contact number"
                            keyboardType="phone-pad"
                        />
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setEditModalVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSaveProfile}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {renderProfileHeader()}
                {renderPersonalInfo()}
                {renderNotificationSettings()}
                {renderQuickActions()}

                <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                    <Ionicons name="log-out" size={20} color={theme.colors.white} />
                    <Text style={styles.logoutButtonText}>Logout</Text>
                </TouchableOpacity>
            </ScrollView>

            {renderEditModal()}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContainer: {
        flex: 1,
    },
    profileHeader: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        flexDirection: 'row',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: theme.spacing.md,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.white,
    },
    roleBadge: {
        position: 'absolute',
        bottom: -5,
        right: -5,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.xs,
        paddingVertical: 2,
    },
    roleText: {
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.white,
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    profileEmail: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    bloodGroupContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    bloodGroupText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.semibold,
        marginLeft: theme.spacing.xs,
    },
    editButton: {
        padding: theme.spacing.sm,
    },
    section: {
        backgroundColor: theme.colors.white,
        marginTop: theme.spacing.md,
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
    },
    infoGrid: {
        gap: theme.spacing.lg,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
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
    settingsList: {
        gap: theme.spacing.lg,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    settingInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    settingContent: {
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    settingLabel: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.medium,
    },
    settingDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    actionsList: {
        gap: theme.spacing.md,
    },
    actionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    actionText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        marginLeft: theme.spacing.md,
        flex: 1,
    },
    logoutButton: {
        backgroundColor: theme.colors.error,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    logoutButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        marginLeft: theme.spacing.sm,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    modalTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    modalContent: {
        flex: 1,
        padding: theme.spacing.lg,
    },
    inputContainer: {
        marginBottom: theme.spacing.lg,
    },
    inputLabel: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    input: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    picker: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
    },
    modalActions: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        marginRight: theme.spacing.sm,
        alignItems: 'center',
    },
    cancelButtonText: {
        color: theme.colors.text,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
    },
    saveButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        alignItems: 'center',
    },
    saveButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
});

export default ProfileScreen;
