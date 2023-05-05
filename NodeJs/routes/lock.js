var express = require('express');
var router = express.Router();
const mqtt = require("../service/mqtt_client");
const verifyToken = require("../verification/jwt_verification").verifyToken;

//mangler at sende timestamp med, hvordan skal dette klares?

router.post('/unlock', verifyToken, function (req, res) {
    interactWithLock(req, "unlock");
});

router.post('/lock', verifyToken, function (req, res) {
    interactWithLock(req, "lock");
});

function interactWithLock(req, message){
    let userId = req.body.userId;
    let lockId = req.body.lockId;
    mqtt.publish(userId, lockId, message);
}

module.exports = router;