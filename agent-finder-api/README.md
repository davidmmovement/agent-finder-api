# Agent Finder API

A comprehensive Node.js API for finding the closest available real estate agents based on location and time slots, with integrated building and property information.

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [Search Endpoints](#search-endpoints)
  - [Agent Management](#agent-management)
  - [Time Slot Management](#time-slot-management)
  - [Analytics](#analytics)
- [Request/Response Examples](#requestresponse-examples)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Architecture](#architecture)
- [Contributing](#contributing)

## Features

- **Geospatial Agent Search**: Find closest available agents using MongoDB geospatial queries
- **Property Information**: Get building area, type, and details using OpenStreetMap and Google Places APIs
- **Time Slot Management**: Filter agents by availability and manage schedules
- **Multiple Search Options**: Single closest agent or multiple nearby agents
- **Comprehensive CRUD**: Full agent management system
- **Analytics**: Agent statistics and area-based search
- **Address Geocoding**: Convert addresses to coordinates with fallback options
- **RESTful API**: Clean, documented endpoints with proper error handling

## Tech Stack

- **Runtime**: Node.js 16+
- **Framework**: Express.js
- **Database**: MongoDB with geospatial indexing
- **ODM**: Mongoose
- **External APIs**: Google Maps/Places API, OpenStreetMap Overpass API
- **Security**: Helmet, CORS, Rate limiting

## Installation

```bash
# Clone the repository
git clone https://github.com/davidmmovement/agent-finder-api.git
cd agent-finder-api

# Install dependencies
npm install

# Create required directories
mkdir -p services controllers routes scripts models
```

## Environment Setup

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb://localhost:27017/agent-finder
PORT=3000
GEOCODING_API_KEY=your_google_maps_api_key_here
```

## Quick Start

1. **Start MongoDB**:
   ```bash
   # Local MongoDB
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

2. **Seed test data**:
   ```bash
   npm run seed
   ```

3. **Start the server**:
   ```bash
   npm start
   # or for development
   npm run dev
   ```

4. **Verify installation**:
   ```bash
   curl http://localhost:3000/health
   ```

## API Reference

Base URL: `http://localhost:3000/api/agents`

### Search Endpoints

#### Find Closest Agent

Find the single closest available agent to a given address.

```http
POST /api/agents/find-closest
```

**Request Body:**
```json
{
  "houseAddress": "Republic Square, Yerevan",
  "timeSlot": {
    "day": "monday",
    "time": "14:00"
  },
  "maxDistance": 30000,
  "includeBuildingInfo": true
}
```

**Parameters:**
- `houseAddress` (required): Target address for search
- `timeSlot` (optional): Filter by agent availability
  - `day`: monday-sunday
  - `time`: HH:MM (24-hour format)
- `maxDistance` (optional): Search radius in meters (default: 50000)
- `includeBuildingInfo` (optional): Include property details (default: false)

**Response:**
```json
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
    "availableTimeSlots": [...],
    "buildingInfo": {...}
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
```

#### Find Closest Agent by Road

Find the single closest available agent to a given address.

```http
POST /api/agents/find-closest-by-road
```

**Request Body:**
```json
{
  "houseAddress": "40 Marshal Baghramyan Ave, Yerevan 0019",
  "timeSlot": {
    "day": "monday",
    "time": "14:00"
  }
}
```

**Parameters:**
- `houseAddress` (required): Target address for search
- `timeSlot` (optional): Filter by agent availability
  - `day`: monday-sunday
  - `time`: HH:MM (24-hour format)
- `maxDistance` (optional): Search radius in meters (default: 50000)
- `includeBuildingInfo` (optional): Include property details (default: false)

**Response:**
```json
{
    "success": true,
    "agent": {
        "id": "68c96ef97afec78e4e46f2b0",
        "name": "Sona Grigoryan",
        "phone": "+374-55-456-789",
        "address": {
            "street": "12 Sayat-Nova Avenue",
            "city": "Yerevan",
            "state": "Yerevan",
            "zipCode": "0001",
            "country": "Armenia"
        },
        "straightLineDistanceKm": 1.27,
        "roadDistanceKm": 5.45,
        "travelTimeMinutes": 14,
        "isDistanceEstimated": false,
        "availableTimeSlots": [
            {
                "day": "monday",
                "startTime": "14:00",
                "endTime": "15:00",
                "duration": "1 hour",
                "available": true
            },
            {
                "day": "monday",
                "startTime": "13:00",
                "endTime": "14:00",
                "duration": "1 hour",
                "available": true
            },
            {
                "day": "monday",
                "startTime": "15:00",
                "endTime": "16:00",
                "duration": "1 hour",
                "available": true
            }
        ]
    },
    "searchInfo": {
        "houseAddress": "40 Marshal Baghramyan Ave, Yerevan 0019, Armenia",
        "houseCoordinates": {
            "latitude": 40.1935253,
            "longitude": 44.5041588
        },
        "searchRadius": 50000
    }
}
```


#### Find Nearby Agents

Find multiple agents within a specified radius.

```http
POST /api/agents/find-nearby
```

**Request Body:**
```json
{
  "houseAddress": "Northern Avenue, Yerevan",
  "timeSlot": {
    "day": "tuesday",
    "time": "10:00"
  },
  "maxDistance": 25000,
  "limit": 5
}
```

**Parameters:**
- Same as find-closest, plus:
- `limit` (optional): Maximum number of agents to return (default: 5)

#### Get Building Information

Get detailed property information for a specific address.

```http
POST /api/agents/building-info
```

**Request Body:**
```json
{
  "address": "15 Abovyan Street, Yerevan",
  "coordinates": {
    "latitude": 40.1792,
    "longitude": 44.5152
  }
}
```

**Parameters:**
- `address` (required): Property address
- `coordinates` (optional): Precise coordinates for better results

**Response:**
```json
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
      "category": {
        "isResidential": true,
        "isCommercial": false
      }
    },
    "sources": ["osm"]
  }
}
```

### Agent Management

#### Create Agent

```http
POST /api/agents
```

**Request Body:**
```json
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
```

#### Get All Agents

```http
GET /api/agents
```

#### Get Agent by ID

```http
GET /api/agents/{agentId}
```

#### Update Agent

```http
PUT /api/agents/{agentId}
```

#### Delete Agent (Deactivate)

```http
DELETE /api/agents/{agentId}
```

### Time Slot Management

#### Update Availability

```http
PUT /api/agents/availability
```

**Request Body:**
```json
{
  "agentId": "64f123abc456def789012345",
  "timeSlotId": "64f456def789abc012345678",
  "available": false
}
```

#### Add Time Slot

```http
POST /api/agents/{agentId}/timeslots
```

**Request Body:**
```json
{
  "day": "saturday",
  "startTime": "10:00",
  "endTime": "16:00",
  "available": true
}
```

#### Remove Time Slot

```http
DELETE /api/agents/{agentId}/timeslots/{timeSlotId}
```

### Analytics

#### Get Agents by Area

```http
GET /api/agents/search/area?city=Yerevan&state=Yerevan&limit=10
```

#### Get Statistics

```http
GET /api/agents/analytics/stats
```

**Response:**
```json
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
```

## Request/Response Examples

### Successful Search Response

```json
{
  "success": true,
  "agent": {
    "id": "64f123abc456def789012345",
    "name": "Tigran Ghukasyan",
    "phone": "+374-55-789-012",
    "address": {
      "street": "3 Republic Square",
      "city": "Yerevan",
      "state": "Yerevan",
      "zipCode": "0010",
      "country": "Armenia"
    },
    "distanceKm": 0.15,
    "availableTimeSlots": [
      {
        "day": "monday",
        "startTime": "07:30",
        "endTime": "16:30",
        "available": true
      }
    ]
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
```

### Multiple Agents Response

```json
{
  "success": true,
  "count": 3,
  "agents": [
    {
      "id": "64f123abc456def789012345",
      "name": "Agent 1",
      "distanceKm": 0.8,
      "availableTimeSlots": [...]
    },
    {
      "id": "64f456def789abc012345678",
      "name": "Agent 2", 
      "distanceKm": 1.2,
      "availableTimeSlots": [...]
    }
  ],
  "searchCriteria": {
    "houseAddress": "Northern Avenue, Yerevan",
    "maxDistance": 25000,
    "limit": 3
  }
}
```

## Error Handling

### Common Error Responses

**400 Bad Request:**
```json
{
  "error": "House address is required"
}
```

**404 Not Found:**
```json
{
  "error": "No available agents found in the specified area",
  "searchCriteria": {
    "houseAddress": "Remote Location",
    "timeSlot": {
      "day": "monday",
      "time": "14:00"
    },
    "maxDistance": 50000
  }
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal server error",
  "message": "Database connection failed"
}
```

### Validation Errors

**Invalid Time Format:**
```json
{
  "error": "Invalid time format. Use HH:MM (24-hour format)"
}
```

**Invalid Day:**
```json
{
  "error": "Invalid day. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday"
}
```

## Testing

### Using curl

```bash
# Health check
curl http://localhost:3000/health

# Find closest agent
curl -X POST http://localhost:3000/api/agents/find-closest \
  -H "Content-Type: application/json" \
  -d '{
    "houseAddress": "Republic Square, Yerevan",
    "timeSlot": {
      "day": "monday",
      "time": "14:00"
    }
  }'

# Get building info
curl -X POST http://localhost:3000/api/agents/building-info \
  -H "Content-Type: application/json" \
  -d '{"address": "15 Abovyan Street, Yerevan"}'
```

### Test Addresses (Yerevan)

Use these addresses for testing different scenarios:

- `"Republic Square, Yerevan"` - Central location
- `"Northern Avenue 5, Yerevan"` - Commercial area  
- `"Cascade Complex, Yerevan"` - Tourist area
- `"Opera House, Yerevan"` - Cultural district
- `"Mashtots Avenue 25, Yerevan"` - Main boulevard

### Test Time Slots

Different availability scenarios:

- Monday 14:00 - Multiple agents available
- Wednesday 12:00 - Some agents unavailable
- Saturday 11:00 - Limited availability
- Sunday 15:00 - Minimal availability

## Architecture

### Project Structure

```
agent-finder-api/
├── package.json
├── .env
├── server.js
├── models/
│   └── Agent.js
├── services/
│   ├── agentService.js
│   ├── geocoding.js
│   └── propertyInfoService.js
├── controllers/
│   └── agentController.js
├── routes/
│   └── agents.js
└── scripts/
    └── seedYerevanData.js
```

### Key Components

1. **AgentService**: Core business logic and geospatial queries
2. **PropertyInfoService**: Building information from multiple sources
3. **GeocodingService**: Address to coordinate conversion
4. **AgentController**: HTTP request handling and validation
5. **Agent Model**: MongoDB schema with geospatial indexing

### Database Schema

```javascript
{
  name: String,
  phone: String (unique),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  location: {
    type: "Point",
    coordinates: [longitude, latitude]
  },
  timeSlots: [{
    day: String,
    startTime: String,
    endTime: String,
    available: Boolean
  }],
  isActive: Boolean,
  maxRadius: Number
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Seed test data
npm run seed

# Run tests (when available)
npm test
```

### Code Style

- Use ES6+ features
- Follow RESTful API conventions
- Include comprehensive error handling
- Add JSDoc comments for functions
- Validate all inputs
- Use consistent naming conventions

## License

MIT License - see LICENSE file for details.

## Support

For questions or issues:

1. Check existing [Issues](https://github.com/davidmmovement/agent-finder-api/issues)
2. Create a new issue with detailed description
3. Include request/response examples and error messages
4. Specify your environment (Node.js version, MongoDB version, etc.)

## Changelog

### v1.0.0
- Initial release
- Basic agent search functionality
- Property information integration
- Complete CRUD operations
- Analytics endpoints
- Comprehensive documentation
