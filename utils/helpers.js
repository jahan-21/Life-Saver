// Utility functions for the LifeSaver app

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {Object} coord1 - First coordinate {latitude, longitude}
 * @param {Object} coord2 - Second coordinate {latitude, longitude}
 * @returns {number} Distance in kilometers
 */
export const calculateDistance = (coord1, coord2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(coord2.latitude - coord1.latitude);
    const dLon = deg2rad(coord2.longitude - coord1.longitude);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(coord1.latitude)) * Math.cos(deg2rad(coord2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers
    return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export const formatDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

/**
 * Format time to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted time string
 */
export const formatTime = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

/**
 * Get time ago string
 * @param {Date|string} date - Date to compare
 * @returns {string} Time ago string (e.g., "2 hours ago")
 */
export const getTimeAgo = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffInSeconds = Math.floor((now - dateObj) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks} week${diffInWeeks > 1 ? 's' : ''} ago`;
    }

    return formatDate(dateObj);
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} True if valid phone
 */
export const validatePhone = (phone) => {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Get blood group compatibility
 * @param {string} bloodGroup - Blood group to check
 * @returns {Object} Compatible donors and recipients
 */
export const getBloodCompatibility = (bloodGroup) => {
    const compatibility = {
        'A+': { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
        'A-': { canDonateTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
        'B+': { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
        'B-': { canDonateTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
        'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
        'AB-': { canDonateTo: ['AB+', 'AB-'], canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
        'O+': { canDonateTo: ['A+', 'B+', 'AB+', 'O+'], canReceiveFrom: ['O+', 'O-'] },
        'O-': { canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'] }
    };

    return compatibility[bloodGroup] || { canDonateTo: [], canReceiveFrom: [] };
};

/**
 * Calculate donation eligibility
 * @param {string} lastDonationDate - Last donation date
 * @param {string} donationType - Type of donation
 * @returns {Object} Eligibility status and next eligible date
 */
export const calculateDonationEligibility = (lastDonationDate, donationType = 'whole_blood') => {
    if (!lastDonationDate) {
        return { isEligible: true, nextEligibleDate: null, daysSinceLastDonation: null };
    }

    const lastDate = new Date(lastDonationDate);
    const today = new Date();
    const daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

    const intervals = {
        whole_blood: 56,  // 8 weeks
        platelets: 7,     // 1 week
        plasma: 28,       // 4 weeks
        red_cells: 112    // 16 weeks
    };

    const requiredInterval = intervals[donationType] || 56;
    const isEligible = daysSince >= requiredInterval;

    const nextEligibleDate = new Date(lastDate);
    nextEligibleDate.setDate(lastDate.getDate() + requiredInterval);

    return {
        isEligible,
        nextEligibleDate: isEligible ? null : nextEligibleDate,
        daysSinceLastDonation: daysSince,
        daysUntilEligible: isEligible ? 0 : requiredInterval - daysSince
    };
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Capitalize first letter of string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
export const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

/**
 * Get initials from name
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
    if (!name) return '';
    return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

/**
 * Check if user is eligible to donate based on basic criteria
 * @param {Object} userProfile - User profile data
 * @returns {Object} Eligibility status and reasons
 */
export const checkDonationEligibility = (userProfile) => {
    const reasons = [];
    let isEligible = true;

    // Age check
    if (!userProfile.age || userProfile.age < 18 || userProfile.age > 65) {
        isEligible = false;
        reasons.push('Age must be between 18-65 years');
    }

    // Weight check
    if (!userProfile.weight || parseFloat(userProfile.weight) < 50) {
        isEligible = false;
        reasons.push('Weight must be at least 50kg');
    }

    // Last donation check
    if (userProfile.lastDonation) {
        const eligibility = calculateDonationEligibility(userProfile.lastDonation);
        if (!eligibility.isEligible) {
            isEligible = false;
            reasons.push(`Must wait ${eligibility.daysUntilEligible} more days since last donation`);
        }
    }

    return { isEligible, reasons };
};
