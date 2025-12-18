import React, { useState, useEffect } from 'react';
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
    Linking,
    ActivityIndicator,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { doc, updateDoc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { checkDonationEligibility } from '../utils/helpers';

const BecomeDonorScreen = ({ navigation }) => {
    const { user, userProfile, updateUserProfile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [donors, setDonors] = useState([]);
    const [loadingDonors, setLoadingDonors] = useState(true);
    const [donorRequests, setDonorRequests] = useState([]); // Track requests sent by patient
    const [incomingRequests, setIncomingRequests] = useState([]); // Track requests received by donor
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [donorData, setDonorData] = useState({
        bloodGroup: userProfile?.bloodGroup || 'A+',
        isAvailable: userProfile?.isAvailable || false,
        weight: userProfile?.weight || '',
        age: userProfile?.age || '',
        medicalConditions: userProfile?.medicalConditions || '',
        lastDonation: userProfile?.lastDonation || '',
        location: userProfile?.location || null,
        emergencyContact: userProfile?.emergencyContact || '',
        preferredDonationTime: userProfile?.preferredDonationTime || 'morning',
    });

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const donationTimes = ['morning', 'afternoon', 'evening', 'anytime'];

    useEffect(() => {
        if (userProfile) {
            setDonorData({
                bloodGroup: userProfile.bloodGroup || 'A+',
                isAvailable: userProfile.isAvailable || false,
                weight: userProfile.weight || '',
                age: userProfile.age || '',
                medicalConditions: userProfile.medicalConditions || '',
                lastDonation: userProfile.lastDonation || '',
                location: userProfile.location || null,
                emergencyContact: userProfile.emergencyContact || '',
                preferredDonationTime: userProfile.preferredDonationTime || 'morning',
            });
        }
    }, [userProfile]);

    useEffect(() => {
        if (userProfile?.role !== 'donor') {
            fetchDonors();
            fetchDonorRequests();
        } else if (userProfile?.role === 'donor') {
            fetchIncomingRequests();
        }
    }, [userProfile]);

    // Fetch requests sent by patient to donors
    const fetchDonorRequests = () => {
        if (!user) return;

        const q = query(
            collection(db, 'donor_requests'),
            where('patientId', '==', user.uid)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requests = [];
            querySnapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            setDonorRequests(requests);
        });

        return unsubscribe;
    };

    // Fetch requests received by donor
    const fetchIncomingRequests = () => {
        if (!user) return;

        const q = query(
            collection(db, 'donor_requests'),
            where('donorId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requests = [];
            querySnapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            setIncomingRequests(requests);
        });

        return unsubscribe;
    };

    const fetchDonors = async () => {
        try {
            setLoadingDonors(true);

            const donorsQuery = query(
                collection(db, 'users'),
                where('role', '==', 'donor'),
                where('isAvailable', '==', true)
            );

            const querySnapshot = await getDocs(donorsQuery);
            const donorsList = [];

            querySnapshot.forEach((doc) => {
                const donorData = { id: doc.id, ...doc.data() };

                // Check if donor is eligible to donate based on last donation date
                const isEligible = checkDonorEligibility(donorData.lastDonation);

                // Only add donor if they are eligible or never donated
                if (isEligible || !donorData.lastDonation) {
                    donorsList.push(donorData);
                }
            });

            setDonors(donorsList);
            setLoadingDonors(false);
        } catch (error) {
            console.error('Error fetching donors:', error);
            setLoadingDonors(false);
            Alert.alert('Error', 'Failed to fetch donors');
        }
    };

    // Helper function to check if donor is eligible to donate
    const checkDonorEligibility = (lastDonationDate) => {
        if (!lastDonationDate) return true; // Never donated, so eligible

        const lastDonation = new Date(lastDonationDate);
        const today = new Date();
        const daysSinceLastDonation = Math.floor((today - lastDonation) / (1000 * 60 * 60 * 24));

        // Must wait at least 56 days (8 weeks) between donations
        return daysSinceLastDonation >= 56;
    };

    // Send blood request to donor
    const handleRequestBlood = async (donor) => {
        try {
            // Check if request already exists
            const existingRequest = donorRequests.find(
                req => req.donorId === donor.id && req.status !== 'rejected'
            );

            if (existingRequest) {
                if (existingRequest.status === 'approved') {
                    Alert.alert('Request Approved', 'This donor has already approved your request. You can now contact them directly.');
                } else {
                    Alert.alert('Request Pending', 'Your request to this donor is still pending approval.');
                }
                return;
            }

            // Create new request
            await addDoc(collection(db, 'donor_requests'), {
                patientId: user.uid,
                patientName: userProfile.fullName,
                patientPhone: userProfile.phone,
                patientBloodGroup: userProfile.bloodGroup || 'Not specified',
                donorId: donor.id,
                donorName: donor.fullName,
                donorPhone: donor.phone,
                donorBloodGroup: donor.bloodGroup,
                status: 'pending',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            Alert.alert('Success', `Your request has been sent to ${donor.fullName}. You'll be notified when they respond.`);
        } catch (error) {
            console.error('Error sending request:', error);
            Alert.alert('Error', 'Failed to send request. Please try again.');
        }
    };

    // Approve donor request
    const handleApproveRequest = async (request) => {
        try {
            const requestRef = doc(db, 'donor_requests', request.id);
            await updateDoc(requestRef, {
                status: 'approved',
                approvedAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });

            Alert.alert('Success', `You have approved the request from ${request.patientName}. They can now contact you.`);
        } catch (error) {
            console.error('Error approving request:', error);
            Alert.alert('Error', 'Failed to approve request');
        }
    };

    // Reject donor request
    const handleRejectRequest = async (request) => {
        Alert.alert(
            'Reject Request',
            `Are you sure you want to reject the request from ${request.patientName}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Reject',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const requestRef = doc(db, 'donor_requests', request.id);
                            await updateDoc(requestRef, {
                                status: 'rejected',
                                rejectedAt: serverTimestamp(),
                                updatedAt: serverTimestamp(),
                            });

                            Alert.alert('Request Rejected', 'The request has been rejected.');
                        } catch (error) {
                            console.error('Error rejecting request:', error);
                            Alert.alert('Error', 'Failed to reject request');
                        }
                    }
                }
            ]
        );
    };

    const handleCallDonor = (donor) => {
        if (!donor.phone) {
            Alert.alert('Error', 'Phone number not available for this donor');
            return;
        }

        Alert.alert(
            'Call Donor',
            `Do you want to call ${donor.fullName}?\n\n${donor.phone}`,
            [
                {
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Call',
                    onPress: () => {
                        const phoneNumber = `tel:${donor.phone}`;
                        Linking.openURL(phoneNumber);
                    }
                }
            ]
        );
    };

    const handleMessageDonor = (donor) => {
        if (!donor.phone) {
            Alert.alert('Error', 'Phone number not available for this donor');
            return;
        }

        const smsUrl = `sms:${donor.phone}`;
        Linking.canOpenURL(smsUrl)
            .then((supported) => {
                if (supported) {
                    return Linking.openURL(smsUrl);
                } else {
                    Alert.alert('Error', 'Unable to send messages on this device');
                }
            })
            .catch((err) => {
                console.error('Error opening messages:', err);
                Alert.alert('Error', 'Failed to open messaging app');
            });
    };

    const handleUpdateLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to update your location');
                return;
            }

            setLoading(true);
            const currentLocation = await Location.getCurrentPositionAsync({});
            const address = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
            });

            const locationData = {
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                city: address[0]?.city || 'Unknown city',
                address: address[0] ? `${address[0].street}, ${address[0].city}` : 'Unknown location',
            };

            setDonorData(prev => ({ ...prev, location: locationData }));
            await updateUserProfile({ location: locationData });
            Alert.alert('Success', 'Location updated successfully');
        } catch (error) {
            console.error('Error updating location:', error);
            Alert.alert('Error', 'Failed to update location');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleAvailability = async (value) => {
        try {
            setDonorData(prev => ({ ...prev, isAvailable: value }));
            await updateUserProfile({ isAvailable: value });
        } catch (error) {
            console.error('Error updating availability:', error);
            Alert.alert('Error', 'Failed to update availability');
        }
    };

    const handleDateChange = (event, date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }

        if (date) {
            setSelectedDate(date);
            setDonorData(prev => ({
                ...prev,
                lastDonation: date.toISOString().split('T')[0]
            }));
        }
    };

    const handleSaveProfile = async () => {
        try {
            setLoading(true);
            await updateUserProfile(donorData);
            setEditModalVisible(false);
            setShowDatePicker(false);
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const calculateNextEligibleDate = () => {
        if (!donorData.lastDonation) return 'Not specified';

        const lastDonationDate = new Date(donorData.lastDonation);
        const nextEligibleDate = new Date(lastDonationDate);
        nextEligibleDate.setDate(lastDonationDate.getDate() + 56); // 8 weeks

        return nextEligibleDate.toLocaleDateString();
    };

    const isEligibleToDonate = () => {
        if (!donorData.lastDonation) return true;

        const lastDonationDate = new Date(donorData.lastDonation);
        const today = new Date();
        const daysDifference = Math.floor((today - lastDonationDate) / (1000 * 60 * 60 * 24));

        return daysDifference >= 56;
    };

    const renderDonorCard = (donor) => {
        // Check if there's an approved request for this donor
        const approvedRequest = donorRequests.find(
            req => req.donorId === donor.id && req.status === 'approved'
        );

        // Check if there's a pending request
        const pendingRequest = donorRequests.find(
            req => req.donorId === donor.id && req.status === 'pending'
        );

        // Check eligibility
        const isEligible = checkDonorEligibility(donor.lastDonation);

        return (
            <View key={donor.id} style={styles.donorCard}>
                <View style={styles.donorCardTop}>
                    <View style={styles.donorBloodBadge}>
                        <Ionicons name="water" size={20} color={theme.colors.white} />
                        <Text style={styles.donorBloodText}>{donor.bloodGroup}</Text>
                    </View>

                    <View style={styles.donorBadges}>
                        {donor.isAvailable && (
                            <View style={styles.availablePill}>
                                <View style={styles.availableDot} />
                                <Text style={styles.availableText}>Available</Text>
                            </View>
                        )}
                        {isEligible && (
                            <View style={styles.eligiblePill}>
                                <Ionicons name="checkmark-circle" size={12} color={theme.colors.success} />
                                <Text style={styles.eligibleText}>Eligible</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.donorMainInfo}>
                    <Text style={styles.donorName}>{donor.fullName}</Text>

                    <View style={styles.donorMetaRow}>
                        {donor.location?.city && (
                            <View style={styles.metaItem}>
                                <Ionicons name="location" size={16} color={theme.colors.primary} />
                                <Text style={styles.metaText}>{donor.location.city}</Text>
                            </View>
                        )}

                        {donor.age && (
                            <View style={styles.metaItem}>
                                <Ionicons name="person" size={16} color={theme.colors.primary} />
                                <Text style={styles.metaText}>{donor.age} years</Text>
                            </View>
                        )}
                    </View>

                    {donor.lastDonation && (
                        <View style={styles.lastDonationContainer}>
                            <Ionicons name="time-outline" size={14} color={theme.colors.textSecondary} />
                            <Text style={styles.lastDonationText}>
                                Last donated: {new Date(donor.lastDonation).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                })}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Show contact options only if request is approved */}
                {approvedRequest ? (
                    <View>
                        <View style={styles.approvedBanner}>
                            <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
                            <Text style={styles.approvedText}>Request Approved - You can now contact</Text>
                        </View>
                        <View style={styles.donorActions}>
                            <TouchableOpacity
                                style={styles.callButton}
                                onPress={() => handleCallDonor(donor)}
                            >
                                <Ionicons name="call" size={20} color={theme.colors.white} />
                                <Text style={styles.callButtonText}>Call Now</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.messageButton}
                                onPress={() => handleMessageDonor(donor)}
                            >
                                <Ionicons name="chatbubble" size={20} color={theme.colors.primary} />
                            </TouchableOpacity>
                        </View>
                    </View>
                ) : pendingRequest ? (
                    <View style={styles.pendingRequestContainer}>
                        <Ionicons name="time-outline" size={20} color={theme.colors.warning} />
                        <Text style={styles.pendingRequestText}>Request Pending Approval</Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.requestButton}
                        onPress={() => handleRequestBlood(donor)}
                    >
                        <Ionicons name="paper-plane" size={20} color={theme.colors.white} />
                        <Text style={styles.requestButtonText}>Request Blood</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    const renderProfileHeader = () => (
        <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
                <View style={styles.bloodGroupBadge}>
                    <Text style={styles.bloodGroupText}>{donorData.bloodGroup}</Text>
                </View>
                <View style={styles.profileDetails}>
                    <Text style={styles.profileName}>{userProfile?.fullName}</Text>
                    <Text style={styles.profileRole}>Blood Donor</Text>
                    <View style={styles.availabilityContainer}>
                        <Text style={styles.availabilityLabel}>Available to Donate</Text>
                        <Switch
                            value={donorData.isAvailable}
                            onValueChange={handleToggleAvailability}
                            trackColor={{ false: theme.colors.border, true: theme.colors.secondary }}
                            thumbColor={donorData.isAvailable ? theme.colors.primary : theme.colors.textSecondary}
                        />
                    </View>
                </View>
            </View>
            <TouchableOpacity
                style={styles.editButton}
                onPress={() => setEditModalVisible(true)}
            >
                <Ionicons name="create-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const renderEligibilityCard = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="calendar" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Donation Eligibility</Text>
            </View>
            <View style={styles.eligibilityContent}>
                <View style={[styles.eligibilityBadge, {
                    backgroundColor: isEligibleToDonate() ? theme.colors.success : theme.colors.warning
                }]}>
                    <Text style={styles.eligibilityText}>
                        {isEligibleToDonate() ? 'ELIGIBLE' : 'NOT ELIGIBLE YET'}
                    </Text>
                </View>
                <Text style={styles.eligibilityDetails}>
                    {isEligibleToDonate()
                        ? 'You can donate blood now!'
                        : `Next eligible date: ${calculateNextEligibleDate()}`
                    }
                </Text>
            </View>
        </View>
    );

    const renderProfileDetails = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="person" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Donor Information</Text>
            </View>
            <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Age</Text>
                    <Text style={styles.detailValue}>{donorData.age || 'Not specified'}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{donorData.weight ? `${donorData.weight} kg` : 'Not specified'}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Last Donation</Text>
                    <Text style={styles.detailValue}>
                        {donorData.lastDonation
                            ? new Date(donorData.lastDonation).toLocaleDateString()
                            : 'Never donated'
                        }
                    </Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Preferred Time</Text>
                    <Text style={styles.detailValue}>
                        {donorData.preferredDonationTime.charAt(0).toUpperCase() + donorData.preferredDonationTime.slice(1)}
                    </Text>
                </View>
            </View>
        </View>
    );

    const renderLocationCard = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="location" size={24} color={theme.colors.primary} />
                <Text style={styles.cardTitle}>Location</Text>
            </View>
            <View style={styles.locationContent}>
                {donorData.location ? (
                    <Text style={styles.locationText}>{donorData.location.address}</Text>
                ) : (
                    <Text style={styles.noLocationText}>No location set</Text>
                )}
                <TouchableOpacity
                    style={styles.updateLocationButton}
                    onPress={handleUpdateLocation}
                    disabled={loading}
                >
                    <Ionicons name="refresh" size={16} color={theme.colors.primary} />
                    <Text style={styles.updateLocationText}>Update Location</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderDonationTips = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="information-circle" size={24} color={theme.colors.info} />
                <Text style={styles.cardTitle}>Donation Tips</Text>
            </View>
            <View style={styles.tipsContainer}>
                <View style={styles.tipItem}>
                    <Ionicons name="water" size={16} color={theme.colors.info} />
                    <Text style={styles.tipText}>Drink plenty of water before donating</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="restaurant" size={16} color={theme.colors.info} />
                    <Text style={styles.tipText}>Eat a healthy meal before donation</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="bed" size={16} color={theme.colors.info} />
                    <Text style={styles.tipText}>Get adequate rest the night before</Text>
                </View>
                <View style={styles.tipItem}>
                    <Ionicons name="close-circle" size={16} color={theme.colors.error} />
                    <Text style={styles.tipText}>Avoid alcohol and smoking before donation</Text>
                </View>
            </View>
        </View>
    );

    const renderIncomingRequests = () => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <Ionicons name="mail" size={24} color={theme.colors.warning} />
                <Text style={styles.cardTitle}>Blood Requests ({incomingRequests.length})</Text>
            </View>

            {incomingRequests.length === 0 ? (
                <View style={styles.noRequestsContainer}>
                    <Ionicons name="mail-open-outline" size={48} color={theme.colors.textSecondary} />
                    <Text style={styles.noRequestsText}>No pending requests</Text>
                </View>
            ) : (
                <View style={styles.requestsList}>
                    {incomingRequests.map((request) => (
                        <View key={request.id} style={styles.requestItem}>
                            <View style={styles.requestHeader}>
                                <View style={styles.requestPatientInfo}>
                                    <Text style={styles.requestPatientName}>{request.patientName}</Text>
                                    <View style={styles.requestMetaRow}>
                                        <Ionicons name="water" size={14} color={theme.colors.primary} />
                                        <Text style={styles.requestMetaText}>{request.patientBloodGroup}</Text>
                                        {request.patientPhone && (
                                            <>
                                                <Ionicons name="call" size={14} color={theme.colors.textSecondary} style={{ marginLeft: 10 }} />
                                                <Text style={styles.requestMetaText}>{request.patientPhone}</Text>
                                            </>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {request.createdAt && (
                                <Text style={styles.requestTime}>
                                    Requested {request.createdAt.toDate().toLocaleDateString()} at {request.createdAt.toDate().toLocaleTimeString()}
                                </Text>
                            )}

                            <View style={styles.requestActions}>
                                <TouchableOpacity
                                    style={styles.approveButton}
                                    onPress={() => handleApproveRequest(request)}
                                >
                                    <Ionicons name="checkmark-circle" size={18} color={theme.colors.white} />
                                    <Text style={styles.approveButtonText}>Approve</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.rejectButton}
                                    onPress={() => handleRejectRequest(request)}
                                >
                                    <Ionicons name="close-circle" size={18} color={theme.colors.error} />
                                    <Text style={styles.rejectButtonText}>Reject</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                </View>
            )}
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
                    <Text style={styles.modalTitle}>Edit Donor Profile</Text>
                    <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                        <Ionicons name="close" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Blood Group</Text>
                        <Picker
                            selectedValue={donorData.bloodGroup}
                            style={styles.picker}
                            onValueChange={(value) => setDonorData(prev => ({ ...prev, bloodGroup: value }))}
                        >
                            {bloodGroups.map(group => (
                                <Picker.Item key={group} label={group} value={group} />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Age</Text>
                        <TextInput
                            style={styles.input}
                            value={donorData.age}
                            onChangeText={(text) => setDonorData(prev => ({ ...prev, age: text }))}
                            placeholder="Your age"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Weight (kg)</Text>
                        <TextInput
                            style={styles.input}
                            value={donorData.weight}
                            onChangeText={(text) => setDonorData(prev => ({ ...prev, weight: text }))}
                            placeholder="Your weight in kg"
                            keyboardType="numeric"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Last Donation Date</Text>
                        <TouchableOpacity
                            style={styles.datePickerButton}
                            onPress={() => setShowDatePicker(true)}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                            <Text style={styles.datePickerText}>
                                {donorData.lastDonation || 'Select Date'}
                            </Text>
                        </TouchableOpacity>

                        {showDatePicker && (
                            <DateTimePicker
                                value={donorData.lastDonation ? new Date(donorData.lastDonation) : selectedDate}
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
                        <Text style={styles.inputLabel}>Emergency Contact</Text>
                        <TextInput
                            style={styles.input}
                            value={donorData.emergencyContact}
                            onChangeText={(text) => setDonorData(prev => ({ ...prev, emergencyContact: text }))}
                            placeholder="Emergency contact number"
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Preferred Donation Time</Text>
                        <Picker
                            selectedValue={donorData.preferredDonationTime}
                            style={styles.picker}
                            onValueChange={(value) => setDonorData(prev => ({ ...prev, preferredDonationTime: value }))}
                        >
                            {donationTimes.map(time => (
                                <Picker.Item
                                    key={time}
                                    label={time.charAt(0).toUpperCase() + time.slice(1)}
                                    value={time}
                                />
                            ))}
                        </Picker>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Medical Conditions (if any)</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={donorData.medicalConditions}
                            onChangeText={(text) => setDonorData(prev => ({ ...prev, medicalConditions: text }))}
                            placeholder="Any medical conditions or medications..."
                            multiline
                            numberOfLines={3}
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
                        disabled={loading}
                    >
                        <Text style={styles.saveButtonText}>Save Changes</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );

    // Non-donor view (for patients and NGOs)
    if (userProfile?.role !== 'donor') {
        return (
            <View style={styles.container}>
                <ScrollView
                    style={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Beautiful Header */}
                    <View style={styles.heroSection}>
                        <View style={styles.heroIconContainer}>
                            <Ionicons name="heart" size={40} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.heroTitle}>Available Blood Donors</Text>
                        <Text style={styles.heroSubtitle}>
                            Connect with verified donors ready to save lives
                        </Text>
                    </View>

                    {/* Stats Card */}
                    <View style={styles.statsCard}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>{donors.length}</Text>
                            <Text style={styles.statLabel}>Donors</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {donors.filter(d => d.isAvailable).length}
                            </Text>
                            <Text style={styles.statLabel}>Available</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>
                                {new Set(donors.map(d => d.bloodGroup)).size}
                            </Text>
                            <Text style={styles.statLabel}>Blood Types</Text>
                        </View>
                    </View>

                    {/* Donors List */}
                    {loadingDonors ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={theme.colors.primary} />
                            <Text style={styles.loadingText}>Finding donors...</Text>
                        </View>
                    ) : donors.length === 0 ? (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconContainer}>
                                <Ionicons name="people-outline" size={80} color={theme.colors.textSecondary} />
                            </View>
                            <Text style={styles.emptyTitle}>No Eligible Donors Available</Text>
                            <Text style={styles.emptySubtitle}>
                                There are no available and eligible donors at the moment. Donors must wait at least 56 days (8 weeks) between donations. Please check back later.
                            </Text>
                            <TouchableOpacity
                                style={styles.refreshButton}
                                onPress={fetchDonors}
                            >
                                <Ionicons name="refresh" size={20} color={theme.colors.white} />
                                <Text style={styles.refreshButtonText}>Refresh List</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.donorsSection}>
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>
                                    {donors.length} Donor{donors.length !== 1 ? 's' : ''} Ready to Help
                                </Text>
                                <TouchableOpacity onPress={fetchDonors}>
                                    <Ionicons name="refresh-circle" size={28} color={theme.colors.primary} />
                                </TouchableOpacity>
                            </View>
                            {donors.map(renderDonorCard)}
                        </View>
                    )}
                </ScrollView>
            </View>
        );
    }

    // Donor view
    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {renderProfileHeader()}
                {incomingRequests.length > 0 && renderIncomingRequests()}
                {renderEligibilityCard()}
                {renderProfileDetails()}
                {renderLocationCard()}
                {renderDonationTips()}
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
        padding: theme.spacing.md,
    },

    // Donor Profile Styles
    profileHeader: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: 20,
        ...theme.shadows.medium,
    },
    profileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bloodGroupBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.round,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    bloodGroupText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
    },
    profileDetails: {
        flex: 1,
    },
    profileName: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    profileRole: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.sm,
    },
    availabilityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    availabilityLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
    },
    editButton: {
        position: 'absolute',
        top: theme.spacing.md,
        right: theme.spacing.md,
        padding: theme.spacing.xs,
    },
    card: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: 25,
        ...theme.shadows.medium,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    cardTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
    },
    eligibilityContent: {
        alignItems: 'center',
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
    eligibilityDetails: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        textAlign: 'center',
    },
    detailsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    detailItem: {
        width: '48%',
        marginBottom: theme.spacing.md,
    },
    detailLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    detailValue: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        fontWeight: theme.fontWeight.medium,
    },
    locationContent: {
        alignItems: 'center',
    },
    locationText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    noLocationText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.md,
    },
    updateLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
    },
    updateLocationText: {
        color: theme.colors.primary,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    tipsContainer: {
        marginTop: theme.spacing.sm,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    tipText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
        flex: 1,
    },

    // Modal Styles
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

    // Non-Donor View (Beautiful UI)
    heroSection: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xl,
        marginBottom: theme.spacing.lg,
        alignItems: 'center',
        ...theme.shadows.medium,
    },
    heroIconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: `${theme.colors.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    heroTitle: {
        fontSize: 26,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    heroSubtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
    },
    statsCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statNumber: {
        fontSize: 32,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeight.medium,
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: theme.colors.border,
    },
    donorsSection: {
        marginBottom: theme.spacing.xl,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.xs,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    donorCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.medium,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    donorCardTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
    },
    donorBloodBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.round,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        gap: 6,
    },
    donorBloodText: {
        color: theme.colors.white,
        fontSize: 18,
        fontWeight: theme.fontWeight.bold,
        letterSpacing: 0.5,
    },
    donorBadges: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    availablePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.round,
        gap: 4,
    },
    availableDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: theme.colors.success,
    },
    availableText: {
        fontSize: 10,
        color: theme.colors.success,
        fontWeight: theme.fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    eligiblePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 4,
        borderRadius: theme.borderRadius.round,
        gap: 4,
    },
    eligibleText: {
        fontSize: 10,
        color: theme.colors.info || '#2196F3',
        fontWeight: theme.fontWeight.bold,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    donorMainInfo: {
        marginBottom: theme.spacing.md,
    },
    donorName: {
        fontSize: 20,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
    },
    donorMetaRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        marginBottom: theme.spacing.xs,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeight.medium,
    },
    lastDonationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: theme.spacing.xs,
    },
    lastDonationText: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    donorActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
    },
    callButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        ...theme.shadows.small,
    },
    callButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },
    messageButton: {
        width: 50,
        height: 50,
        backgroundColor: `${theme.colors.primary}15`,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: `${theme.colors.primary}30`,
    },
    loadingContainer: {
        padding: theme.spacing.xxl,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
        fontWeight: theme.fontWeight.medium,
    },
    emptyState: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.xl,
        padding: theme.spacing.xxl,
        alignItems: 'center',
        ...theme.shadows.small,
    },
    emptyIconContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: theme.spacing.lg,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.sm,
        textAlign: 'center',
    },
    emptySubtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: theme.spacing.xl,
        paddingHorizontal: theme.spacing.md,
    },
    refreshButton: {
        flexDirection: 'row',
        backgroundColor: theme.colors.primary,
        paddingHorizontal: theme.spacing.xl,
        paddingVertical: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        alignItems: 'center',
        gap: 8,
        ...theme.shadows.small,
    },
    refreshButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },

    // Request Button Styles
    requestButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.sm,
        gap: 8,
        ...theme.shadows.small,
    },
    requestButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },

    // Pending Request Styles
    pendingRequestContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${theme.colors.warning}15`,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        marginTop: theme.spacing.sm,
        borderWidth: 1,
        borderColor: theme.colors.warning,
        gap: 8,
    },
    pendingRequestText: {
        color: theme.colors.warning,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },

    // Approved Banner Styles
    approvedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${theme.colors.success}15`,
        borderRadius: theme.borderRadius.sm,
        paddingVertical: theme.spacing.sm,
        marginTop: theme.spacing.sm,
        marginBottom: theme.spacing.sm,
        gap: 6,
    },
    approvedText: {
        color: theme.colors.success,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.semibold,
    },

    // Incoming Requests Styles
    noRequestsContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.xl,
    },
    noRequestsText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.md,
    },
    requestsList: {
        marginTop: theme.spacing.sm,
    },
    requestItem: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.warning,
    },
    requestHeader: {
        marginBottom: theme.spacing.sm,
    },
    requestPatientInfo: {
        flex: 1,
    },
    requestPatientName: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    requestMetaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexWrap: 'wrap',
    },
    requestMetaText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontWeight: theme.fontWeight.medium,
    },
    requestTime: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.md,
        fontStyle: 'italic',
    },
    requestActions: {
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginTop: theme.spacing.sm,
    },
    approveButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: theme.colors.success,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        ...theme.shadows.small,
    },
    approveButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
    },
    rejectButton: {
        flex: 1,
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        paddingVertical: theme.spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: theme.colors.error,
        ...theme.shadows.small,
    },
    rejectButtonText: {
        color: theme.colors.error,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.bold,
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

// Re-export the helper function for convenience
export { checkDonationEligibility };
export default BecomeDonorScreen;