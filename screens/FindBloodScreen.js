import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    RefreshControl,
    Modal,
    TextInput,
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
    updateDoc,
    doc,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { theme } from '../config/theme';
import { checkDonationEligibility } from '../utils/helpers';

const FindBloodScreen = ({ navigation }) => {
    const { user, userProfile } = useAuth();
    const { sendLocalNotification } = useNotification();
    const [bloodRequests, setBloodRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filterVisible, setFilterVisible] = useState(false);
    const [createRequestVisible, setCreateRequestVisible] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [filters, setFilters] = useState({
        bloodGroup: 'all',
        priority: 'all',
        location: 'all',
    });
    const [newRequest, setNewRequest] = useState({
        patientName: '',
        bloodGroup: 'A+',
        unitsNeeded: '1',
        priority: 'normal',
        hospital: '',
        contactNumber: '',
        description: '',
        requiredDate: new Date().toISOString().split('T')[0],
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const priorities = ['normal', 'urgent', 'emergency'];

    useEffect(() => {
        fetchBloodRequests();
    }, [filters]);

    const fetchBloodRequests = () => {
        // Build query constraints array
        const constraints = [
            where('status', '==', 'active')
        ];

        // Apply filters
        if (filters.bloodGroup !== 'all') {
            constraints.push(where('bloodGroup', '==', filters.bloodGroup));
        }
        if (filters.priority !== 'all') {
            constraints.push(where('priority', '==', filters.priority));
        }

        // Add limit at the end
        constraints.push(limit(50));

        // Build the query with all constraints
        const q = query(collection(db, 'blood_requests'), ...constraints);

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requests = [];
            querySnapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            setBloodRequests(requests);
            setLoading(false);
        });

        return unsubscribe;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // Refetch data
        setRefreshing(false);
    };

    const handleDateChange = (event, date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (date) {
            setSelectedDate(date);
            setNewRequest(prev => ({
                ...prev,
                requiredDate: date.toISOString().split('T')[0]
            }));
        }
    };

    const handleCreateRequest = async () => {
        if (!newRequest.patientName || !newRequest.hospital || !newRequest.contactNumber) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const requestData = {
                ...newRequest,
                createdBy: user.uid,
                creatorName: userProfile.fullName,
                status: 'active',
                responses: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await addDoc(collection(db, 'blood_requests'), requestData);

            // Send notification to compatible donors
            sendLocalNotification(
                'New Blood Request',
                `${newRequest.bloodGroup} blood needed for ${newRequest.patientName}`
            );

            setCreateRequestVisible(false);
            setShowDatePicker(false);
            setSelectedDate(new Date());
            setNewRequest({
                patientName: '',
                bloodGroup: 'A+',
                unitsNeeded: '1',
                priority: 'normal',
                hospital: '',
                contactNumber: '',
                description: '',
                requiredDate: new Date().toISOString().split('T')[0],
            });

            Alert.alert('Success', 'Blood request created successfully');
        } catch (error) {
            console.error('Error creating request:', error);
            Alert.alert('Error', 'Failed to create blood request');
        }
    };

    const handleDonorResponse = async (requestId) => {
        try {
            const requestRef = doc(db, 'blood_requests', requestId);
            await updateDoc(requestRef, {
                responses: bloodRequests.find(r => r.id === requestId)?.responses + 1 || 1,
                updatedAt: serverTimestamp(),
            });

            // Add donor response to subcollection
            await addDoc(collection(db, 'blood_requests', requestId, 'responses'), {
                donorId: user.uid,
                donorName: userProfile.fullName,
                donorPhone: userProfile.phone,
                donorBloodGroup: userProfile.bloodGroup,
                respondedAt: serverTimestamp(),
                status: 'pending',
            });

            Alert.alert('Success', 'Your response has been sent to the requester');
        } catch (error) {
            console.error('Error responding to request:', error);
            Alert.alert('Error', 'Failed to send response');
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'emergency': return theme.colors.error;
            case 'urgent': return theme.colors.warning;
            default: return theme.colors.warning;
        }
    };

    const getPriorityText = (priority) => {
        return priority.toUpperCase();
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.headerButton}
                onPress={() => setFilterVisible(true)}
            >
                <Ionicons name="filter" size={22} color={theme.colors.white} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.headerButton, styles.addButton]}
                onPress={() => setCreateRequestVisible(true)}
            >
                <Ionicons name="add" size={22} color={theme.colors.white} />
            </TouchableOpacity>
        </View>
    );

    const renderBloodRequestCard = (request) => (
        <TouchableOpacity
            key={request.id}
            style={styles.requestCard}
            onPress={() => navigation.navigate('BloodRequestDetail', { requestId: request.id })}
            activeOpacity={0.7}
        >
            {/* Top Section with Blood Group and Priority */}
            <View style={styles.requestCardTop}>
                <View style={styles.bloodGroupContainer}>
                    <View style={styles.bloodGroupBadge}>
                        <Ionicons name="water" size={24} color={theme.colors.white} />
                        <Text style={styles.bloodGroupText}>{request.bloodGroup}</Text>
                    </View>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                    <Ionicons name="alert-circle" size={14} color={theme.colors.white} />
                    <Text style={styles.priorityText}>{getPriorityText(request.priority)}</Text>
                </View>
            </View>

            {/* Patient Information */}
            <View style={styles.patientSection}>
                <Text style={styles.patientName}>{request.patientName}</Text>
                <Text style={styles.requestedBy}>Requested by {request.creatorName}</Text>
            </View>

            {/* Details Section */}
            <View style={styles.detailsSection}>
                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons name="location" size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.detailText} numberOfLines={1}>{request.hospital}</Text>
                </View>

                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons name="water-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.detailText}>{request.unitsNeeded}</Text>
                </View>

                <View style={styles.detailItem}>
                    <View style={styles.detailIconContainer}>
                        <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <Text style={styles.detailText}>
                        {new Date(request.requiredDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                        })}
                    </Text>
                </View>
            </View>


            {/* Donor Action Button */}
            {userProfile?.role === 'donor' &&
                userProfile?.bloodGroup === request.bloodGroup &&
                checkDonationEligibility(userProfile)?.isEligible && (
                    <TouchableOpacity
                        style={styles.respondButton}
                        onPress={(e) => {
                            e.stopPropagation();
                            handleDonorResponse(request.id);
                        }}
                        activeOpacity={0.8}
                    >
                        <Ionicons name="heart" size={18} color={theme.colors.white} />
                        <Text style={styles.respondButtonText}>I Can Donate</Text>
                    </TouchableOpacity>
                )}
        </TouchableOpacity>
    );

    const renderFilterModal = () => (
        <Modal
            visible={filterVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Filter Requests</Text>
                    <TouchableOpacity onPress={() => setFilterVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent}>
                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Blood Group</Text>
                        <Picker
                            selectedValue={filters.bloodGroup}
                            style={styles.picker}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, bloodGroup: value }))}
                        >
                            <Picker.Item label="All Blood Groups" value="all" />
                            {bloodGroups.map(group => (
                                <Picker.Item key={group} label={group} value={group} />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.filterSection}>
                        <Text style={styles.filterLabel}>Priority</Text>
                        <Picker
                            selectedValue={filters.priority}
                            style={styles.picker}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                        >
                            <Picker.Item label="All Priorities" value="all" />
                            <Picker.Item label="Normal" value="normal" />
                            <Picker.Item label="Urgent" value="urgent" />
                            <Picker.Item label="Emergency" value="emergency" />
                        </Picker>
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.resetButton}
                        onPress={() => setFilters({ bloodGroup: 'all', priority: 'all', location: 'all' })}
                    >
                        <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.applyButton}
                        onPress={() => setFilterVisible(false)}
                    >
                        <Text style={styles.applyButtonText}>Apply Filters</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderCreateRequestModal = () => (
        <Modal
            visible={createRequestVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Create Blood Request</Text>
                    <TouchableOpacity onPress={() => setCreateRequestVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Patient Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={newRequest.patientName}
                            onChangeText={(text) => setNewRequest(prev => ({ ...prev, patientName: text }))}
                            placeholder="Enter patient name"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Blood Group *</Text>
                        <Picker
                            selectedValue={newRequest.bloodGroup}
                            style={styles.picker}
                            onValueChange={(value) => setNewRequest(prev => ({ ...prev, bloodGroup: value }))}
                        >
                            {bloodGroups.map(group => (
                                <Picker.Item key={group} label={group} value={group} />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Units Needed *</Text>
                        <TextInput
                            style={styles.input}
                            value={newRequest.unitsNeeded}
                            onChangeText={(text) => setNewRequest(prev => ({ ...prev, unitsNeeded: text }))}
                            placeholder="Number of units"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Priority</Text>
                        <Picker
                            selectedValue={newRequest.priority}
                            style={styles.picker}
                            onValueChange={(value) => setNewRequest(prev => ({ ...prev, priority: value }))}
                        >
                            <Picker.Item label="Normal" value="normal" />
                            <Picker.Item label="Urgent" value="urgent" />
                            <Picker.Item label="Emergency" value="emergency" />
                        </Picker>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Hospital/Location *</Text>
                        <TextInput
                            style={styles.input}
                            value={newRequest.hospital}
                            onChangeText={(text) => setNewRequest(prev => ({ ...prev, hospital: text }))}
                            placeholder="Hospital name and address"
                            multiline
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Contact Number *</Text>
                        <TextInput
                            style={styles.input}
                            value={newRequest.contactNumber}
                            onChangeText={(text) => setNewRequest(prev => ({ ...prev, contactNumber: text }))}
                            placeholder="Contact number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Required Date *</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.datePickerText}>
                                {newRequest.requiredDate ? new Date(newRequest.requiredDate).toLocaleDateString() : 'Select Date'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={newRequest.requiredDate ? new Date(newRequest.requiredDate) : selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                onChange={handleDateChange}
                                minimumDate={new Date()}
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
                        <Text style={styles.inputLabel}>Additional Details</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={newRequest.description}
                            onChangeText={(text) => setNewRequest(prev => ({ ...prev, description: text }))}
                            placeholder="Any additional information..."
                            multiline
                            numberOfLines={3}
                        />
                    </View>
                </ScrollView>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setCreateRequestVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.createButton}
                        onPress={handleCreateRequest}
                    >
                        <Text style={styles.createButtonText}>Create Request</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading blood requests...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}

            <ScrollView
                style={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {bloodRequests.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Ionicons name="search" size={64} color={theme.colors.textSecondary} />
                        <Text style={styles.emptyTitle}>No Blood Requests Found</Text>
                        <Text style={styles.emptySubtitle}>
                            Try adjusting your filters or create a new request
                        </Text>
                    </View>
                ) : (
                    bloodRequests.map(renderBloodRequestCard)
                )}
            </ScrollView>

            {renderFilterModal()}
            {renderCreateRequestModal()}
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
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        backgroundColor: theme.colors.white,
        paddingTop: 50,
        paddingBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        gap: 12,
        ...theme.shadows.small,
        elevation: 2,
    },
    headerButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
        elevation: 3,
    },
    addButton: {
        backgroundColor: theme.colors.success,
    },
    scrollContainer: {
        flex: 1,
        padding: theme.spacing.md,
    },
    requestCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
        elevation: 3,
        borderLeftWidth: 5,
        borderLeftColor: theme.colors.primary,
    },
    requestCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    bloodGroupContainer: {
        flex: 1,
    },
    bloodGroupBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.round,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        alignSelf: 'flex-start',
        gap: 6,
    },
    bloodGroupText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: 0.5,
    },
    priorityBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: theme.borderRadius.round,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: 6,
        gap: 4,
    },
    priorityText: {
        color: theme.colors.white,
        fontSize: 11,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: 0.5,
    },
    patientSection: {
        marginBottom: theme.spacing.md,
        paddingBottom: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    patientName: {
        fontSize: 20,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: 4,
    },
    requestedBy: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    detailsSection: {
        marginBottom: theme.spacing.md,
        gap: theme.spacing.sm,
    },
    detailItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailIconContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: `${theme.colors.primary}10`,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    detailText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        flex: 1,
        fontWeight: theme.fontWeight.medium,
    },
    descriptionSection: {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
    },
    description: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    requestFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: theme.spacing.sm,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        marginBottom: theme.spacing.sm,
    },
    footerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeAgo: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    responseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${theme.colors.primary}10`,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.round,
        gap: 4,
    },
    responseCount: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.bold,
    },
    respondButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.sm,
        ...theme.shadows.small,
        elevation: 2,
        gap: 8,
    },
    respondButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: theme.spacing.xxl,
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
    filterSection: {
        marginBottom: theme.spacing.lg,
    },
    filterLabel: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    picker: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
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
    modalActions: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    resetButton: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        marginRight: theme.spacing.sm,
        alignItems: 'center',
    },
    resetButtonText: {
        color: theme.colors.text,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
    },
    applyButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        alignItems: 'center',
    },
    applyButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
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
    createButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        alignItems: 'center',
    },
    createButtonText: {
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

export default FindBloodScreen;
