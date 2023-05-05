var express = require('express');
var router = express.Router();
const mqtt = require("../service/mqtt_client");
const verifyToken = require("../verification/jwt_verification").verifyToken;

//missing timestamp in these two endponts, as well as the validation of said timestamp. Also needs to send timestamp to mqtt

router.post('/open', verifyToken, function (req, res) {
    let success = interactWithLock(req, "unlock");
    res.json({ success: success });
});

router.post('/close', verifyToken, function (req, res) {
    let success = interactWithLock(req, "lock");
    res.json({ success: success });
});

function interactWithLock(req, message) {
    let { lockId, time } = req.body;
    let userId = req.userId;
    let receivedDate = new Date(time);
    let isAcceptable = isAcceptableTime(receivedDate);
    if (isAcceptable) {
        let formattedMessage = formatMessage(receivedDate, message);
        mqtt.publish(userId, lockId, formattedMessage);
        sucess = true;
    }

    return isAcceptable;
}

function isAcceptableTime(receivedDate) {
    let now = Date.now();
    return receivedDate < now;
}

function formatMessage(date, message) {
    let date = date.toISOString().replace('T', ' ').slice(0, 19);
    let formattedMessage = {
        message: message,
        date: date
    }

    return JSON.stringify(formattedMessage);
}

module.exports = router;