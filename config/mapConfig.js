// Google Maps custom styling for React Native Maps
export const googleMapStyle = [
    {
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#f5f5f5"
            }
        ]
    },
    {
        "elementType": "labels.icon",
        "stylers": [
            {
                "visibility": "off"
            }
        ]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#616161"
            }
        ]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [
            {
                "color": "#f5f5f5"
            }
        ]
    },
    {
        "featureType": "administrative.land_parcel",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#bdbdbd"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#eeeeee"
            }
        ]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#e5e5e5"
            }
        ]
    },
    {
        "featureType": "poi.park",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#9e9e9e"
            }
        ]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#ffffff"
            }
        ]
    },
    {
        "featureType": "road.arterial",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#757575"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#dadada"
            }
        ]
    },
    {
        "featureType": "road.highway",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#616161"
            }
        ]
    },
    {
        "featureType": "road.local",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#9e9e9e"
            }
        ]
    },
    {
        "featureType": "transit.line",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#e5e5e5"
            }
        ]
    },
    {
        "featureType": "transit.station",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#eeeeee"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "color": "#c9c9c9"
            }
        ]
    },
    {
        "featureType": "water",
        "elementType": "labels.text.fill",
        "stylers": [
            {
                "color": "#9e9e9e"
            }
        ]
    }
];

// Google Maps configuration
export const mapConfig = {
    provider: 'google', // Uses Google Maps
    mapType: 'standard',
    showsUserLocation: true,
    showsMyLocationButton: true,
    showsCompass: true,
    showsScale: false,
    showsBuildings: true,
    showsTraffic: false,
    showsIndoors: false,
    rotateEnabled: true,
    scrollEnabled: true,
    zoomEnabled: true,
    pitchEnabled: false,
};

// Distance calculation using Haversine formula
export const calculateDistanceBetweenPoints = (point1, point2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = deg2rad(point2.latitude - point1.latitude);
    const dLon = deg2rad(point2.longitude - point1.longitude);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(point1.latitude)) * Math.cos(deg2rad(point2.latitude)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in kilometers

    return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
};

// Get nearby locations within a certain radius
export const getLocationsWithinRadius = (userLocation, locations, radiusKm = 50) => {
    return locations
        .map(location => ({
            ...location,
            distance: calculateDistanceBetweenPoints(userLocation, {
                latitude: location.location.latitude,
                longitude: location.location.longitude
            })
        }))
        .filter(location => location.distance <= radiusKm)
        .sort((a, b) => a.distance - b.distance);
};

// Format distance for display
export const formatDistance = (distance) => {
    if (distance < 1) {
        return `${Math.round(distance * 1000)}m`;
    } else if (distance < 10) {
        return `${distance.toFixed(1)}km`;
    } else {
        return `${Math.round(distance)}km`;
    }
};

// Get direction text based on bearing
export const getDirectionText = (bearing) => {
    const directions = [
        'North', 'Northeast', 'East', 'Southeast',
        'South', 'Southwest', 'West', 'Northwest'
    ];
    const index = Math.round(bearing / 45) % 8;
    return directions[index];
};

// Calculate bearing between two points
export const calculateBearing = (point1, point2) => {
    const dLon = deg2rad(point2.longitude - point1.longitude);
    const lat1 = deg2rad(point1.latitude);
    const lat2 = deg2rad(point2.latitude);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

    let bearing = Math.atan2(y, x);
    bearing = bearing * 180 / Math.PI;
    bearing = (bearing + 360) % 360;

    return bearing;
};



