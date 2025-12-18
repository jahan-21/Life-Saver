import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useAuth } from '../context/AuthContext';
import { theme } from '../config/theme';

const AuthScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        phone: '',
        role: 'donor',
        bloodGroup: 'A+',
        organizationName: '',
        organizationType: 'hospital',
    });

    const { login, register } = useAuth();

    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    const organizationTypes = ['hospital', 'ngo', 'blood_bank'];

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!formData.email || !formData.password) {
            Alert.alert('Error', 'Email and password are required');
            return false;
        }

        if (!isLogin) {
            if (formData.password !== formData.confirmPassword) {
                Alert.alert('Error', 'Passwords do not match');
                return false;
            }

            if (!formData.fullName || !formData.phone) {
                Alert.alert('Error', 'Full name and phone are required');
                return false;
            }

            if (formData.role === 'ngo' && !formData.organizationName) {
                Alert.alert('Error', 'Organization name is required for NGO registration');
                return false;
            }
        }

        return true;
    };

    const handleAuth = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            if (isLogin) {
                const result = await login(formData.email, formData.password);
                if (!result.success) {
                    Alert.alert('Login Failed', result.error);
                }
            } else {
                const userData = {
                    fullName: formData.fullName,
                    phone: formData.phone,
                    role: formData.role,
                    bloodGroup: formData.role === 'donor' ? formData.bloodGroup : null,
                    organizationName: formData.role === 'ngo' ? formData.organizationName : null,
                    organizationType: formData.role === 'ngo' ? formData.organizationType : null,
                };

                const result = await register(formData.email, formData.password, userData);
                if (!result.success) {
                    Alert.alert('Registration Failed', result.error);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const renderLoginForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to continue saving lives</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(false)}>
                <Text style={styles.switchText}>
                    Don't have an account? <Text style={styles.linkText}>Sign Up</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderRegisterForm = () => (
        <View style={styles.formContainer}>
            <Text style={styles.title}>Join LifeSaver</Text>
            <Text style={styles.subtitle}>Create an account to start helping</Text>

            <View style={styles.inputContainer}>
                <Ionicons name="person-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.fullName}
                    onChangeText={(text) => handleInputChange('fullName', text)}
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.phone}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.pickerContainer}>
                <Text style={styles.pickerLabel}>I am a:</Text>
                <Picker
                    selectedValue={formData.role}
                    style={styles.picker}
                    onValueChange={(value) => handleInputChange('role', value)}
                >
                    <Picker.Item label="Blood Donor" value="donor" />
                    <Picker.Item label="Patient/Family" value="patient" />
                </Picker>
            </View>

            {formData.role === 'donor' && (
                <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>Blood Group:</Text>
                    <Picker
                        selectedValue={formData.bloodGroup}
                        style={styles.picker}
                        onValueChange={(value) => handleInputChange('bloodGroup', value)}
                    >
                        {bloodGroups.map(group => (
                            <Picker.Item key={group} label={group} value={group} />
                        ))}
                    </Picker>
                </View>
            )}

            {formData.role === 'ngo' && (
                <>
                    <View style={styles.inputContainer}>
                        <Ionicons name="business-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Organization Name"
                            placeholderTextColor={theme.colors.textSecondary}
                            value={formData.organizationName}
                            onChangeText={(text) => handleInputChange('organizationName', text)}
                        />
                    </View>

                    <View style={styles.pickerContainer}>
                        <Text style={styles.pickerLabel}>Organization Type:</Text>
                        <Picker
                            selectedValue={formData.organizationType}
                            style={styles.picker}
                            onValueChange={(value) => handleInputChange('organizationType', value)}
                        >
                            <Picker.Item label="Hospital" value="hospital" />
                            <Picker.Item label="NGO" value="ngo" />
                            <Picker.Item label="Blood Bank" value="blood_bank" />
                        </Picker>
                    </View>
                </>
            )}

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry
                />
            </View>

            <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textSecondary} style={styles.inputIcon} />
                <TextInput
                    style={styles.input}
                    placeholder="Confirm Password"
                    placeholderTextColor={theme.colors.textSecondary}
                    value={formData.confirmPassword}
                    onChangeText={(text) => handleInputChange('confirmPassword', text)}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleAuth} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                ) : (
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setIsLogin(true)}>
                <Text style={styles.switchText}>
                    Already have an account? <Text style={styles.linkText}>Sign In</Text>
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Ionicons name="heart" size={60} color={theme.colors.primary} />
                    <Text style={styles.appName}>LifeSaver</Text>
                    <Text style={styles.tagline}>Connecting donors, saving lives</Text>
                </View>

                {isLogin ? renderLoginForm() : renderRegisterForm()}
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    scrollContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: theme.spacing.lg,
    },
    header: {
        alignItems: 'center',
        marginBottom: theme.spacing.xl,
    },
    appName: {
        fontSize: theme.fontSize.xxxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.primary,
        marginTop: theme.spacing.sm,
    },
    tagline: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    formContainer: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        ...theme.shadows.medium,
    },
    title: {
        fontSize: theme.fontSize.xxl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.xs,
    },
    subtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.lg,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        marginBottom: theme.spacing.md,
        paddingHorizontal: theme.spacing.md,
    },
    inputIcon: {
        marginRight: theme.spacing.sm,
    },
    input: {
        flex: 1,
        height: 50,
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
    },
    pickerContainer: {
        marginBottom: theme.spacing.md,
    },
    pickerLabel: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.medium,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    picker: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
    },
    primaryButton: {
        backgroundColor: theme.colors.primary,
        borderRadius: theme.borderRadius.md,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: theme.spacing.md,
        marginBottom: theme.spacing.lg,
    },
    primaryButtonText: {
        color: theme.colors.white,
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
    },
    switchText: {
        textAlign: 'center',
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
    },
    linkText: {
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.semibold,
    },
});

export default AuthScreen;
