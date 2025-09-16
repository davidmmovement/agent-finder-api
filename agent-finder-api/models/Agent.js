const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
    day: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    },
    available: {
        type: Boolean,
        default: true
    }
});

const agentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    address: {
        street: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, default: 'USA' }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true,
            index: '2dsphere'
        }
    },
    timeSlots: [timeSlotSchema],
    isActive: {
        type: Boolean,
        default: true
    },
    maxRadius: {
        type: Number,
        default: 50000 // 50km in meters
    }
}, {
    timestamps: true
});

agentSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Agent', agentSchema);