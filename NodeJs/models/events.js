const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  States: {
    RFID: String,
    doorLocked: Boolean,
    doorOpened: Boolean,
    doorUnlocked: Boolean
  },
  Id: Number,
  TypeOfIncident: String,
  dateTime: Date,
  RFID_id: String,
  DoorOpenDistance: String
});

eventSchema.statics.createEvent = async function (eventData) {
    try {
        const event = new this(eventData);
        await event.save();
        return event;
    } catch (err) {
        console.error(err);
        return null;
    }
}

const EventModel = mongoose.model('Events', eventSchema);

module.exports = EventModel;