var express = require("express");
var router = express.Router();
const moment = require("moment-timezone");
const mqttClient = require("../service/mqtt_client");
const Event = require("../models/events");
const { lock } = require(".");
const verifyToken = require("../verification/jwt_verification").verifyToken;
const heartbeatService = require('../service/heartbeatService')

//missing timestamp in these two endponts, as well as the validation of said timestamp. Also needs to send timestamp to mqtt

router.post("/open", verifyToken, function (req, res) {
  let errorMsg = interactWithLock(req, "unlock");
  let isSuccess = errorMsg == undefined;

  let message = isSuccess ? "Published message" : "errorMsg";
  res.json({ success: isSuccess, message: message });
});

router.post("/close", verifyToken, function (req, res) {
  let errorMsg = interactWithLock(req, "lock");
  let isSuccess = errorMsg == undefined;
  let message = isSuccess ? "Published message" : "errorMsg";
  res.json({ success: isSuccess, message: message });
});

router.get('/:lockId/state', async (req, res) => {
  let lockId = req.params.lockId;
  let isOnline = heartbeatService.isOnline(lockId);
  let response = { isOnline: isOnline };

  try {
    const event = await Event.findOne(
      { Id: lockId },
      { 'States.doorLocked': 1, 'States.doorOpened': 1, _id: 0 },
      { sort: { dateTime: -1 } }
    );
    if (event) {
      response.states = {
        doorLocked: event.States.doorLocked,
        doorOpened: event.States.doorOpened,
      };
    } else {
      response.error = 'No events found for the lockId';
    }
  } catch (err) {
    response.error = err.message;
  }

  res.send(JSON.stringify(response));
});

function interactWithLock(req, message) {
  let { lockId, time } = req.body;
  let receivedDate = moment(time);
  let isAcceptable = isAcceptableTime(receivedDate);
  if (isAcceptable) {
    let formattedMessage = formatMessage(receivedDate, message);
    mqttClient.publish(lockId, formattedMessage);
  }

  return isAcceptable;
}

function isAcceptableTime(receivedDate) {
  let now = moment();
  console.log(receivedDate.format("YYYY-MM-DD HH:mm:ss"));
  return receivedDate < now;
}

function formatMessage(date, message) {
  let stringDate = date.format("YYYY-MM-DD HH:mm:ss");
  let formattedMessage = {
    message: message,
    date: stringDate,
  };

  return JSON.stringify(formattedMessage);
}

module.exports = router;
