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
    Dimensions,
    Linking,
    Modal,
    TextInput,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';
import { calculateDistance } from '../utils/helpers';
import { formatDistance } from '../config/mapConfig';
import { geminiModel, SYSTEM_PROMPT } from '../config/gemini';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Fallback hospital data for Coimbatore region
const FALLBACK_HOSPITALS = [
    { id: 1, name: "Coimbatore Medical College Hospital", lat: 11.0041, lng: 76.9650 },
    { id: 2, name: "PSG Hospitals", lat: 11.0219, lng: 76.9369 },
    { id: 3, name: "Kovai Medical Center", lat: 11.0290, lng: 76.9931 },
    { id: 4, name: "GEM Hospital", lat: 11.0510, lng: 76.9974 },
    { id: 5, name: "KMCH Hospital", lat: 11.0203, lng: 77.0025 },
    { id: 6, name: "Sri Ramakrishna Hospital", lat: 11.0075, lng: 76.9572 },
    { id: 7, name: "Royal Care Super Specialty Hospital", lat: 10.9965, lng: 76.9615 },
    { id: 8, name: "Ganga Hospital", lat: 11.0357, lng: 76.9987 }
];

const HomeScreen = ({ navigation }) => {
    const { userProfile } = useAuth();
    const [location, setLocation] = useState(null);
    const [bloodCamps, setBloodCamps] = useState([]);
    const [emergencyRequests, setEmergencyRequests] = useState([]);
    const [hospitals, setHospitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [loadingHospitals, setLoadingHospitals] = useState(false);

    // Chatbot states
    const [chatModalVisible, setChatModalVisible] = useState(false);
    const [chatMessages, setChatMessages] = useState([
        {
            id: 1,
            text: "Hello! I'm your LifeSaver AI assistant. 🩸\n\nI'm specialized in helping you with:\n\n🏥 Hospital locations and information\n💉 Blood donation eligibility\n🔍 Finding blood donors\n📍 Nearby blood camps\n📱 App features and navigation\n\nPlease ask me anything related to blood donation or hospitals!",
            isBot: true
        }
    ]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    useEffect(() => {
        getCurrentLocation();
        fetchBloodCamps();
        fetchEmergencyRequests();
    }, []);

    useEffect(() => {
        if (location) {
            calculateHospitalDistances();
        }
    }, [location]);

    const getCurrentLocation = async () => {
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Location permission is required to show nearby hospitals');
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: LATITUDE_DELTA,
                longitudeDelta: LONGITUDE_DELTA,
            });
        } catch (error) {
            console.error('Error getting location:', error);
            Alert.alert('Error', 'Failed to get current location');
        }
    };

    const calculateHospitalDistances = () => {
        if (!location) return;

        setLoadingHospitals(true);
        const hospitalsWithDistance = FALLBACK_HOSPITALS.map(hospital => ({
            ...hospital,
            distance: calculateDistance(
                { latitude: location.latitude, longitude: location.longitude },
                { latitude: hospital.lat, longitude: hospital.lng }
            )
        })).sort((a, b) => a.distance - b.distance);

        setHospitals(hospitalsWithDistance);
        setLoadingHospitals(false);
    };

    const openInGoogleMaps = (hospital) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${hospital.lat},${hospital.lng}`;
        Linking.openURL(url).catch(err => {
            Alert.alert('Error', 'Unable to open Google Maps');
            console.error('Error opening maps:', err);
        });
    };

    const fetchBloodCamps = () => {
        const q = query(
            collection(db, 'blood_camps'),
            where('status', '==', 'active'),
            limit(20)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const camps = [];
            querySnapshot.forEach((doc) => {
                const campData = { id: doc.id, ...doc.data() };

                if (location && campData.location) {
                    campData.distance = calculateDistance(
                        { latitude: location.latitude, longitude: location.longitude },
                        { latitude: campData.location.latitude, longitude: campData.location.longitude }
                    );
                }

                camps.push(campData);
            });

            camps.sort((a, b) => {
                if (a.distance && b.distance) {
                    return a.distance - b.distance;
                }
                return 0;
            });

            setBloodCamps(camps);
            setLoading(false);
        });

        return unsubscribe;
    };

    const fetchEmergencyRequests = () => {
        const q = query(
            collection(db, 'blood_requests'),
            where('status', '==', 'active'),
            limit(5)
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const requests = [];
            querySnapshot.forEach((doc) => {
                requests.push({ id: doc.id, ...doc.data() });
            });
            setEmergencyRequests(requests);
        });

        return unsubscribe;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await getCurrentLocation();
        setRefreshing(false);
    };

    // Check if user input is related to blood donation/hospital topics
    const isRelevantQuery = (text) => {
        const relevantKeywords = [
            // Blood related
            'blood', 'donate', 'donation', 'donor', 'transfusion', 'plasma', 'platelets',
            'hemoglobin', 'anemia', 'rbc', 'wbc', 'blood group', 'blood type',
            'a+', 'a-', 'b+', 'b-', 'o+', 'o-', 'ab+', 'ab-',

            // Hospital related
            'hospital', 'clinic', 'medical', 'health', 'doctor', 'nurse',
            'emergency', 'patient', 'treatment', 'diagnosis',

            // Eligibility & Requirements
            'eligible', 'eligibility', 'requirement', 'criteria', 'age', 'weight',
            'healthy', 'qualify', 'can i', 'should i',

            // App features
            'find', 'search', 'locate', 'nearby', 'request', 'camp',
            'register', 'profile', 'notification', 'map', 'tracker',
            'aware', 'information', 'help', 'how', 'what', 'where', 'when', 'who'
        ];

        const lowerText = text.toLowerCase();
        return relevantKeywords.some(keyword => lowerText.includes(keyword));
    };

    // Enhanced Gemini-powered chatbot functions
    const handleChatSend = async () => {
        if (!chatInput.trim()) return;

        const userMessage = {
            id: Date.now(),
            text: chatInput.trim(),
            isBot: false,
            timestamp: new Date()
        };

        setChatMessages(prev => [...prev, userMessage]);
        setChatInput('');
        setIsTyping(true);

        // Check if query is relevant to blood donation/hospital
        if (!isRelevantQuery(userMessage.text)) {
            const restrictedMessage = {
                id: Date.now() + 1,
                text: "I'm specifically designed to help with blood donation and hospital-related queries only. Please ask me about:\n\n🩸 Blood donation and eligibility\n🏥 Nearby hospitals and blood camps\n👤 Finding blood donors\n📱 App features and navigation\n💉 Blood types and requirements\n\nHow can I help you with these topics?",
                isBot: true,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, restrictedMessage]);
            setIsTyping(false);
            return;
        }

        try {
            // Create context about current app state
            const appContext = `
