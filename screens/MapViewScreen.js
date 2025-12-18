import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function MapViewScreen() {
    const googleMapsHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body, html {
                    margin: 0;
                    padding: 0;
                    height: 100%;
                }
                #map {
                    height: 100%;
                    width: 100%;
                }
                .info-window {
                    font-family: Arial, sans-serif;
                    padding: 10px;
                }
                .hospital-name {
                    font-weight: bold;
                    font-size: 14px;
                    margin-bottom: 8px;
                    color: #333;
                }
                .directions-btn {
                    background-color: #DC143C;
                    color: white;
                    padding: 8px 16px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    text-decoration: none;
                    display: inline-block;
                    font-size: 12px;
                }
                .directions-btn:hover {
                    background-color: #B01030;
                }
            </style>
        </head>
        <body>
            <div id="map"></div>
            <script>
                function initMap() {
                    const coimbatore = { lat: 11.0168, lng: 76.9558 };
                    const map = new google.maps.Map(document.getElementById("map"), {
                        zoom: 12,
                        center: coimbatore,
                        mapTypeControl: true,
                        fullscreenControl: false,
                        styles: [
                            {
                                elementType: 'geometry',
                                stylers: [{ saturation: 30 }, { lightness: 50 }]
                            }
                        ]
                    });

                    // Hospital locations in Coimbatore
                    const hospitals = [
                        { name: "Coimbatore Medical College Hospital", lat: 11.0041, lng: 76.9650 },
                        { name: "PSG Hospitals", lat: 11.0219, lng: 76.9369 },
                        { name: "Kovai Medical Center", lat: 11.0290, lng: 76.9931 },
                        { name: "GEM Hospital", lat: 11.0510, lng: 76.9974 },
                        { name: "KMCH Hospital", lat: 11.0203, lng: 77.0025 },
                        { name: "Sri Ramakrishna Hospital", lat: 11.0075, lng: 76.9572 },
                        { name: "Royal Care Super Specialty Hospital", lat: 10.9965, lng: 76.9615 },
                        { name: "Ganga Hospital", lat: 11.0357, lng: 76.9987 }
                    ];

                    // Add markers for each hospital
                    hospitals.forEach(hospital => {
                        const marker = new google.maps.Marker({
                            position: { lat: hospital.lat, lng: hospital.lng },
                            map: map,
                            title: hospital.name,
                            icon: {
                                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                scaledSize: new google.maps.Size(40, 40)
                            }
                        });

                        // Create info window content with link to Google Maps
                        const googleMapsUrl = 'https://www.google.com/maps/search/?api=1&query=' + 
                                              encodeURIComponent(hospital.name) + '&query=' + 
                                              hospital.lat + ',' + hospital.lng;

                        const infoWindowContent = \`
                            <div class="info-window">
                                <div class="hospital-name">\${hospital.name}</div>
                                <a href="\${googleMapsUrl}" target="_blank" class="directions-btn">
                                    Open in Google Maps
                                </a>
                            </div>
                        \`;

                        const infoWindow = new google.maps.InfoWindow({
                            content: infoWindowContent
                        });

                        // Add click listener to marker
                        marker.addListener('click', () => {
                            infoWindow.open(map, marker);
                        });
                    });
                }
            </script>
            <script src="https://maps.googleapis.com/maps/api/js?key=AIzaSy..." async defer></script>
        </body>
        </html>
    `;

    return (
        <View style={styles.container}>
            <WebView
                originWhitelist={['*']}
                source={{ html: googleMapsHTML }}
                style={styles.map}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                opacity={10}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    map: {
        flex: 1,
        opacity: 1,
    },
});
