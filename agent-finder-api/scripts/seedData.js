const mongoose = require('mongoose');
const Agent = require('../models/Agent');
require('dotenv').config();

const sampleAgents = [
    {
        name: "John Smith",
        phone: "+1-555-0101",
        address: {
            street: "123 Main St",
            city: "New York",
            state: "NY",
            zipCode: "10001"
        },
        location: {
            type: "Point",
            coordinates: [-74.0060, 40.7128]
        },
        timeSlots: [
            { day: "monday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "tuesday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "wednesday", startTime: "09:00", endTime: "17:00", available: false },
            { day: "thursday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "friday", startTime: "09:00", endTime: "15:00", available: true }
        ]
    },
    {
        name: "Sarah Johnson",
        phone: "+1-555-0102",
        address: {
            street: "456 Oak Ave",
            city: "Brooklyn",
            state: "NY",
            zipCode: "11201"
        },
        location: {
            type: "Point",
            coordinates: [-73.9442, 40.6892]
        },
        timeSlots: [
            { day: "monday", startTime: "08:00", endTime: "16:00", available: true },
            { day: "tuesday", startTime: "08:00", endTime: "16:00", available: true },
            { day: "wednesday", startTime: "10:00", endTime: "18:00", available: true },
            { day: "thursday", startTime: "08:00", endTime: "16:00", available: true },
            { day: "friday", startTime: "08:00", endTime: "14:00", available: true },
            { day: "saturday", startTime: "09:00", endTime: "13:00", available: true }
        ]
    }
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-finder');

        await Agent.deleteMany({});

        await Agent.insertMany(sampleAgents);

        console.log('Sample data inserted successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();