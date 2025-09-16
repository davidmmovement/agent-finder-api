const axios = require('axios');

class PropertyInfoService {
    constructor(googleApiKey) {
        this.googleApiKey = googleApiKey;
        this.overpassUrl = 'https://overpass-api.de/api/interpreter';
        this.placesBaseUrl = 'https://maps.googleapis.com/maps/api/place';
    }

    async getPropertyInfo(address, coordinates = null) {
        const result = {
            address: address,
            coordinates: coordinates,
            area: null,
            basicInfo: {},
            sources: {}
        };

        try {
            // Try to get coordinates if not provided
            if (!coordinates && this.googleApiKey && this.googleApiKey !== 'your_google_maps_api_key_here') {
                const geocoded = await this.geocodeAddress(address);
                if (geocoded) {
                    coordinates = geocoded.coordinates;
                    result.coordinates = coordinates;
                }
            }

            // Get area information from OpenStreetMap
            if (coordinates) {
                const osmData = await this.getAreaFromOSM(coordinates);
                if (osmData.found) {
                    result.sources.osm = osmData;
                    if (osmData.area) {
                        result.area = osmData.area;
                    }
                    result.basicInfo = {
                        buildingType: osmData.buildingType,
                        levels: osmData.levels,
                        material: osmData.material,
                        use: osmData.use,
                        isResidential: osmData.isResidential,
                        isCommercial: osmData.isCommercial
                    };
                }
            }

            if (this.googleApiKey && this.googleApiKey !== 'your_google_maps_api_key_here') {
                try {
                    const googleData = await this.getContextFromGoogle(address);
                    result.sources.google = googleData;

                    // Use Google data if OSM didn't provide enough info
                    if (!result.basicInfo.buildingType || result.basicInfo.buildingType === 'unknown') {
                        result.basicInfo.buildingType = googleData.buildingType;
                        result.basicInfo.isResidential = googleData.isResidential;
                        result.basicInfo.isCommercial = googleData.isCommercial;
                    }
                } catch (error) {
                    console.log('Google Places supplementary data failed');
                }
            }

            if (result.sources.osm && result.sources.osm.geometry) {
                result.area = this.calculateBuildingArea(result.sources.osm.geometry);
            }

            return this.formatResponse(result);

        } catch (error) {
            console.error('Property info error:', error);
            return {
                address: address,
                coordinates: coordinates,
                area: null,
                basicInfo: {
                    buildingType: 'unknown',
                    error: 'Unable to retrieve property information'
                },
                sources: {}
            };
        }
    }

