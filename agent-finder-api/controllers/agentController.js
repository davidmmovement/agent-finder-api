const AgentService = require('../services/agentService');

class AgentController {
    constructor() {
        this.agentService = new AgentService();
    }

    // Find closest agent
    findClosestAgent = async (req, res) => {
        try {
            const { houseAddress, timeSlot, maxDistance, includeBuildingInfo } = req.body;

            if (!houseAddress) {
                return res.status(400).json({
                    error: 'House address is required'
                });
            }

            // Validate timeSlot format if provided
            if (timeSlot) {
                const validationError = this.validateTimeSlot(timeSlot);
                if (validationError) {
                    return res.status(400).json({ error: validationError });
                }
            }

            const agent = await this.agentService.findClosestAgent(
                houseAddress,
                timeSlot,
                maxDistance || 50000,
                includeBuildingInfo || false
            );

            if (!agent) {
                return res.status(404).json({
                    message: 'No available agents found in the specified area',
                    searchCriteria: {
                        houseAddress,
                        timeSlot,
                        maxDistance: maxDistance || 50000
                    }
                });
            }

            res.json({
                success: true,
                agent: {
                    id: agent._id,
                    name: agent.name,
                    phone: agent.phone,
                    address: agent.address,
                    distanceKm: agent.distanceKm,
                    availableTimeSlots: agent.availableTimeSlots,
                    buildingInfo: agent.buildingInfo
                },
                searchInfo: {
                    houseAddress: agent.formattedHouseAddress,
                    houseCoordinates: agent.houseCoordinates,
                    searchRadius: maxDistance || 50000
                }
            });

        } catch (error) {
            console.error('Controller error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    };

    // Find multiple nearby agents
    findNearbyAgents = async (req, res) => {
        try {
            const { houseAddress, timeSlot, maxDistance, limit } = req.body;

            if (!houseAddress) {
                return res.status(400).json({
                    error: 'House address is required'
                });
            }

            if (timeSlot) {
                const validationError = this.validateTimeSlot(timeSlot);
                if (validationError) {
                    return res.status(400).json({ error: validationError });
                }
            }

            const agents = await this.agentService.findNearbyAgents(
                houseAddress,
                timeSlot,
                maxDistance || 50000,
                limit || 5
            );

            res.json({
                success: true,
                count: agents.length,
                agents: agents.map(agent => ({
                    id: agent._id,
                    name: agent.name,
                    phone: agent.phone,
                    address: agent.address,
                    distanceKm: agent.distanceKm,
                    availableTimeSlots: agent.availableTimeSlots
                })),
                searchCriteria: {
                    houseAddress,
                    timeSlot,
                    maxDistance: maxDistance || 50000,
                    limit: limit || 5
                }
            });

        } catch (error) {
            console.error('Find nearby agents error:', error);
            res.status(500).json({
                error: 'Failed to find nearby agents',
                message: error.message
            });
        }
    };

    // Get building information only
    getBuildingInfo = async (req, res) => {
        try {
            const { address, coordinates } = req.body;

            if (!address) {
                return res.status(400).json({
                    error: 'Address is required'
                });
            }

            const buildingInfo = await this.agentService.getBuildingInfo(address, coordinates);

            res.json({
                success: true,
                buildingInfo
            });

        } catch (error) {
            console.error('Building info error:', error);
            res.status(500).json({
                error: 'Failed to get building information',
                message: error.message
            });
        }
    };

    // Create new agent
    createAgent = async (req, res) => {
        try {
            const validationError = this.validateAgentData(req.body);
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            const agent = await this.agentService.createAgent(req.body);
            res.status(201).json({
                success: true,
                agent
            });
        } catch (error) {
            console.error('Create agent error:', error);

            if (error.code === 11000) {
                return res.status(400).json({
                    error: 'Phone number already exists'
                });
            }

            res.status(500).json({
                error: 'Failed to create agent',
                message: error.message
            });
        }
    };

    // Get all agents
    getAllAgents = async (req, res) => {
        try {
            const agents = await this.agentService.getAllAgents();
            res.json({
                success: true,
                count: agents.length,
                agents
            });
        } catch (error) {
            console.error('Get agents error:', error);
            res.status(500).json({
                error: 'Failed to fetch agents',
                message: error.message
            });
        }
    };

    // Get agent by ID
    getAgentById = async (req, res) => {
        try {
            const { agentId } = req.params;
            const agent = await this.agentService.getAgentById(agentId);

            if (!agent) {
                return res.status(404).json({
                    error: 'Agent not found'
                });
            }

            res.json({
                success: true,
                agent
            });
        } catch (error) {
            console.error('Get agent error:', error);
            res.status(500).json({
                error: 'Failed to fetch agent',
                message: error.message
            });
        }
    };

    // Update agent
    updateAgent = async (req, res) => {
        try {
            const { agentId } = req.params;
            const agent = await this.agentService.updateAgent(agentId, req.body);

            if (!agent) {
                return res.status(404).json({
                    error: 'Agent not found'
                });
            }

            res.json({
                success: true,
                agent
            });
        } catch (error) {
            console.error('Update agent error:', error);
            res.status(500).json({
                error: 'Failed to update agent',
                message: error.message
            });
        }
    };

    // Delete (deactivate) agent
    deleteAgent = async (req, res) => {
        try {
            const { agentId } = req.params;
            const agent = await this.agentService.deleteAgent(agentId);

            if (!agent) {
                return res.status(404).json({
                    error: 'Agent not found'
                });
            }

            res.json({
                success: true,
                message: 'Agent deactivated successfully',
                agent
            });
        } catch (error) {
            console.error('Delete agent error:', error);
            res.status(500).json({
                error: 'Failed to delete agent',
                message: error.message
            });
        }
    };

    // Update agent availability
    updateAvailability = async (req, res) => {
        try {
            const { agentId, timeSlotId, available } = req.body;

            if (!agentId || !timeSlotId || typeof available !== 'boolean') {
                return res.status(400).json({
                    error: 'agentId, timeSlotId, and available (boolean) are required'
                });
            }

            const agent = await this.agentService.updateAgentAvailability(
                agentId,
                timeSlotId,
                available
            );

            if (!agent) {
                return res.status(404).json({
                    error: 'Agent or time slot not found'
                });
            }

            res.json({
                success: true,
                message: `Time slot ${available ? 'enabled' : 'disabled'} successfully`,
                agent
            });
        } catch (error) {
            console.error('Update availability error:', error);
            res.status(500).json({
                error: 'Failed to update availability',
                message: error.message
            });
        }
    };

    // Add time slot to agent
    addTimeSlot = async (req, res) => {
        try {
            const { agentId } = req.params;
            const timeSlotData = req.body;

            const validationError = this.validateTimeSlotData(timeSlotData);
            if (validationError) {
                return res.status(400).json({ error: validationError });
            }

            const agent = await this.agentService.addTimeSlot(agentId, timeSlotData);

            if (!agent) {
                return res.status(404).json({
                    error: 'Agent not found'
                });
            }

            res.json({
                success: true,
                message: 'Time slot added successfully',
                agent
            });
        } catch (error) {
            console.error('Add time slot error:', error);
            res.status(500).json({
                error: 'Failed to add time slot',
                message: error.message
            });
        }
    };

    // Remove time slot from agent
    removeTimeSlot = async (req, res) => {
        try {
            const { agentId, timeSlotId } = req.params;

            const agent = await this.agentService.removeTimeSlot(agentId, timeSlotId);

            if (!agent) {
                return res.status(404).json({
                    error: 'Agent not found'
                });
            }

            res.json({
                success: true,
                message: 'Time slot removed successfully',
                agent
            });
        } catch (error) {
            console.error('Remove time slot error:', error);
            res.status(500).json({
                error: 'Failed to remove time slot',
                message: error.message
            });
        }
    };

    // Get agents by area
    getAgentsByArea = async (req, res) => {
        try {
            const { city, state, limit } = req.query;

            if (!city) {
                return res.status(400).json({
                    error: 'City parameter is required'
                });
            }

            const agents = await this.agentService.getAgentsByArea(city, state, parseInt(limit) || 10);

            res.json({
                success: true,
                count: agents.length,
                agents,
                searchCriteria: { city, state, limit: limit || 10 }
            });
        } catch (error) {
            console.error('Get agents by area error:', error);
            res.status(500).json({
                error: 'Failed to fetch agents by area',
                message: error.message
            });
        }
    };

    // Get agent statistics
    getAgentStats = async (req, res) => {
        try {
            const stats = await this.agentService.getAgentStats();
            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Get stats error:', error);
            res.status(500).json({
                error: 'Failed to fetch statistics',
                message: error.message
            });
        }
    };

    // Validation helper methods
    validateTimeSlot(timeSlot) {
        if (!timeSlot.day || !timeSlot.time) {
            return 'TimeSlot must include both day and time';
        }

        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(timeSlot.day.toLowerCase())) {
            return 'Invalid day. Must be one of: ' + validDays.join(', ');
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeSlot.time)) {
            return 'Invalid time format. Use HH:MM (24-hour format)';
        }

        return null;
    }

    validateAgentData(agentData) {
        if (!agentData.name || !agentData.phone || !agentData.address) {
            return 'Name, phone, and address are required';
        }

        if (!agentData.address.street || !agentData.address.city || !agentData.address.state) {
            return 'Address must include street, city, and state';
        }

        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(agentData.phone)) {
            return 'Invalid phone number format';
        }

        return null;
    }

