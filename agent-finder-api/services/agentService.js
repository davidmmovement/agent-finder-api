const Agent = require('../models/Agent');
const GeocodingService = require('./geocoding');
const PropertyInfoService = require('./propertyInfoService');

class AgentService {
    constructor() {
        this.geocodingService = new GeocodingService(process.env.GEOCODING_API_KEY);
        this.propertyInfoService = new PropertyInfoService(process.env.GEOCODING_API_KEY);
    }

    async findClosestAgent(houseAddress, timeSlot = null, maxDistance = 50000, includeBuildingInfo = false) {
        try {
            let coordinates;

            if (process.env.GEOCODING_API_KEY && process.env.GEOCODING_API_KEY !== 'your_google_maps_api_key_here') {
                coordinates = await this.geocodingService.getCoordinates(houseAddress);
            } else {
                coordinates = this.geocodingService.estimateCoordinates(houseAddress);
            }

            const { latitude, longitude } = coordinates;

            const query = {
                isActive: true,
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                }
            };

            if (timeSlot) {
                query.timeSlots = {
                    $elemMatch: {
                        day: timeSlot.day.toLowerCase(),
                        startTime: { $lte: timeSlot.time },
                        endTime: { $gte: timeSlot.time },
                        available: true
                    }
                };
            } else {
                query['timeSlots.available'] = true;
            }

            const agent = await Agent.findOne(query);

            if (!agent) {
                return null;
            }

            const distance = this.calculateDistance(
                latitude, longitude,
                agent.location.coordinates[1], agent.location.coordinates[0]
            );

            let availableTimeSlots;
            if (timeSlot) {
                const matchingSlots = agent.timeSlots.filter(slot =>
                    slot.day === timeSlot.day.toLowerCase() &&
                    slot.startTime <= timeSlot.time &&
                    slot.endTime >= timeSlot.time &&
                    slot.available
                );
                availableTimeSlots = this.generateOneHourSlots(matchingSlots, timeSlot.time);
            } else {
                const allAvailableSlots = agent.timeSlots.filter(slot => slot.available);
                availableTimeSlots = this.generateOneHourSlots(allAvailableSlots);
            }

            const result = {
                ...agent.toObject(),
                distance: distance * 1000, // Convert to meters
                distanceKm: Math.round(distance * 100) / 100,
                availableTimeSlots: availableTimeSlots,
                houseCoordinates: { latitude, longitude },
                formattedHouseAddress: coordinates.formattedAddress
            };

            if (includeBuildingInfo) {
                try {
                    const buildingInfo = await this.propertyInfoService.getPropertyInfo(
                        houseAddress,
                        { latitude, longitude }
                    );
                    result.buildingInfo = buildingInfo;
                } catch (error) {
                    console.log('Building info failed:', error.message);
                    result.buildingInfo = {
                        error: 'Building information unavailable',
                        message: error.message
                    };
                }
            }

            return result;

        } catch (error) {
            console.error('Error finding closest agent:', error);
            throw error;
        }
    }

    async findNearbyAgents(houseAddress, timeSlot = null, maxDistance = 50000, limit = 5) {
        try {
            let coordinates;

            if (process.env.GEOCODING_API_KEY && process.env.GEOCODING_API_KEY !== 'your_google_maps_api_key_here') {
                coordinates = await this.geocodingService.getCoordinates(houseAddress);
            } else {
                coordinates = this.geocodingService.estimateCoordinates(houseAddress);
            }

            const { latitude, longitude } = coordinates;

            const query = {
                isActive: true,
                location: {
                    $near: {
                        $geometry: {
                            type: 'Point',
                            coordinates: [longitude, latitude]
                        },
                        $maxDistance: maxDistance
                    }
                }
            };

            if (timeSlot) {
                query.timeSlots = {
                    $elemMatch: {
                        day: timeSlot.day.toLowerCase(),
                        startTime: { $lte: timeSlot.time },
                        endTime: { $gte: timeSlot.time },
                        available: true
                    }
                };
            } else {
                query['timeSlots.available'] = true;
            }

            const agents = await Agent.find(query).limit(limit);

            return agents.map(agent => {
                const distance = this.calculateDistance(
                    latitude, longitude,
                    agent.location.coordinates[1], agent.location.coordinates[0]
                );

                let availableTimeSlots;
                if (timeSlot) {
                    const matchingSlots = agent.timeSlots.filter(slot =>
                        slot.day === timeSlot.day.toLowerCase() &&
                        slot.startTime <= timeSlot.time &&
                        slot.endTime >= timeSlot.time &&
                        slot.available
                    );
                    availableTimeSlots = this.generateOneHourSlots(matchingSlots, timeSlot.time);
                } else {
                    const allAvailableSlots = agent.timeSlots.filter(slot => slot.available);
                    availableTimeSlots = this.generateOneHourSlots(allAvailableSlots);
                }

                return {
                    ...agent.toObject(),
                    distance: distance * 1000,
                    distanceKm: Math.round(distance * 100) / 100,
                    availableTimeSlots: availableTimeSlots
                };
            });

        } catch (error) {
            console.error('Error finding nearby agents:', error);
            throw error;
        }
    }

    async getBuildingInfo(address, coordinates = null) {
        try {
            return await this.propertyInfoService.getPropertyInfo(address, coordinates);
        } catch (error) {
            console.error('Error getting property info:', error);
            throw error;
        }
    }

    async createAgent(agentData) {
        try {
            const fullAddress = `${agentData.address.street}, ${agentData.address.city}, ${agentData.address.state} ${agentData.address.zipCode}`;

            let coordinates;
            if (process.env.GEOCODING_API_KEY && process.env.GEOCODING_API_KEY !== 'your_google_maps_api_key_here') {
                coordinates = await this.geocodingService.getCoordinates(fullAddress);
            } else {
                coordinates = this.geocodingService.estimateCoordinates(fullAddress);
            }

            const agent = new Agent({
                ...agentData,
                location: {
                    type: 'Point',
                    coordinates: [coordinates.longitude, coordinates.latitude]
                }
            });

            return await agent.save();
        } catch (error) {
            console.error('Error creating agent:', error);
            throw error;
        }
    }

    async getAllAgents() {
        return await Agent.find({ isActive: true }).sort({ name: 1 });
    }

    async getAgentById(agentId) {
        return await Agent.findById(agentId);
    }

    async updateAgent(agentId, updateData) {
        try {
            // If address is being updated, re-geocode
            if (updateData.address) {
                const fullAddress = `${updateData.address.street}, ${updateData.address.city}, ${updateData.address.state} ${updateData.address.zipCode}`;

                let coordinates;
                if (process.env.GEOCODING_API_KEY && process.env.GEOCODING_API_KEY !== 'your_google_maps_api_key_here') {
                    coordinates = await this.geocodingService.getCoordinates(fullAddress);
                } else {
                    coordinates = this.geocodingService.estimateCoordinates(fullAddress);
                }

                updateData.location = {
                    type: 'Point',
                    coordinates: [coordinates.longitude, coordinates.latitude]
                };
            }

            return await Agent.findByIdAndUpdate(agentId, updateData, { new: true });
        } catch (error) {
            console.error('Error updating agent:', error);
            throw error;
        }
    }

    async deleteAgent(agentId) {
        return await Agent.findByIdAndUpdate(agentId, { isActive: false }, { new: true });
    }

    async updateAgentAvailability(agentId, timeSlotId, available) {
        return await Agent.findOneAndUpdate(
            { _id: agentId, 'timeSlots._id': timeSlotId },
            { $set: { 'timeSlots.$.available': available } },
            { new: true }
        );
    }

    async addTimeSlot(agentId, timeSlotData) {
        return await Agent.findByIdAndUpdate(
            agentId,
            { $push: { timeSlots: timeSlotData } },
            { new: true }
        );
    }

    async removeTimeSlot(agentId, timeSlotId) {
        return await Agent.findByIdAndUpdate(
            agentId,
            { $pull: { timeSlots: { _id: timeSlotId } } },
            { new: true }
        );
    }

    async getAgentsByArea(city, state = null, limit = 10) {
        const query = {
            isActive: true,
            'address.city': { $regex: city, $options: 'i' }
        };

        if (state) {
            query['address.state'] = { $regex: state, $options: 'i' };
        }

        return await Agent.find(query).limit(limit).sort({ name: 1 });
    }

    async getAgentStats() {
        const totalAgents = await Agent.countDocuments({ isActive: true });
        const inactiveAgents = await Agent.countDocuments({ isActive: false });

        const agentsByCity = await Agent.aggregate([
            { $match: { isActive: true } },
            { $group: { _id: '$address.city', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        const availabilityStats = await Agent.aggregate([
            { $match: { isActive: true } },
            { $unwind: '$timeSlots' },
            {
                $group: {
                    _id: '$timeSlots.available',
                    count: { $sum: 1 }
                }
            }
        ]);

        return {
            totalAgents,
            inactiveAgents,
            agentsByCity,
            availabilityStats
        };
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.toRadians(lat2 - lat1);
        const dLon = this.toRadians(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    generateOneHourSlots(timeSlots, preferredTime = null) {
        const oneHourSlots = [];

        timeSlots.forEach(slot => {
            const startHour = parseInt(slot.startTime.split(':')[0]);
            const startMinute = parseInt(slot.startTime.split(':')[1]);
            const endHour = parseInt(slot.endTime.split(':')[0]);
            const endMinute = parseInt(slot.endTime.split(':')[1]);

            const startTotalMinutes = startHour * 60 + startMinute;
            const endTotalMinutes = endHour * 60 + endMinute;

            for (let currentMinutes = startTotalMinutes; currentMinutes + 60 <= endTotalMinutes; currentMinutes += 60) {
                const slotStartHour = Math.floor(currentMinutes / 60);
                const slotStartMinute = currentMinutes % 60;
                const slotEndHour = Math.floor((currentMinutes + 60) / 60);
                const slotEndMinute = (currentMinutes + 60) % 60;

                const slotStart = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMinute.toString().padStart(2, '0')}`;
                const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMinute.toString().padStart(2, '0')}`;

                oneHourSlots.push({
                    day: slot.day,
                    startTime: slotStart,
                    endTime: slotEnd,
                    duration: '1 hour',
                    available: true
                });
            }
        });

        if (preferredTime) {
            const preferredHour = parseInt(preferredTime.split(':')[0]);
            oneHourSlots.sort((a, b) => {
                const aHour = parseInt(a.startTime.split(':')[0]);
                const bHour = parseInt(b.startTime.split(':')[0]);
                const aDiff = Math.abs(aHour - preferredHour);
                const bDiff = Math.abs(bHour - preferredHour);
                return aDiff - bDiff;
            });
        }

        return oneHourSlots.slice(0, 3);
    }

    async getRoutingDistance(origin, destination) {
        try {
            if (!process.env.GEOCODING_API_KEY || process.env.GEOCODING_API_KEY === 'your_google_maps_api_key_here') {
                return {
                    distance: this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
                    duration: null,
                    isEstimated: true
                };
            }

            const axios = require('axios');
            const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
                params: {
                    origin: `${origin.lat},${origin.lng}`,
                    destination: `${destination.lat},${destination.lng}`,
                    key: process.env.GEOCODING_API_KEY,
                    mode: 'driving',
                    units: 'metric'
                }
            });

            if (response.data.status === 'OK' && response.data.routes.length > 0) {
                const route = response.data.routes[0].legs[0];
                return {
                    distance: route.distance.value, // meters
                    duration: route.duration.value, // seconds
                    isEstimated: false
                };
            } else {
                return {
                    distance: this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
                    duration: null,
                    isEstimated: true
                };
            }
        } catch (error) {
            console.error('Routing API error:', error.message);
            return {
                distance: this.calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng) * 1000,
                duration: null,
                isEstimated: true
            };
        }
    }

    async findClosestAgentByRoad(houseAddress, timeSlot = null, maxDistance = 50000, includeBuildingInfo = false) {
        try {
            let coordinates;

            if (process.env.GEOCODING_API_KEY && process.env.GEOCODING_API_KEY !== 'your_google_maps_api_key_here') {
                coordinates = await this.geocodingService.getCoordinates(houseAddress);
            } else {
                coordinates = this.geocodingService.estimateCoordinates(houseAddress);
            }

            const { latitude, longitude } = coordinates;

            // Get nearby agents using straight-line distance (fast initial filter)
            const nearbyAgents = await this.findNearbyAgents(houseAddress, timeSlot, maxDistance, 10);

            if (nearbyAgents.length === 0) {
                return null;
            }

            // Calculate road distance for top 3 candidates
            const agentsWithRoadDistance = await Promise.all(
                nearbyAgents.slice(0, 3).map(async (agent) => {
                    const roadDistance = await this.getRoutingDistance(
                        { lat: latitude, lng: longitude },
                        { lat: agent.location.coordinates[1], lng: agent.location.coordinates[0] }
                    );

                    return {
                        ...agent,
                        roadDistance: roadDistance.distance,
                        roadDistanceKm: Math.round(roadDistance.distance / 1000 * 100) / 100,
                        travelTimeMinutes: roadDistance.duration ? Math.round(roadDistance.duration / 60) : null,
                        isDistanceEstimated: roadDistance.isEstimated
                    };
                })
            );

            // Sort by road distance and get the closest
            const sortedAgents = agentsWithRoadDistance.sort((a, b) => a.roadDistance - b.roadDistance);
            const closestAgent = sortedAgents[0];

            const result = {
                ...closestAgent,
                houseCoordinates: { latitude, longitude },
                formattedHouseAddress: coordinates.formattedAddress
            };

            // Add building info if requested
            if (includeBuildingInfo) {
                try {
                    const buildingInfo = await this.propertyInfoService.getPropertyInfo(
                        houseAddress,
                        { latitude, longitude }
                    );
                    result.buildingInfo = buildingInfo;
                } catch (error) {
                    console.log('Building info failed:', error.message);
                    result.buildingInfo = {
                        error: 'Building information unavailable',
                        message: error.message
                    };
                }
            }

            return result;

        } catch (error) {
            console.error('Error finding closest agent by road:', error);
            throw error;
        }
    }
}

module.exports = AgentService;