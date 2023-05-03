var express = require('express');
var router = express.Router();
let mqtt = require("../service/mqtt_client");

//mangler at sende timestamp med, hvordan skal dette klares?

router.post('/unlock', function (req, res, next) {
    interactWithLock(req, "unlock");
});

router.post('/lock', function (req, res, next) {
    interactWithLock(req, "lock");
});

function interactWithLock(req, message){
    let userId = req.body.userId;
    let lockId = req.body.lockId;
    mqtt.publish(userId, lockId, message);
}

module.exports = router;