    async geocodeAddress(address) {
        try {
            const response = await axios.get(`${this.placesBaseUrl}/findplacefromtext/json`, {
                params: {
                    input: address,
                    inputtype: 'textquery',
                    fields: 'geometry',
                    key: this.googleApiKey
                }
            });

            if (response.data.status === 'OK' && response.data.candidates.length > 0) {
                const location = response.data.candidates[0].geometry.location;
                return {
                    coordinates: {
                        latitude: location.lat,
                        longitude: location.lng
                    }
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding failed:', error);
            return null;
        }
    }

    async getAreaFromOSM(coordinates) {
        try {
            const { latitude, longitude } = coordinates;

            const query = `
        [out:json][timeout:30];
        (
          way["building"](around:25,${latitude},${longitude});
          relation["building"](around:25,${latitude},${longitude});
        );
        out geom tags;
      `;

            const response = await axios.get(this.overpassUrl, {
                params: { data: query },
                timeout: 35000
            });

            const elements = response.data.elements || [];

            if (elements.length === 0) {
                return { found: false };
            }

            const building = this.findClosestBuilding(elements, latitude, longitude);
            const tags = building.tags || {};

            return {
                found: true,
                buildingType: this.getBuildingType(tags),
                levels: tags['building:levels'] ? parseInt(tags['building:levels']) : null,
                height: tags.height,
                material: tags['building:material'],
                use: tags['building:use'] || tags.amenity || tags.shop,
                area: this.calculateAreaFromTags(tags),
                geometry: building.geometry,
                isResidential: this.isResidentialOSM(tags),
                isCommercial: this.isCommercialOSM(tags),
                address: {
                    houseNumber: tags['addr:housenumber'],
                    street: tags['addr:street'],
                    city: tags['addr:city'],
                    postcode: tags['addr:postcode']
                },
                allTags: tags
            };

        } catch (error) {
            console.error('OSM query failed:', error);
            return { found: false, error: error.message };
        }
    }

    async getContextFromGoogle(address) {
        try {
            const searchResponse = await axios.get(`${this.placesBaseUrl}/findplacefromtext/json`, {
                params: {
                    input: address,
                    inputtype: 'textquery',
                    fields: 'place_id,types',
                    key: this.googleApiKey
                }
            });

            if (searchResponse.data.status !== 'OK' || !searchResponse.data.candidates.length) {
                return { found: false };
            }

            const place = searchResponse.data.candidates[0];
            const types = place.types || [];

            return {
                found: true,
                buildingType: this.determineBuildingTypeGoogle(types),
                isResidential: this.isResidentialGoogle(types),
                isCommercial: this.isCommercialGoogle(types),
                types: types
            };

        } catch (error) {
            console.error('Google context failed:', error);
            return { found: false };
        }
    }

    findClosestBuilding(buildings, targetLat, targetLng) {
        if (buildings.length === 1) return buildings[0];

        let closest = buildings[0];
        let minDistance = Infinity;

        buildings.forEach(building => {
            if (building.geometry && building.geometry.length > 0) {
                const centroid = this.calculateCentroid(building.geometry);
                const distance = this.calculateDistance(targetLat, targetLng, centroid.lat, centroid.lng);

                if (distance < minDistance) {
                    minDistance = distance;
                    closest = building;
                }
            }
        });

        return closest;
    }

    calculateCentroid(geometry) {
        let sumLat = 0, sumLng = 0, count = 0;

        geometry.forEach(point => {
            sumLat += point.lat;
            sumLng += point.lon;
            count++;
        });

        return {
            lat: sumLat / count,
            lng: sumLng / count
        };
    }

    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLng = (lng2 - lng1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    calculateBuildingArea(geometry) {
        if (!geometry || geometry.length < 3) return null;

        // Use shoelace formula to calculate polygon area
        let area = 0;
        const n = geometry.length;

        for (let i = 0; i < n; i++) {
            const j = (i + 1) % n;
            const xi = geometry[i].lon * Math.PI / 180;
            const yi = geometry[i].lat * Math.PI / 180;
            const xj = geometry[j].lon * Math.PI / 180;
            const yj = geometry[j].lat * Math.PI / 180;

            area += xi * yj - xj * yi;
        }

        area = Math.abs(area) / 2;

        // Convert to square meters (approximate)
        const R = 6371000; // Earth's radius in meters
        const areaInSqMeters = area * R * R;

        return Math.round(areaInSqMeters);
    }

    calculateAreaFromTags(tags) {
        if (tags['building:floor_area']) {
            return parseFloat(tags['building:floor_area']);
        }

        if (tags.area) {
            return parseFloat(tags.area);
        }

        const levels = parseInt(tags['building:levels']) || 1;
        const buildingType = tags.building;

        // Rough estimates based on building type (in square meters)
        const estimates = {
            'house': 120,
            'detached': 150,
            'apartments': 800,
            'residential': 600,
            'commercial': 400,
            'office': 300,
            'retail': 200,
            'yes': 100
        };

        const baseArea = estimates[buildingType] || estimates['yes'];
        return baseArea * levels;
    }

    getBuildingType(tags) {
        if (tags.building && tags.building !== 'yes') {
            return tags.building;
        }
        if (tags.amenity) return `amenity:${tags.amenity}`;
        if (tags.shop) return `shop:${tags.shop}`;
        if (tags.office) return `office:${tags.office}`;
        return 'building';
    }

    formatResponse(result) {
        return {
            address: result.address,
            coordinates: result.coordinates,
            property: {
                area: result.area ? {
                    value: result.area,
                    unit: 'square_meters',
                    display: `${result.area} m²`
                } : null,
                buildingType: result.basicInfo.buildingType,
                levels: result.basicInfo.levels,
                material: result.basicInfo.material,
                use: result.basicInfo.use,
                category: {
                    isResidential: result.basicInfo.isResidential,
                    isCommercial: result.basicInfo.isCommercial
                }
            },
            sources: Object.keys(result.sources)
        };
    }

    isResidentialOSM(tags) {
        const residentialTypes = ['residential', 'apartments', 'house', 'detached'];
        return residentialTypes.includes(tags.building) || tags.residential === 'yes';
    }

    isCommercialOSM(tags) {
        return tags.building === 'commercial' ||
            tags.building === 'office' ||
            tags.building === 'retail' ||
            tags.shop || tags.office || tags.amenity;
    }

    isResidentialGoogle(types) {
        const residentialTypes = ['subpremise', 'apartment_building', 'housing_complex'];
        return types.some(type => residentialTypes.includes(type));
    }

    isCommercialGoogle(types) {
        const commercialTypes = ['establishment', 'store', 'office_building'];
        return types.some(type => commercialTypes.includes(type));
    }

    determineBuildingTypeGoogle(types) {
        if (types.includes('apartment_building')) return 'apartment';
        if (types.includes('subpremise')) return 'residential_unit';
        if (types.includes('establishment')) return 'commercial';
        return 'unknown';
    }
}

module.exports = PropertyInfoService;

// ====================================================================
// Update agentService.js to use new PropertyInfoService
// ====================================================================

/*
// Add to agentService.js imports:
const PropertyInfoService = require('./propertyInfoService');

// Update constructor:
constructor() {
  this.geocodingService = new GeocodingService(process.env.GEOCODING_API_KEY);
  this.propertyInfoService = new PropertyInfoService(process.env.GEOCODING_API_KEY);
}

// Update getBuildingInfo method:
async getBuildingInfo(address, coordinates = null) {
  try {
    return await this.propertyInfoService.getPropertyInfo(address, coordinates);
  } catch (error) {
    console.error('Error getting property info:', error);
    throw error;
  }
}
*/

// ====================================================================
// Sample responses with area information:
// ====================================================================

/*
Expected Response Format:
{
  "success": true,
  "buildingInfo": {
    "address": "15 Abovyan Street, Yerevan",
    "coordinates": {
      "latitude": 40.18454,
      "longitude": 44.51950
    },
    "property": {
      "area": {
        "value": 850,
        "unit": "square_meters",
        "display": "850 m²"
      },
      "buildingType": "residential",
      "levels": 5,
      "material": "concrete",
      "use": null,
      "category": {
        "isResidential": true,
        "isCommercial": false
      }
    },
    "sources": ["osm", "google"]
  }
}

For houses:
{
  "property": {
    "area": {
      "value": 120,
      "unit": "square_meters", 
      "display": "120 m²"
    },
    "buildingType": "house",
    "levels": 2,
    "category": {
      "isResidential": true,
      "isCommercial": false
    }
  }
}

For commercial:
{
  "property": {
    "area": {
      "value": 300,
      "unit": "square_meters",
      "display": "300 m²"
    },
    "buildingType": "office",
    "levels": 1,
    "use": "office",
    "category": {
      "isResidential": false,
      "isCommercial": true
    }
  }
}
*/