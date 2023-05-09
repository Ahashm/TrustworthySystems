var express = require("express");
var router = express.Router();
const moment = require("moment-timezone");
const mqttClient = require("../service/mqtt_client");
const { lock } = require(".");
const verifyToken = require("../verification/jwt_verification").verifyToken;

//missing timestamp in these two endponts, as well as the validation of said timestamp. Also needs to send timestamp to mqtt

router.post("/open", verifyToken, function (req, res) {
  let errorMsg = interactWithLock(req, "unlock");
  let isSuccess = errorMsg == null;
  if (!isSuccess) {
    res.status(400);
  }

  let message = isSuccess ? "Published message" : errorMsg;
  res.json({ success: isSuccess, message: message });
});

router.post("/close", verifyToken, function (req, res) {
  let errorMsg = interactWithLock(req, "lock");
  let isSuccess = errorMsg == null;
  if (!isSuccess) {
    res.status(400);
  }

  let message = isSuccess ? "Published message" : errorMsg;
  res.json({ success: isSuccess, message: message });
});

function interactWithLock(req, message) {
  let { lockId, time } = req.body;
  let receivedDate = moment(time);
  let isAcceptable = isAcceptableTime(receivedDate);
  if (isAcceptable) {
    let formattedMessage = formatMessage(receivedDate, message);
    mqttClient.publish(lockId, formattedMessage);
    sucess = true;
  }

  return isAcceptable;
}

function isAcceptableTime(receivedDate) {
  let now = moment();
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