Current app context:
- User: ${userProfile?.fullName || 'Guest'}
- Blood Group: ${userProfile?.bloodGroup || 'Not specified'}
- Nearby Hospitals: ${hospitals.length}
- Active Blood Camps: ${bloodCamps.length}
- Emergency Requests: ${emergencyRequests.length}
- User Location: ${location ? 'Available' : 'Not available'}
            `;

            const prompt = `${SYSTEM_PROMPT}\n\n${appContext}\n\nUser Question: ${userMessage.text}`;

            const result = await geminiModel.generateContent(prompt);
            const response = await result.response;
            const botResponseText = response.text();

            const botMessage = {
                id: Date.now() + 1,
                text: botResponseText,
                isBot: true,
                timestamp: new Date()
            };

            setChatMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error('Gemini API Error:', error);

            // Fallback to simple responses if Gemini fails
            const fallbackResponse = getFallbackResponse(userMessage.text.toLowerCase());
            const botMessage = {
                id: Date.now() + 1,
                text: fallbackResponse,
                isBot: true,
                timestamp: new Date()
            };
            setChatMessages(prev => [...prev, botMessage]);
        } finally {
            setIsTyping(false);
        }
    };

    // Fallback responses if Gemini API fails
    const getFallbackResponse = (userInput) => {
        if (userInput.includes('donate') || userInput.includes('donation')) {
            return "To donate blood, go to the 'Donor' tab and register as a donor. You can also find nearby blood camps in the Home screen!";
        } else if (userInput.includes('blood') && (userInput.includes('find') || userInput.includes('need'))) {
            return "You can find blood donors by going to the 'Find' tab. Enter the blood group and location to see available donors nearby.";
        } else if (userInput.includes('hospital')) {
            return "You can view nearby hospitals in the 'Nearby Hospitals' section on the Home screen, or click 'Map' to see them on the map!";
        } else if (userInput.includes('eligible') || userInput.includes('requirements')) {
            return "To donate blood, you must be:\n• 18-65 years old\n• Weight at least 50kg\n• In good health\n• Wait 3 months between donations";
        } else {
            return "I'm here to help with blood donation queries! Ask me about donating blood, finding donors, nearby hospitals, or blood camps. You can also ask about app features or eligibility requirements.";
        }
    };

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <Text style={styles.greeting}>
                    Hello, {userProfile?.fullName?.split(' ')[0] || 'User'}!
                </Text>
                <Text style={styles.subGreeting}>Ready to save lives today?</Text>
            </View>
            <TouchableOpacity
                style={styles.profileButton}
                onPress={() => navigation.navigate('Profile')}
            >
                <Ionicons name="person-circle-outline" size={32} color={theme.colors.primary} />
            </TouchableOpacity>
        </View>
    );

    const renderQuickStats = () => (
        <View style={styles.statsContainer}>
            <View style={styles.statCard}>
                <Ionicons name="location" size={width * 0.06} color={theme.colors.primary} />
                <Text style={styles.statNumber}>{bloodCamps.length}</Text>
                <Text style={styles.statLabel}>Nearby Camps</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="alert-circle" size={width * 0.06} color={theme.colors.error} />
                <Text style={styles.statNumber}>{emergencyRequests.length}</Text>
                <Text style={styles.statLabel}>Emergency Requests</Text>
            </View>
            <View style={styles.statCard}>
                <Ionicons name="medical" size={width * 0.06} color={theme.colors.success} />
                <Text style={styles.statNumber}>{hospitals.length}</Text>
                <Text style={styles.statLabel}>Nearby Hospitals</Text>
            </View>
        </View>
    );

    const renderNearbyHospitals = () => (
        <View style={styles.hospitalsSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Nearby Hospitals</Text>
                <TouchableOpacity onPress={() => navigation.navigate('MapView')}>
                    <Text style={styles.viewAllText}>View on Map</Text>
                </TouchableOpacity>
            </View>
            {loadingHospitals ? (
                <View style={styles.loadingHospitals}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                    <Text style={styles.loadingHospitalsText}>Finding nearby hospitals...</Text>
                </View>
            ) : hospitals.length === 0 ? (
                <View style={styles.noHospitals}>
                    <Ionicons name="medical-outline" size={48} color={theme.colors.textSecondary} />
                    <Text style={styles.noHospitalsText}>No hospitals found nearby</Text>
                </View>
            ) : (
                hospitals.slice(0, 5).map((hospital) => (
                    <View key={hospital.id} style={styles.hospitalCard}>
                        <View style={styles.hospitalInfo}>
                            <View style={styles.hospitalIconContainer}>
                                <Ionicons name="medical" size={24} color={theme.colors.primary} />
                            </View>
                            <View style={styles.hospitalDetails}>
                                <Text style={styles.hospitalName} numberOfLines={2}>{hospital.name}</Text>
                                <View style={styles.hospitalMeta}>
                                    <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                                    <Text style={styles.hospitalDistance}>
                                        {hospital.distance ? formatDistance(hospital.distance) : 'Calculating...'} away
                                    </Text>
                                </View>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={styles.navigationButton}
                            onPress={() => openInGoogleMaps(hospital)}
                        >
                            <Ionicons name="navigate" size={20} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>
                ))
            )}
        </View>
    );

    const renderEmergencyRequests = () => (
        <View style={styles.emergencySection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Emergency Requests</Text>
                <TouchableOpacity onPress={() => navigation.navigate('FindBlood')}>
                    <Text style={styles.viewAllText}>View All</Text>
                </TouchableOpacity>
            </View>
            {emergencyRequests.map((request) => (
                <TouchableOpacity
                    key={request.id}
                    style={styles.emergencyCard}
                    onPress={() => navigation.navigate('BloodRequestDetail', { requestId: request.id })}
                >
                    <View style={styles.emergencyHeader}>
                        <View style={styles.bloodGroupBadge}>
                            <Text style={styles.bloodGroupText}>{request.bloodGroup}</Text>
                        </View>
                        <Text style={styles.urgentText}>URGENT</Text>
                    </View>
                    <Text style={styles.emergencyTitle}>{request.patientName}</Text>
                    <Text style={styles.emergencyHospital}>{request.hospital}</Text>
                    <Text style={styles.emergencyTime}>
                        Posted {new Date(request.createdAt).toLocaleTimeString()}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderChatModal = () => (
        <Modal
            animationType="slide"
            transparent={true}
            visible={chatModalVisible}
            onRequestClose={() => setChatModalVisible(false)}
        >
            <View style={styles.chatModalOverlay}>
                <View style={styles.chatModalContainer}>
                    <View style={styles.chatHeader}>
                        <View style={styles.chatHeaderLeft}>
                            <View style={styles.chatBotAvatar}>
                                <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.white} />
                            </View>
                            <View>
                                <Text style={styles.chatHeaderTitle}>LifeSaver AI Assistant</Text>
                                <Text style={styles.chatHeaderSubtitle}>Powered by Gemini</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            onPress={() => setChatModalVisible(false)}
                            style={styles.chatCloseButton}
                        >
                            <Ionicons name="close" size={24} color={theme.colors.white} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView
                        style={styles.chatMessagesContainer}
                        ref={ref => { this.scrollView = ref; }}
                        onContentSizeChange={() => this.scrollView?.scrollToEnd({ animated: true })}
                    >
                        {chatMessages.map(message => (
                            <View
                                key={message.id}
                                style={[
                                    styles.chatMessageBubble,
                                    message.isBot ? styles.chatBotBubble : styles.chatUserBubble
                                ]}
                            >
                                {message.isBot && (
                                    <View style={styles.chatBotIcon}>
                                        <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.white} />
                                    </View>
                                )}
                                <View style={[
                                    styles.chatMessageContent,
                                    message.isBot ? styles.chatBotContent : styles.chatUserContent
                                ]}>
                                    <Text style={[
                                        styles.chatMessageText,
                                        message.isBot ? styles.chatBotText : styles.chatUserText
                                    ]}>
                                        {message.text}
                                    </Text>
                                </View>
                            </View>
                        ))}

                        {isTyping && (
                            <View style={[styles.chatMessageBubble, styles.chatBotBubble]}>
                                <View style={styles.chatBotIcon}>
                                    <ActivityIndicator size={16} color={theme.colors.primary} />
                                </View>
                                <View style={[styles.chatMessageContent, styles.chatBotContent]}>
                                    <Text style={styles.chatTypingText}>AI is thinking...</Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.chatInputContainer}
                    >
                        <TextInput
                            style={styles.chatInput}
                            placeholder="Ask me about blood donation..."
                            placeholderTextColor={theme.colors.textSecondary}
                            value={chatInput}
                            onChangeText={setChatInput}
                            onSubmitEditing={handleChatSend}
                            multiline
                            editable={!isTyping}
                        />
                        <TouchableOpacity
                            style={[styles.chatSendButton, isTyping && styles.chatSendButtonDisabled]}
                            onPress={handleChatSend}
                            disabled={isTyping}
                        >
                            <Ionicons
                                name={isTyping ? "hourglass" : "send"}
                                size={20}
                                color={theme.colors.white}
                            />
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView
                style={styles.scrollContainer}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                showsVerticalScrollIndicator={false}
            >
                {renderHeader()}
                {renderQuickStats()}
                {hospitals.length > 0 && renderNearbyHospitals()}
                {emergencyRequests.length > 0 && renderEmergencyRequests()}
            </ScrollView>

            <TouchableOpacity
                style={styles.floatingChatButton}
                onPress={() => setChatModalVisible(true)}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color={theme.colors.white} />
            </TouchableOpacity>

            {renderChatModal()}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.colors.background,
    },
    loadingText: {
        marginTop: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.white,
    },
    headerLeft: {
        flex: 1,
    },
    greeting: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    subGreeting: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    profileButton: {
        padding: theme.spacing.xs,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width * 0.04,
        paddingVertical: theme.spacing.md,
    },
    statCard: {
        flex: 1,
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.md,
        padding: width * 0.03,
        minHeight: width * 0.25,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: width * 0.01,
        ...theme.shadows.small,
    },
    statNumber: {
        fontSize: width * 0.06,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        marginTop: theme.spacing.xs,
    },
    statLabel: {
        fontSize: width * 0.03,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: theme.spacing.xs,
        flexWrap: 'wrap',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: theme.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    sectionTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
    },
    viewAllText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.medium,
    },
    hospitalsSection: {
        backgroundColor: theme.colors.white,
        margin: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.medium,
    },
    loadingHospitals: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    loadingHospitalsText: {
        marginTop: theme.spacing.sm,
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    noHospitals: {
        padding: theme.spacing.xl,
        alignItems: 'center',
    },
    noHospitalsText: {
        marginTop: theme.spacing.sm,
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
    },
    hospitalCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        margin: theme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.primary,
    },
    hospitalInfo: {
        flexDirection: 'row',
        flex: 1,
        marginRight: theme.spacing.sm,
    },
    hospitalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.primaryLight || '#FFE5E9',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    hospitalDetails: {
        flex: 1,
    },
    hospitalName: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    hospitalMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    hospitalDistance: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        marginLeft: 4,
    },
    navigationButton: {
        backgroundColor: theme.colors.primary,
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    emergencySection: {
        backgroundColor: theme.colors.white,
        margin: theme.spacing.lg,
        borderRadius: theme.borderRadius.lg,
        ...theme.shadows.medium,
    },
    emergencyCard: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        margin: theme.spacing.md,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.error,
    },
    emergencyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    bloodGroupBadge: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.sm,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: theme.spacing.xs,
    },
    bloodGroupText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
    },
    urgentText: {
        color: theme.colors.error,
        fontSize: theme.fontSize.xs,
        fontWeight: theme.fontWeight.bold,
    },
    emergencyTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    emergencyHospital: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginBottom: theme.spacing.xs,
    },
    emergencyTime: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
    },
    // Enhanced Chatbot styles
    floatingChatButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.large,
        elevation: 8,
    },
    chatModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    chatModalContainer: {
        backgroundColor: theme.colors.white,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        height: '80%',
        ...theme.shadows.large,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.primary,
        padding: theme.spacing.lg,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    chatHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    chatBotAvatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.sm,
    },
    chatHeaderTitle: {
        fontSize: theme.fontSize.lg,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.white,
    },
    chatHeaderSubtitle: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.white,
        opacity: 0.8,
    },
    chatCloseButton: {
        padding: theme.spacing.xs,
    },
    chatMessagesContainer: {
        flex: 1,
        padding: theme.spacing.lg,
        backgroundColor: theme.colors.background,
    },
    chatMessageBubble: {
        marginBottom: theme.spacing.md,
        flexDirection: 'row',
        alignItems: 'flex-end',
    },
    chatBotBubble: {
        justifyContent: 'flex-start',
    },
    chatUserBubble: {
        justifyContent: 'flex-end',
    },
    chatBotIcon: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: theme.colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.xs,
    },
    chatMessageContent: {
        maxWidth: '75%',
        padding: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
    },
    chatBotContent: {
        backgroundColor: theme.colors.white,
        borderBottomLeftRadius: 4,
        ...theme.shadows.small,
    },
    chatUserContent: {
        backgroundColor: theme.colors.primary,
        borderBottomRightRadius: 4,
    },
    chatMessageText: {
        fontSize: theme.fontSize.md,
        lineHeight: 20,
    },
    chatBotText: {
        color: theme.colors.text,
    },
    chatUserText: {
        color: theme.colors.white,
    },
    chatTypingText: {
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
    },
    chatInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: theme.spacing.md,
        backgroundColor: theme.colors.white,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    chatInput: {
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        maxHeight: 100,
        marginRight: theme.spacing.sm,
    },
    chatSendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: theme.colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...theme.shadows.small,
    },
    chatSendButtonDisabled: {
        backgroundColor: theme.colors.textSecondary,
    },
});

export default HomeScreen;