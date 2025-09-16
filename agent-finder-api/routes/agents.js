// routes/agents.js - Complete Routes
const express = require('express');
const AgentController = require('../controllers/agentController');

const router = express.Router();
const agentController = new AgentController();

// ===== SEARCH ENDPOINTS =====

// POST /api/agents/find-closest - Find closest available agent
router.post('/find-closest', agentController.findClosestAgent);

// POST /api/agents/find-nearby - Find multiple nearby agents
router.post('/find-nearby', agentController.findNearbyAgents);

// POST /api/agents/find-closest-by-road - Find closest agent by road distance
router.post('/find-closest-by-road', agentController.findClosestAgentByRoad);

// POST /api/agents/building-info - Get building information for an address
router.post('/building-info', agentController.getBuildingInfo);

// ===== AGENT CRUD ENDPOINTS =====

// POST /api/agents - Create new agent
router.post('/', agentController.createAgent);

// GET /api/agents - Get all active agents
router.get('/', agentController.getAllAgents);

// GET /api/agents/:agentId - Get agent by ID
router.get('/:agentId', agentController.getAgentById);

// PUT /api/agents/:agentId - Update agent
router.put('/:agentId', agentController.updateAgent);

// DELETE /api/agents/:agentId - Deactivate agent
router.delete('/:agentId', agentController.deleteAgent);

// ===== AVAILABILITY MANAGEMENT =====

// PUT /api/agents/availability - Update agent time slot availability
router.put('/availability', agentController.updateAvailability);

// POST /api/agents/:agentId/timeslots - Add time slot to agent
router.post('/:agentId/timeslots', agentController.addTimeSlot);

// DELETE /api/agents/:agentId/timeslots/:timeSlotId - Remove time slot from agent
router.delete('/:agentId/timeslots/:timeSlotId', agentController.removeTimeSlot);

// ===== SEARCH & ANALYTICS ENDPOINTS =====

// GET /api/agents/search/area - Get agents by city/state
router.get('/search/area', agentController.getAgentsByArea);

// GET /api/agents/analytics/stats - Get agent statistics
router.get('/analytics/stats', agentController.getAgentStats);

module.exports = router;

// ====================================================================
// API Documentation - Example Usage
// ====================================================================

/*

========== SEARCH ENDPOINTS ==========

1. Find Closest Agent:
POST /api/agents/find-closest
{
  "houseAddress": "Republic Square, Yerevan",
  "timeSlot": {
    "day": "monday",
    "time": "14:00"
  },
  "maxDistance": 30000,
  "includeBuildingInfo": true
}

2. Find Multiple Nearby Agents:
POST /api/agents/find-nearby
{
  "houseAddress": "Northern Avenue, Yerevan",
  "timeSlot": {
    "day": "tuesday",
    "time": "10:00"
  },
  "maxDistance": 25000,
  "limit": 3
}

3. Get Building Info Only:
POST /api/agents/building-info
{
  "address": "15 Abovyan Street, Yerevan",
  "coordinates": {
    "latitude": 40.1792,
    "longitude": 44.5152
  }
}

========== AGENT MANAGEMENT ==========

4. Create Agent:
POST /api/agents
{
  "name": "John Doe",
  "phone": "+374-55-123-456",
  "address": {
    "street": "10 Main Street",
    "city": "Yerevan",
    "state": "Yerevan",
    "zipCode": "0001",
    "country": "Armenia"
  },
  "timeSlots": [
    {
      "day": "monday",
      "startTime": "09:00",
      "endTime": "17:00",
      "available": true
    }
  ]
}

5. Get All Agents:
GET /api/agents

6. Get Agent by ID:
GET /api/agents/64f123abc456def789012345

7. Update Agent:
PUT /api/agents/64f123abc456def789012345
{
  "name": "John Smith",
  "phone": "+374-55-123-789"
}

8. Delete Agent (Deactivate):
DELETE /api/agents/64f123abc456def789012345

========== AVAILABILITY MANAGEMENT ==========

9. Update Time Slot Availability:
PUT /api/agents/availability
{
  "agentId": "64f123abc456def789012345",
  "timeSlotId": "64f456def789abc012345678",
  "available": false
}

10. Add Time Slot:
POST /api/agents/64f123abc456def789012345/timeslots
{
  "day": "saturday",
  "startTime": "10:00",
  "endTime": "16:00",
  "available": true
}

11. Remove Time Slot:
DELETE /api/agents/64f123abc456def789012345/timeslots/64f456def789abc012345678

========== SEARCH & ANALYTICS ==========

12. Get Agents by Area:
GET /api/agents/search/area?city=Yerevan&state=Yerevan&limit=10

13. Get Agent Statistics:
GET /api/agents/analytics/stats

========== RESPONSE EXAMPLES ==========

Find Closest Agent Response:
{
  "success": true,
  "agent": {
    "id": "64f123abc456def789012345",
    "name": "Armen Sargsyan",
    "phone": "+374-55-123-456",
    "address": {
      "street": "15 Abovyan Street",
      "city": "Yerevan",
      "state": "Yerevan",
      "zipCode": "0001",
      "country": "Armenia"
    },
    "distanceKm": 0.8,
    "availableTimeSlots": [
      {
        "day": "monday",
        "startTime": "09:00",
        "endTime": "18:00",
        "available": true
      }
    ],
    "buildingInfo": {
      "source": "google",
      "buildingType": "apartment",
      "isResidential": true,
      "levels": 5
    }
  },
  "searchInfo": {
    "houseAddress": "Republic Square, Yerevan 0010, Armenia",
    "houseCoordinates": {
      "latitude": 40.1777,
      "longitude": 44.5133
    },
    "searchRadius": 30000
  }
}

Agent Statistics Response:
{
  "success": true,
  "stats": {
    "totalAgents": 8,
    "inactiveAgents": 0,
    "agentsByCity": [
      { "_id": "Yerevan", "count": 8 }
    ],
    "availabilityStats": [
      { "_id": true, "count": 35 },
      { "_id": false, "count": 5 }
    ]
  }
}

Error Response Example:
{
  "error": "House address is required"
}

{
  "error": "No available agents found in the specified area",
  "searchCriteria": {
    "houseAddress": "Some Remote Location",
    "timeSlot": {
      "day": "monday",
      "time": "14:00"
    },
    "maxDistance": 50000
  }
}

*/