import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../config/theme';
import { formatDistance, getDirectionText, calculateBearing } from '../config/mapConfig';

const DistanceDisplay = ({
    userLocation,
    targetLocation,
    distance,
    showDirection = false,
    style = {},
    textStyle = {}
}) => {
    if (!distance && (!userLocation || !targetLocation)) {
        return (
            <View style={[styles.container, style]}>
                <Ionicons name="location-outline" size={14} color={theme.colors.textSecondary} />
                <Text style={[styles.text, textStyle]}>Distance N/A</Text>
            </View>
        );
    }

    const displayDistance = distance || 0;
    let directionText = '';

    if (showDirection && userLocation && targetLocation) {
        const bearing = calculateBearing(userLocation, targetLocation);
        directionText = ` ${getDirectionText(bearing)}`;
    }

    return (
        <View style={[styles.container, style]}>
            <Ionicons name="location" size={14} color={theme.colors.primary} />
            <Text style={[styles.text, textStyle]}>
                {formatDistance(displayDistance)}{directionText}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    text: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.primary,
        fontWeight: theme.fontWeight.medium,
        marginLeft: theme.spacing.xs,
    },
});

export default DistanceDisplay;



