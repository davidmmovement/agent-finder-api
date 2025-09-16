const axios = require('axios');

class GeocodingService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
    }

    async getCoordinates(address) {
        try {
            const response = await axios.get(this.baseUrl, {
                params: {
                    address: address,
                    key: this.apiKey
                }
            });

            if (response.data.status === 'OK' && response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: response.data.results[0].formatted_address
                };
            } else {
                throw new Error(`Geocoding failed: ${response.data.status}`);
            }
        } catch (error) {
            console.error('Geocoding error:', error.message);
            throw new Error('Unable to geocode address');
        }
    }

    estimateCoordinates(address) {
        const coordinates = {
            'new york': { lat: 40.7128, lng: -74.0060 },
            'los angeles': { lat: 34.0522, lng: -118.2437 },
            'chicago': { lat: 41.8781, lng: -87.6298 },
            'houston': { lat: 29.7604, lng: -95.3698 },
            'phoenix': { lat: 33.4484, lng: -112.0740 }
        };

        const city = address.toLowerCase();
        for (const [key, coords] of Object.entries(coordinates)) {
            if (city.includes(key)) {
                return {
                    latitude: coords.lat,
                    longitude: coords.lng,
                    formattedAddress: address
                };
            }
        }

        return {
            latitude: 40.7128,
            longitude: -74.0060,
            formattedAddress: address
        };
    }
}

module.exports = GeocodingService;