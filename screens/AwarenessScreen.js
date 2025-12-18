import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Animated,
    LayoutAnimation,
    Platform,
    UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const AwarenessScreen = () => {
    const [activeSection, setActiveSection] = useState('benefits');
    const [expandedFAQ, setExpandedFAQ] = useState(null);
    const [expandedMyth, setExpandedMyth] = useState(null);

    const benefits = [
        {
            icon: 'heart',
            title: 'Save Lives',
            description: 'One blood donation can save up to three lives. Your single act of kindness can make a tremendous difference.',
            color: theme.colors.primary,
        },
        {
            icon: 'fitness',
            title: 'Health Benefits',
            description: 'Regular blood donation can help maintain healthy iron levels and reduce risk of heart disease.',
            color: theme.colors.success,
        },
        {
            icon: 'medical',
            title: 'Free Health Check',
            description: 'Get a mini health screening including blood pressure, pulse, temperature, and hemoglobin check.',
            color: theme.colors.info,
        },
        {
            icon: 'happy',
            title: 'Feel Good Factor',
            description: 'Experience the psychological benefits of helping others and making a positive impact on society.',
            color: theme.colors.warning,
        },
        {
            icon: 'refresh',
            title: 'Blood Regeneration',
            description: 'Your body naturally replenishes the donated blood, helping maintain healthy blood production.',
            color: theme.colors.secondary,
        },
        {
            icon: 'people',
            title: 'Community Impact',
            description: 'Contribute to building a strong community blood supply for emergencies and medical treatments.',
            color: theme.colors.primary,
        },
    ];

    const faqs = [
        {
            question: 'Who can donate blood?',
            answer: 'Generally, healthy individuals aged 18-65 years, weighing at least 50kg, with no recent illnesses or medications can donate blood. Specific eligibility criteria may vary.',
        },
        {
            question: 'How often can I donate blood?',
            answer: 'You can donate whole blood every 8 weeks (56 days). Platelet donations can be made every 7 days, up to 24 times per year.',
        },
        {
            question: 'Does blood donation hurt?',
            answer: 'You may feel a brief pinch when the needle is inserted, but the donation process itself is generally painless. Most donors find it quite comfortable.',
        },
        {
            question: 'How long does the donation process take?',
            answer: 'The entire process takes about 45-60 minutes, including registration, screening, and recovery. The actual blood collection takes only 8-10 minutes.',
        },
        {
            question: 'What should I do before donating?',
            answer: 'Eat a healthy meal, drink plenty of water, get adequate sleep, and avoid alcohol. Bring a valid ID and list of medications you\'re taking.',
        },
        {
            question: 'What happens after I donate?',
            answer: 'Rest for 10-15 minutes, have refreshments, avoid heavy lifting for 24 hours, and drink extra fluids. Your blood will be tested and processed for patients in need.',
        },
        {
            question: 'Can I donate if I have tattoos or piercings?',
            answer: 'Yes, but you may need to wait 3-12 months after getting a tattoo or piercing, depending on the facility and local regulations.',
        },
        {
            question: 'What blood types are most needed?',
            answer: 'O-negative (universal donor) and O-positive are always in high demand. However, all blood types are needed to help patients with various conditions.',
        },
    ];

    const myths = [
        {
            myth: 'Blood donation makes you weak and anemic',
            fact: 'Your body quickly replenishes the donated blood. Most people feel normal within a few hours and completely recover within 24-48 hours.',
            icon: 'fitness',
        },
        {
            myth: 'You can get infected with diseases from donating blood',
            fact: 'All equipment is sterile and used only once. There is absolutely no risk of contracting any infection from donating blood.',
            icon: 'shield-checkmark',
        },
        {
            myth: 'Blood donation is time-consuming',
            fact: 'The actual donation takes only 8-10 minutes. The entire process, including screening and recovery, takes about 45-60 minutes.',
            icon: 'time',
        },
        {
            myth: 'Vegetarians cannot donate blood',
            fact: 'Vegetarians can donate blood as long as they maintain adequate iron levels through their diet and meet all other eligibility criteria.',
            icon: 'leaf',
        },
        {
            myth: 'You need to fast before donating blood',
            fact: 'You should eat a healthy meal before donating. Fasting can actually make you feel weak or dizzy during donation.',
            icon: 'restaurant',
        },
        {
            myth: 'People with high/low blood pressure cannot donate',
            fact: 'People with controlled blood pressure can usually donate. Your blood pressure will be checked during screening to ensure it\'s within safe limits.',
            icon: 'heart-outline',
        },
        {
            myth: 'Blood donation affects your immunity',
            fact: 'Blood donation does not weaken your immune system. Your body maintains its ability to fight infections normally.',
            icon: 'medical',
        },
        {
            myth: 'You can only donate blood once in your lifetime',
            fact: 'Healthy individuals can donate blood regularly - whole blood every 8 weeks, platelets every 7 days, and plasma twice a week.',
            icon: 'refresh',
        },
    ];

    const toggleFAQ = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedFAQ(expandedFAQ === index ? null : index);
    };

    const toggleMyth = (index) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedMyth(expandedMyth === index ? null : index);
    };

    const renderSectionTabs = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeSection === 'benefits' && styles.activeTab]}
                onPress={() => setActiveSection('benefits')}
            >
                <Ionicons
                    name="heart"
                    size={20}
                    color={activeSection === 'benefits' ? theme.colors.white : theme.colors.primary}
                />
                <Text style={[styles.tabText, activeSection === 'benefits' && styles.activeTabText]}>
                    Benefits
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeSection === 'faqs' && styles.activeTab]}
                onPress={() => setActiveSection('faqs')}
            >
                <Ionicons
                    name="help-circle"
                    size={20}
                    color={activeSection === 'faqs' ? theme.colors.white : theme.colors.primary}
                />
                <Text style={[styles.tabText, activeSection === 'faqs' && styles.activeTabText]}>
                    FAQs
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.tab, activeSection === 'myths' && styles.activeTab]}
                onPress={() => setActiveSection('myths')}
            >
                <Ionicons
                    name="bulb"
                    size={20}
                    color={activeSection === 'myths' ? theme.colors.white : theme.colors.primary}
                />
                <Text style={[styles.tabText, activeSection === 'myths' && styles.activeTabText]}>
                    Myths
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderBenefits = () => (
        <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Benefits of Blood Donation</Text>
            <Text style={styles.sectionSubtitle}>
                Discover how donating blood benefits both you and the community
            </Text>

            {benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitCard}>
                    <View style={[styles.benefitIcon, { backgroundColor: benefit.color }]}>
                        <Ionicons name={benefit.icon} size={24} color={theme.colors.white} />
                    </View>
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>{benefit.title}</Text>
                        <Text style={styles.benefitDescription}>{benefit.description}</Text>
                    </View>
                </View>
            ))}
        </View>
    );

    const renderFAQs = () => (
        <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            <Text style={styles.sectionSubtitle}>
                Get answers to common questions about blood donation
            </Text>

            {faqs.map((faq, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.faqCard}
                    onPress={() => toggleFAQ(index)}
                >
                    <View style={styles.faqHeader}>
                        <Text style={styles.faqQuestion}>{faq.question}</Text>
                        <Ionicons
                            name={expandedFAQ === index ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.colors.primary}
                        />
                    </View>
                    {expandedFAQ === index && (
                        <Text style={styles.faqAnswer}>{faq.answer}</Text>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderMyths = () => (
        <View style={styles.sectionContent}>
            <Text style={styles.sectionTitle}>Myths vs Facts</Text>
            <Text style={styles.sectionSubtitle}>
                Let's bust some common myths about blood donation
            </Text>

            {myths.map((item, index) => (
                <TouchableOpacity
                    key={index}
                    style={styles.mythCard}
                    onPress={() => toggleMyth(index)}
                >
                    <View style={styles.mythHeader}>
                        <Ionicons name={item.icon} size={20} color={theme.colors.error} />
                        <Text style={styles.mythTitle}>Myth</Text>
                        <Ionicons
                            name={expandedMyth === index ? 'chevron-up' : 'chevron-down'}
                            size={20}
                            color={theme.colors.primary}
                        />
                    </View>
                    <Text style={styles.mythText}>{item.myth}</Text>

                    {expandedMyth === index && (
                        <View style={styles.factContainer}>
                            <View style={styles.factHeader}>
                                <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
                                <Text style={styles.factTitle}>Fact</Text>
                            </View>
                            <Text style={styles.factText}>{item.fact}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            ))}
        </View>
    );

    const renderContent = () => {
        switch (activeSection) {
            case 'benefits':
                return renderBenefits();
            case 'faqs':
                return renderFAQs();
            case 'myths':
                return renderMyths();
            default:
                return renderBenefits();
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Blood Donation Awareness</Text>
                <Text style={styles.headerSubtitle}>Learn, understand, and help save lives</Text>
            </View>

            {renderSectionTabs()}

            <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
                {renderContent()}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        backgroundColor: theme.colors.white,
        padding: theme.spacing.lg,
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: {
        marginTop: 30,
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
    },
    headerSubtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        marginTop: theme.spacing.xs,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        borderRadius: theme.borderRadius.md,
        marginHorizontal: theme.spacing.xs,
    },
    activeTab: {
        backgroundColor: theme.colors.primary,
    },
    tabText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
    activeTabText: {
        color: theme.colors.white,
    },
    scrollContainer: {
        flex: 1,
    },
    sectionContent: {
        padding: theme.spacing.lg,
    },
    sectionTitle: {
        fontSize: theme.fontSize.xl,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.text,
        textAlign: 'center',
        marginBottom: theme.spacing.sm,
    },
    sectionSubtitle: {
        fontSize: theme.fontSize.md,
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginBottom: theme.spacing.xl,
    },
    benefitCard: {
        flexDirection: 'row',
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
    },
    benefitIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: theme.spacing.md,
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        marginBottom: theme.spacing.xs,
    },
    benefitDescription: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
    },
    faqCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    faqQuestion: {
        fontSize: theme.fontSize.md,
        fontWeight: theme.fontWeight.semibold,
        color: theme.colors.text,
        flex: 1,
        marginRight: theme.spacing.md,
    },
    faqAnswer: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        lineHeight: 20,
        marginTop: theme.spacing.md,
        paddingTop: theme.spacing.md,
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    mythCard: {
        backgroundColor: theme.colors.white,
        borderRadius: theme.borderRadius.lg,
        padding: theme.spacing.lg,
        marginBottom: theme.spacing.md,
        ...theme.shadows.small,
    },
    mythHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    mythTitle: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.error,
        marginLeft: theme.spacing.xs,
        flex: 1,
    },
    mythText: {
        fontSize: theme.fontSize.md,
        color: theme.colors.text,
        fontStyle: 'italic',
        marginBottom: theme.spacing.sm,
    },
    factContainer: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginTop: theme.spacing.sm,
    },
    factHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.sm,
    },
    factTitle: {
        fontSize: theme.fontSize.sm,
        fontWeight: theme.fontWeight.bold,
        color: theme.colors.success,
        marginLeft: theme.spacing.xs,
    },
    factText: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        lineHeight: 20,
    },
});

export default AwarenessScreen;
