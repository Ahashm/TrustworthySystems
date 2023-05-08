const mongoose = require('mongoose');

const heartbeatSchema = new mongoose.Schema({
    System_Information: {
        cpuFreq: Number,
        freeMem: Number,
        heapSize: Number,
        dateTime: Date
    },
    Wifi_Information: {
        ssid: String,
        signalStrength: Number,
        ipAddress: String
    },
    States: {
        RFID: Boolean,
        doorLocked: Boolean,
        doorOpened: Boolean,
        doorUnlocked: Boolean
    },
    Id: Number
});


heartbeatSchema.statics.createHeartbeat = async function (heartbeatData) {
    try {
        const heartbeat = new this(heartbeatData);
        await heartbeat.save();
        return heartbeat;
    } catch (err) {
        console.error(err);
        return null;
    }
}

const Heartbeat = mongoose.model('heartbeats', heartbeatSchema);

module.exports = Heartbeat;