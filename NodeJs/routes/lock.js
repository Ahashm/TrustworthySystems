var express = require("express");
var router = express.Router();
const moment = require("moment-timezone");
const test = require("../service/mqtt_client");
const verifyToken = require("../verification/jwt_verification").verifyToken;

//missing timestamp in these two endponts, as well as the validation of said timestamp. Also needs to send timestamp to mqtt

router.post("/open", verifyToken, function (req, res) {
  console.log("hi");
  let success = interactWithLock(req, "unlock");
  res.json({ success: success });
});

router.post("/close", verifyToken, function (req, res) {
  let success = interactWithLock(req, "lock");
  res.json({ success: success });
});

function interactWithLock(req, message) {
  let { lockId, time } = req.body;
  let userId = req.userId;
  let receivedDate = moment(time);
  let isAcceptable = isAcceptableTime(receivedDate);
  if (isAcceptable) {
    let formattedMessage = formatMessage(receivedDate, message);
    test.publish(userId, lockId, formattedMessage);
    sucess = true;
  }

  return isAcceptable;
}

function isAcceptableTime(receivedDate) {
  let now = moment();
  return receivedDate < now;
}

function formatMessage(date, message) {
  let stringDate = date.format("YYYY-MM-DD, HH:mm:ss");
  let formattedMessage = {
    message: message,
    date: stringDate,
  };

  return JSON.stringify(formattedMessage);
}

module.exports = router;
