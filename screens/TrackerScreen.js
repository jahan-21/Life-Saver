import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
    collection,
    query,
    where,
    onSnapshot,
    orderBy,
    addDoc,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';

const TrackerScreen = () => {
    const { user, userProfile } = useAuth();
    const [donations, setDonations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [addDonationVisible, setAddDonationVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [newDonation, setNewDonation] = useState({
        date: new Date().toISOString().split('T')[0],
        location: '',
        units: '1',
        type: 'whole_blood',
        organization: '',
        notes: '',
    });

    const donationTypes = [
        { label: 'Whole Blood', value: 'whole_blood' },
        { label: 'Platelets', value: 'platelets' },
        { label: 'Plasma', value: 'plasma' },
        { label: 'Red Blood Cells', value: 'red_cells' },
    ];

    useEffect(() => {
        if (user) {
            fetchDonations();
        }
    }, [user]);

    const fetchDonations = () => {
        const q = query(
            collection(db, 'donations'),
            where('donorId', '==', user.uid),
            orderBy('date', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const donationsList = [];
            querySnapshot.forEach((doc) => {
                donationsList.push({ id: doc.id, ...doc.data() });
            });
            setDonations(donationsList);
            setLoading(false);
        });

        return unsubscribe;
    };

    const handleDateChange = (event, date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (date) {
            setSelectedDate(date);
            setNewDonation(prev => ({
                ...prev,
                date: date.toISOString().split('T')[0]
            }));
        }
    };

    const handleAddDonation = async () => {
        if (!newDonation.date || !newDonation.location) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const donationData = {
                ...newDonation,
                donorId: user.uid,
                donorName: userProfile.fullName,
                donorBloodGroup: userProfile.bloodGroup,
                createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'donations'), donationData);

            setAddDonationVisible(false);
            setShowDatePicker(false);
            setSelectedDate(new Date());
            setNewDonation({
                date: new Date().toISOString().split('T')[0],
                location: '',
                units: '1',
                type: 'whole_blood',
                organization: '',
                notes: '',
            });

            Alert.alert('Success', 'Donation record added successfully');
        } catch (error) {
            console.error('Error adding donation:', error);
            Alert.alert('Error', 'Failed to add donation record');
        }
    };

    const calculateNextEligibleDate = () => {
        if (donations.length === 0) return new Date();

        const lastDonation = donations[0];
        const lastDonationDate = new Date(lastDonation.date);
        const nextEligibleDate = new Date(lastDonationDate);

        // Different intervals for different donation types
        switch (lastDonation.type) {
            case 'whole_blood':
                nextEligibleDate.setDate(lastDonationDate.getDate() + 56); // 8 weeks
                break;
            case 'platelets':
                nextEligibleDate.setDate(lastDonationDate.getDate() + 7); // 1 week
                break;
            case 'plasma':
                nextEligibleDate.setDate(lastDonationDate.getDate() + 28); // 4 weeks
                break;
            default:
                nextEligibleDate.setDate(lastDonationDate.getDate() + 56);
        }

        return nextEligibleDate;
    };

    const isEligibleToDonate = () => {
        const nextEligibleDate = calculateNextEligibleDate();
        return new Date() >= nextEligibleDate;
    };

    const getDaysSinceLastDonation = () => {
        if (donations.length === 0) return null;

        const lastDonationDate = new Date(donations[0].date);
        const today = new Date();
        const daysDifference = Math.floor((today - lastDonationDate) / (1000 * 60 * 60 * 24));

        return daysDifference;
    };

    const renderStatsCard = () => {
        const totalDonations = donations.length;
        const totalUnits = donations.reduce((sum, donation) => sum + parseInt(donation.units || 0), 0);
        const livesImpacted = totalUnits * 2; // Estimate 3 lives per unit
        const daysSinceLast = getDaysSinceLastDonation();

        return (
            <View style={styles.statsCard}>
                <Text style={styles.statsTitle}>Your Impact</Text>
                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{totalDonations}</Text>
                        <Text style={styles.statLabel}>Total Donations</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{totalUnits}</Text>
                        <Text style={styles.statLabel}>Units Donated</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{livesImpacted}</Text>
                        <Text style={styles.statLabel}>Lives Impacted</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{daysSinceLast || 0}</Text>
                        <Text style={styles.statLabel}>Days Since Last</Text>
                    </View>
                </View>
            </View>
        );
    };

    const renderEligibilityCard = () => {
        const nextEligibleDate = calculateNextEligibleDate();
        const eligible = isEligibleToDonate();

        return (
            <View style={styles.eligibilityCard}>
                <View style={styles.eligibilityHeader}>
                    <Ionicons
                        name={eligible ? "checkmark-circle" : "time"}
                        size={24}
                        color={eligible ? theme.colors.success : theme.colors.warning}
                    />
                    <Text style={styles.eligibilityTitle}>Donation Eligibility</Text>
                </View>
                <View style={[styles.eligibilityBadge, {
                    backgroundColor: eligible ? theme.colors.success : theme.colors.warning
                }]}>
                    <Text style={styles.eligibilityText}>
                        {eligible ? 'ELIGIBLE TO DONATE' : 'NOT ELIGIBLE YET'}
                    </Text>
                </View>
                {!eligible && (
                    <Text style={styles.nextEligibleText}>
                        Next eligible date: {nextEligibleDate.toLocaleDateString()}
                    </Text>
                )}
            </View>
        );
    };

    const renderDonationHistory = () => (
        <View style={styles.historyCard}>
            <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Donation History</Text>
                <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => setAddDonationVisible(true)}
                >
                    <Ionicons name="add" size={20} color={theme.colors.white} />
                    <Text style={styles.addButtonText}>Add</Text>
                </TouchableOpacity>
            </View>

            {donations.length === 0 ? (
                <View style={styles.emptyHistory}>
                    <Ionicons name="heart-outline" size={48} color={theme.colors.textSecondary} />
                    <Text style={styles.emptyTitle}>No Donations Yet</Text>
                    <Text style={styles.emptySubtitle}>
                        Start your journey by recording your first donation
                    </Text>
                </View>
            ) : (
                <ScrollView style={styles.donationsList} showsVerticalScrollIndicator={false}>
                    {donations.map((donation, index) => (
                        <View key={donation.id} style={styles.donationItem}>
                            <View style={styles.donationHeader}>
                                <View style={styles.donationDate}>
                                    <Text style={styles.donationDateText}>
                                        {new Date(donation.date).toLocaleDateString()}
                                    </Text>
                                    <Text style={styles.donationType}>
                                        {donationTypes.find(t => t.value === donation.type)?.label || donation.type}
                                    </Text>
                                </View>
                                <View style={styles.donationUnits}>
                                    <Text style={styles.unitsText}>{donation.units}</Text>
                                    <Text style={styles.unitsLabel}>units</Text>
                                </View>
                            </View>

                            <Text style={styles.donationLocation}>
                                <Ionicons name="location" size={14} color={theme.colors.textSecondary} />
                                {' '}{donation.location}
                            </Text>

                            {donation.organization && (
                                <Text style={styles.donationOrg}>
                                    <Ionicons name="business" size={14} color={theme.colors.textSecondary} />
                                    {' '}{donation.organization}
                                </Text>
                            )}

                            {donation.notes && (
                                <Text style={styles.donationNotes}>{donation.notes}</Text>
                            )}
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderAddDonationModal = () => (
        <Modal
            visible={addDonationVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Add Donation Record</Text>
                    <TouchableOpacity onPress={() => setAddDonationVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Donation Date *</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.datePickerText}>
                                {newDonation.date || 'Select Date'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                maximumDate={new Date()}
                            />
                        )}

                        {Platform.OS === 'ios' && showDatePicker && (
                            <TouchableOpacity
                                style={styles.datePickerDoneButton}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <Text style={styles.datePickerDoneText}>Done</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Donation Type</Text>
                        <Picker
                            selectedValue={newDonation.type}
                            style={styles.picker}
                            onValueChange={(value) => setNewDonation(prev => ({ ...prev, type: value }))}
                        >
                            {donationTypes.map(type => (
                                <Picker.Item key={type.value} label={type.label} value={type.value} />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Units Donated</Text>
                        <TextInput
                            style={styles.input}
                            value={newDonation.units}
                            onChangeText={(text) => setNewDonation(prev => ({ ...prev, units: text }))}
                            placeholder="Number of units"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Location *</Text>
                        <TextInput
                            style={styles.input}
                            value={newDonation.location}
                            onChangeText={(text) => setNewDonation(prev => ({ ...prev, location: text }))}
                            placeholder="Hospital/Blood bank name and location"
                            multiline
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Organization</Text>
                        <TextInput
                            style={styles.input}
                            value={newDonation.organization}
                            onChangeText={(text) => setNewDonation(prev => ({ ...prev, organization: text }))}
                            placeholder="Organizing body (optional)"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Notes</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={newDonation.notes}
                            onChangeText={(text) => setNewDonation(prev => ({ ...prev, notes: text }))}
                            placeholder="Any additional notes..."
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setAddDonationVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleAddDonation}
                    >
                        <Text style={styles.saveButtonText}>Add Donation</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading donation history...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {renderStatsCard()}
                {renderEligibilityCard()}
                {renderDonationHistory()}
            </ScrollView>
            {renderAddDonationModal()}
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
        padding: theme.spacing.md,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    statsCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
    },
    statsTitle: {
        marginTop: 20,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    statNumber: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
    },
    statLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
    eligibilityCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    eligibilityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    eligibilityTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    eligibilityBadge: {
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
    },
    eligibilityText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
    },
    nextEligibleText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        textAlign: 'center',
    },
    historyCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.medium,
    },
    historyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    historyTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    addButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    emptyHistory: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },
    emptyTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginTop: theme.spacing.md,
    },
    emptySubtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
    },
    donationsList: {
        maxHeight: 400,
    },
    donationItem: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    donationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    donationDate: {
        flex: 1,
    },
    donationDateText: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    donationType: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    donationUnits: {
        alignItems: 'center',
    },
    unitsText: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
    },
    unitsLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    donationLocation: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    donationOrg: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    donationNotes: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        fontStyle: 'italic',
        marginTop: theme.spacing.xs,
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
    textArea: {
        height: 80,
        textAlignVertical: 'top',
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
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        borderWidth: 1,
        borderColor: theme.colors.border,
        gap: 10,
    },
    datePickerText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        flex: 1,
    },
    datePickerDoneButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.lg,
        alignItems: 'center',
        marginTop: theme.spacing.sm,
    },
    datePickerDoneText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
});

export default TrackerScreen;
