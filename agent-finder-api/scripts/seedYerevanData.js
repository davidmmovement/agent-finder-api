const mongoose = require('mongoose');
const Agent = require('../models/Agent');
require('dotenv').config();

const yerevanAgents = [
    {
        name: "Armen Sargsyan",
        phone: "+374-55-123-456",
        address: {
            street: "15 Abovyan Street",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0001",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5152, 40.1792] // [longitude, latitude] - Central Yerevan
        },
        timeSlots: [
            { day: "monday", startTime: "09:00", endTime: "18:00", available: true },
            { day: "tuesday", startTime: "09:00", endTime: "18:00", available: true },
            { day: "wednesday", startTime: "10:00", endTime: "16:00", available: false },
            { day: "thursday", startTime: "09:00", endTime: "18:00", available: true },
            { day: "friday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "saturday", startTime: "10:00", endTime: "14:00", available: true }
        ]
    },
    {
        name: "Anahit Petrosyan",
        phone: "+374-55-234-567",
        address: {
            street: "28 Mashtots Avenue",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0015",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5133, 40.1811] // Near Opera House
        },
        timeSlots: [
            { day: "monday", startTime: "08:30", endTime: "17:30", available: true },
            { day: "tuesday", startTime: "08:30", endTime: "17:30", available: true },
            { day: "wednesday", startTime: "08:30", endTime: "17:30", available: true },
            { day: "thursday", startTime: "08:30", endTime: "17:30", available: false },
            { day: "friday", startTime: "08:30", endTime: "16:00", available: true },
            { day: "saturday", startTime: "09:00", endTime: "13:00", available: true }
        ]
    },
    {
        name: "Gevorg Hakobyan",
        phone: "+374-55-345-678",
        address: {
            street: "5 Northern Avenue",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0010",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5146, 40.1776] // Northern Avenue
        },
        timeSlots: [
            { day: "monday", startTime: "10:00", endTime: "19:00", available: true },
            { day: "tuesday", startTime: "10:00", endTime: "19:00", available: true },
            { day: "wednesday", startTime: "10:00", endTime: "19:00", available: true },
            { day: "thursday", startTime: "10:00", endTime: "19:00", available: true },
            { day: "friday", startTime: "10:00", endTime: "18:00", available: false },
            { day: "sunday", startTime: "11:00", endTime: "16:00", available: true }
        ]
    },
    {
        name: "Sona Grigoryan",
        phone: "+374-55-456-789",
        address: {
            street: "12 Sayat-Nova Avenue",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0001",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5108, 40.1833] // Sayat-Nova Avenue
        },
        timeSlots: [
            { day: "monday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "tuesday", startTime: "09:00", endTime: "17:00", available: false },
            { day: "wednesday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "thursday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "friday", startTime: "09:00", endTime: "17:00", available: true },
            { day: "saturday", startTime: "10:00", endTime: "15:00", available: true },
            { day: "sunday", startTime: "12:00", endTime: "17:00", available: true }
        ]
    },
    {
        name: "Davit Karapetyan",
        phone: "+374-55-567-890",
        address: {
            street: "7 Cascade Steps",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0009",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5156, 40.1865] // Near Cascade
        },
        timeSlots: [
            { day: "monday", startTime: "08:00", endTime: "16:00", available: true },
            { day: "tuesday", startTime: "08:00", endTime: "16:00", available: true },
            { day: "wednesday", startTime: "08:00", endTime: "16:00", available: false },
            { day: "thursday", startTime: "08:00", endTime: "16:00", available: true },
            { day: "friday", startTime: "08:00", endTime: "15:00", available: true }
        ]
    },
    {
        name: "Lusine Vardanyan",
        phone: "+374-55-678-901",
        address: {
            street: "22 Tumanyan Street",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0001",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5094, 40.1801] // Tumanyan Street
        },
        timeSlots: [
            { day: "monday", startTime: "11:00", endTime: "20:00", available: true },
            { day: "tuesday", startTime: "11:00", endTime: "20:00", available: true },
            { day: "wednesday", startTime: "11:00", endTime: "20:00", available: true },
            { day: "thursday", startTime: "11:00", endTime: "20:00", available: false },
            { day: "friday", startTime: "11:00", endTime: "20:00", available: true },
            { day: "saturday", startTime: "12:00", endTime: "18:00", available: true },
            { day: "sunday", startTime: "13:00", endTime: "19:00", available: true }
        ]
    },
    {
        name: "Tigran Ghukasyan",
        phone: "+374-55-789-012",
        address: {
            street: "3 Republic Square",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0010",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5133, 40.1777] // Republic Square
        },
        timeSlots: [
            { day: "monday", startTime: "07:30", endTime: "16:30", available: true },
            { day: "tuesday", startTime: "07:30", endTime: "16:30", available: true },
            { day: "wednesday", startTime: "07:30", endTime: "16:30", available: true },
            { day: "thursday", startTime: "07:30", endTime: "16:30", available: true },
            { day: "friday", startTime: "07:30", endTime: "15:30", available: false },
            { day: "saturday", startTime: "09:00", endTime: "14:00", available: true }
        ]
    },
    {
        name: "Karine Manukyan",
        phone: "+374-55-890-123",
        address: {
            street: "18 Amiryan Street",
            city: "Yerevan",
            state: "Yerevan",
            zipCode: "0010",
            country: "Armenia"
        },
        location: {
            type: "Point",
            coordinates: [44.5119, 40.1794] // Amiryan Street
        },
        timeSlots: [
            { day: "tuesday", startTime: "09:30", endTime: "18:30", available: true },
            { day: "wednesday", startTime: "09:30", endTime: "18:30", available: true },
            { day: "thursday", startTime: "09:30", endTime: "18:30", available: false },
            { day: "friday", startTime: "09:30", endTime: "18:30", available: true },
            { day: "saturday", startTime: "10:00", endTime: "16:00", available: true },
            { day: "sunday", startTime: "11:00", endTime: "17:00", available: true }
        ]
    }
];

async function seedYerevanData() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/agent-finder');

        await Agent.deleteMany({});
        console.log('Cleared existing agent data');

        await Agent.insertMany(yerevanAgents);

        console.log(`Successfully inserted ${yerevanAgents.length} agents in Yerevan`);
        console.log('\nAgent locations:');
        yerevanAgents.forEach((agent, index) => {
            console.log(`${index + 1}. ${agent.name} - ${agent.address.street}, ${agent.address.city}`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error seeding Yerevan data:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    seedYerevanData();
}

module.exports = { yerevanAgents, seedYerevanData };


/* 
Test Request 1 - Near Republic Square:
POST http://localhost:3000/api/agents/find-closest
{
  "houseAddress": "Republic Square, Yerevan",
  "timeSlot": {
    "day": "monday", 
    "time": "14:00"
  },
  "maxDistance": 5000
}

Test Request 2 - Near Northern Avenue:
{
  "houseAddress": "Northern Avenue 10, Yerevan",
  "timeSlot": {
    "day": "wednesday",
    "time": "11:00" 
  }
}

Test Request 3 - Near Cascade:
{
  "houseAddress": "Cascade Complex, Yerevan",
  "maxDistance": 10000
}

Test Request 4 - Without time slot:
{
  "houseAddress": "Opera House, Yerevan"
}

Test Request 5 - Saturday availability:
{
  "houseAddress": "Mashtots Avenue 20, Yerevan",
  "timeSlot": {
    "day": "saturday",
    "time": "12:00"
  }
}
*/