var express = require('express');
var router = express.Router();
const mqtt = require("../service/mqtt_client");
const verifyToken = require("../verification/jwt_verification").verifyToken;

//missing timestamp in these two endponts, as well as the validation of said timestamp. Also needs to send timestamp to mqtt

router.post('/unlock', verifyToken, function (req, res) {
    interactWithLock(req, "unlock");
    res.json({ success: true });
});

router.post('/lock', verifyToken, function (req, res) {
    interactWithLock(req, "lock");
    res.json({ success: true });
});

function interactWithLock(req, message) {
    let userId = req.body.userId;
    let lockId = req.body.lockId;
    mqtt.publish(userId, lockId, message);
}

function isAcceptableTime(time){
    let receivedDate = new Date(time);
    let now = Date.now();
    return receivedDate < now;
}

module.exports = router;