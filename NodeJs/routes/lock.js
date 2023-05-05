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
    let { lockId, time} = req.body;
    let userId = req.userId;
    let isAcceptable = isAcceptableTime(time);
    if (isAcceptable) {
        mqtt.publish(userId, lockId, message);
        sucess = true;
    }

    return isAcceptable;
}

function isAcceptableTime(time) {
    let receivedDate = new Date(time);
    let now = Date.now();
    return receivedDate < now;
}

module.exports = router;