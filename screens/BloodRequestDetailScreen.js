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
    Modal,
    TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
    doc,
    getDoc,
    collection,
    addDoc,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { checkDonationEligibility } from '../utils/helpers';

const BloodRequestDetailScreen = ({ route, navigation }) => {
    const { requestId } = route.params;
    const { user, userProfile } = useAuth();
    const [request, setRequest] = useState(null);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [responseModalVisible, setResponseModalVisible] = useState(false);
    const [responseMessage, setResponseMessage] = useState('');

    useEffect(() => {
        fetchRequestDetails();
        fetchResponses();
    }, [requestId]);

    const fetchRequestDetails = async () => {
        try {
            const requestDoc = await getDoc(doc(db, 'blood_requests', requestId));
            if (requestDoc.exists()) {
                setRequest({ id: requestDoc.id, ...requestDoc.data() });
            } else {
                Alert.alert('Error', 'Blood request not found');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error fetching request details:', error);
            Alert.alert('Error', 'Failed to load request details');
        } finally {
            setLoading(false);
        }
    };

    const fetchResponses = () => {
        const q = query(
            collection(db, 'blood_requests', requestId, 'responses'),
            where('status', 'in', ['pending', 'accepted'])
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const responsesList = [];
            querySnapshot.forEach((doc) => {
                responsesList.push({ id: doc.id, ...doc.data() });
            });
            setResponses(responsesList);
        });

        return unsubscribe;
    };

    const handleRespondToRequest = async () => {
        if (!userProfile || userProfile.role !== 'donor') {
            Alert.alert('Access Denied', 'Only registered donors can respond to blood requests');
            return;
        }

        if (userProfile.bloodGroup !== request.bloodGroup) {
            Alert.alert('Blood Group Mismatch', `This request is for ${request.bloodGroup} blood group, but you are ${userProfile.bloodGroup}`);
            return;
        }

        try {
            await addDoc(collection(db, 'blood_requests', requestId, 'responses'), {
                donorId: user.uid,
                donorName: userProfile.fullName,
                donorPhone: userProfile.phone,
                donorBloodGroup: userProfile.bloodGroup,
                message: responseMessage,
                respondedAt: serverTimestamp(),
                status: 'pending',
            });

            setResponseModalVisible(false);
            setResponseMessage('');
            Alert.alert('Success', 'Your response has been sent to the requester');
        } catch (error) {
            console.error('Error responding to request:', error);
            Alert.alert('Error', 'Failed to send response');
        }
    };

    const handleCallRequester = () => {
        if (request?.contactNumber) {
            Linking.openURL(`tel:${request.contactNumber}`);
        }
    };

    const handleShareRequest = async () => {
        try {
            await Share.share({
                message: `Urgent Blood Request!\n\nPatient: ${request.patientName}\nBlood Group: ${request.bloodGroup}\nUnits Needed: ${request.unitsNeeded}\nHospital: ${request.hospital}\nRequired Date: ${new Date(request.requiredDate).toLocaleDateString()}\n\nPlease help if you can donate. Download LifeSaver app to help save lives!`,
                title: 'Blood Request - Help Save a Life',
            });
        } catch (error) {
            console.error('Error sharing request:', error);
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'emergency': return theme.colors.error;
            case 'urgent': return theme.colors.warning;
            default: return theme.colors.success;
        }
    };

    const getPriorityText = (priority) => {
        return priority.toUpperCase();
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={theme.colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Blood Request</Text>
            <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareRequest}
            >
                <Ionicons name="share-outline" size={24} color={theme.colors.white} />
            </TouchableOpacity>
        </View>
    );

    const renderRequestInfo = () => (
        <View style={styles.requestInfoCard}>
            <View style={styles.requestHeader}>
                <View style={styles.bloodGroupBadge}>
                    <Text style={styles.bloodGroupText}>{request.bloodGroup}</Text>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(request.priority) }]}>
                    <Text style={styles.priorityText}>{getPriorityText(request.priority)}</Text>
                </View>
            </View>

            <Text style={styles.patientName}>{request.patientName}</Text>
            <Text style={styles.createdBy}>Requested by {request.creatorName}</Text>

            <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                    <Ionicons name="water" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Units Needed</Text>
                        <Text style={styles.infoValue}>{request.unitsNeeded} units</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="calendar" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Required Date</Text>
                        <Text style={styles.infoValue}>
                            {new Date(request.requiredDate).toLocaleDateString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="location" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Hospital</Text>
                        <Text style={styles.infoValue}>{request.hospital}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="call" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Contact</Text>
                        <Text style={styles.infoValue}>{request.contactNumber}</Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="time" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Posted</Text>
                        <Text style={styles.infoValue}>
                            {request.createdAt?.toDate().toLocaleString()}
                        </Text>
                    </View>
                </View>

                <View style={styles.infoItem}>
                    <Ionicons name="people" size={20} color={theme.colors.primary} />
                    <View style={styles.infoContent}>
                        <Text style={styles.infoLabel}>Responses</Text>
                        <Text style={styles.infoValue}>{responses.length} donors responded</Text>
                    </View>
                </View>
            </View>

            {request.description && (
                <View style={styles.descriptionContainer}>
                    <Text style={styles.descriptionTitle}>Additional Details</Text>
                    <Text style={styles.description}>{request.description}</Text>
                </View>
            )}
        </View>
    );

    const renderResponses = () => (
        <View style={styles.responsesCard}>
            <Text style={styles.responsesTitle}>Donor Responses ({responses.length})</Text>

            {responses.length === 0 ? (
                <View style={styles.noResponsesContainer}>
                    <Ionicons name="people-outline" size={48} color={theme.colors.textSecondary} />
                    <Text style={styles.noResponsesText}>No donors have responded yet</Text>
                    <Text style={styles.noResponsesSubtext}>Share this request to reach more donors</Text>
                </View>
            ) : (
                <ScrollView style={styles.responsesList} showsVerticalScrollIndicator={false}>
                    {responses.map((response) => (
                        <View key={response.id} style={styles.responseItem}>
                            <View style={styles.responseHeader}>
                                <View style={styles.donorInfo}>
                                    <Text style={styles.donorName}>{response.donorName}</Text>
                                    <Text style={styles.donorBloodGroup}>{response.donorBloodGroup}</Text>
                                </View>
                                <View style={[styles.statusBadge, { backgroundColor: theme.colors.success }]}>
                                    <Text style={styles.statusText}>Available</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => Linking.openURL(`tel:${response.donorPhone}`)}> 
                                <Text style={styles.donorPhone}>
                                    <Ionicons name="call" size={14} color={theme.colors.textSecondary} />
                                    {' '}{response.donorPhone}
                                </Text>
                            </TouchableOpacity>

                            {response.message && (
                                <Text style={styles.responseMessage}>{response.message}</Text>
                            )}

                            <Text style={styles.responseTime}>
                                Responded {response.respondedAt?.toDate().toLocaleString()}
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            )}
        </View>
    );

    const renderResponseModal = () => (
        <Modal
            visible={responseModalVisible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Respond to Blood Request</Text>
                    <TouchableOpacity onPress={() => setResponseModalVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    <View style={styles.donorInfoDisplay}>
                        <Text style={styles.donorInfoTitle}>Your Information</Text>
                        <Text style={styles.donorInfoText}>Name: {userProfile?.fullName}</Text>
                        <Text style={styles.donorInfoText}>Blood Group: {userProfile?.bloodGroup}</Text>
                        <Text style={styles.donorInfoText}>Phone: {userProfile?.phone}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Message (Optional)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={responseMessage}
                            onChangeText={setResponseMessage}
                            placeholder="Any additional information or message for the requester..."
                            multiline
                            numberOfLines={4}
                        />
                    </View>

                    <Text style={styles.disclaimer}>
                        By responding, your contact information will be shared with the requester.
                    </Text>
                </View>

                <View style={styles.modalActions}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => setResponseModalVisible(false)}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.respondButton}
                        onPress={handleRespondToRequest}
                    >
                        <Text style={styles.respondButtonText}>Send Response</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    const renderActionButtons = () => (
        <View style={styles.actionButtons}>
            {userProfile?.fullName !== request?.creatorName && (
                <TouchableOpacity
                    style={styles.callButton}
                    onPress={handleCallRequester}
                >
                    <Ionicons name="call" size={20} color={theme.colors.success} />
                    <Text style={styles.callButtonText}>Call Requester</Text>
                </TouchableOpacity>
            )}
    
            {checkDonationEligibility(userProfile)?.isEligible && userProfile?.role === 'donor' && 
             userProfile?.bloodGroup === request?.bloodGroup && 
             userProfile?.fullName !== request?.creatorName && (
                <TouchableOpacity
                    style={styles.donateButton}
                    onPress={() => setResponseModalVisible(true)}
                >
                    <Ionicons name="heart" size={20} color={theme.colors.white} />
                    <Text style={styles.donateButtonText}>I Can Donate</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    
    if (loading || !request) {
        return (
            <View style={styles.loadingContainer}>
                <Text>Loading request details...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {renderHeader()}
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {renderRequestInfo()}
                {renderResponses()}
            </ScrollView>
            {renderActionButtons()}
            {renderResponseModal()}
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
    requestInfoCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    bloodGroupBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    bloodGroupText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },
    priorityBadge: {
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    priorityText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
    },
    patientName: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    createdBy: {
        fontSize: theme.fontSize.sm,
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
    responsesCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
    },
    responsesTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.md,
    },
    noResponsesContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },
    noResponsesText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        marginTop: theme.spacing.md,
    },
    noResponsesSubtext: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    responsesList: {
        maxHeight: 300,
    },
    responseItem: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
    },
    responseHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    donorInfo: {
        flex: 1,
    },
    donorName: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    donorBloodGroup: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.medium,
    },
    statusBadge: {
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    statusText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
    },
    donorPhone: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    responseMessage: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        fontStyle: 'italic',
        marginBottom: theme.spacing.sm,
    },
    responseTime: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    actionButtons: {
        flexDirection: 'row',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
        gap: theme.spacing.sm,
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
    donateButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
    },
    donateButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        marginLeft: theme.spacing.xs,
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
    donorInfoDisplay: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    donorInfoTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    donorInfoText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
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
        height: 100,
        textAlignVertical: 'top',
    },
    disclaimer: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
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
    respondButton: {
        flex: 1,
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        marginLeft: theme.spacing.sm,
        alignItems: 'center',
    },
    respondButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
});

export default BloodRequestDetailScreen;