    validateTimeSlotData(timeSlotData) {
        const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        if (!validDays.includes(timeSlotData.day?.toLowerCase())) {
            return 'Invalid day. Must be one of: ' + validDays.join(', ');
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(timeSlotData.startTime) || !timeRegex.test(timeSlotData.endTime)) {
            return 'Invalid time format. Use HH:MM (24-hour format)';
        }

        if (timeSlotData.startTime >= timeSlotData.endTime) {
            return 'Start time must be before end time';
        }

        return null;
    }

    findClosestAgentByRoad = async (req, res) => {
        try {
            const { houseAddress, timeSlot, maxDistance, includeBuildingInfo } = req.body;

            if (!houseAddress) {
                return res.status(400).json({
                    error: 'House address is required'
                });
            }

            if (timeSlot) {
                const validationError = this.validateTimeSlot(timeSlot);
                if (validationError) {
                    return res.status(400).json({ error: validationError });
                }
            }

            const agent = await this.agentService.findClosestAgentByRoad(
                houseAddress,
                timeSlot,
                maxDistance || 50000,
                includeBuildingInfo || false
            );

            if (!agent) {
                return res.status(404).json({
                    message: 'No available agents found in the specified area',
                    searchCriteria: {
                        houseAddress,
                        timeSlot,
                        maxDistance: maxDistance || 50000
                    }
                });
            }

            res.json({
                success: true,
                agent: {
                    id: agent._id,
                    name: agent.name,
                    phone: agent.phone,
                    address: agent.address,
                    straightLineDistanceKm: agent.distanceKm,
                    roadDistanceKm: agent.roadDistanceKm,
                    travelTimeMinutes: agent.travelTimeMinutes,
                    isDistanceEstimated: agent.isDistanceEstimated,
                    availableTimeSlots: agent.availableTimeSlots,
                    buildingInfo: agent.buildingInfo
                },
                searchInfo: {
                    houseAddress: agent.formattedHouseAddress,
                    houseCoordinates: agent.houseCoordinates,
                    searchRadius: maxDistance || 50000
                }
            });

        } catch (error) {
            console.error('Controller error:', error);
            res.status(500).json({
                error: 'Internal server error',
                message: error.message
            });
        }
    };
}

module.exports = AgentController;