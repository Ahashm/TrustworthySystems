var express = require('express');
var router = express.Router();
const heartbeatService = require('../service/heartbeatService')

/* GET home page. */
router.get('/', function (req, res) {
    let clients = heartbeatService.clients();
    res.send(clients);
});

router.post('/register', (req, res) => {
    let heartbeat = heartbeatService.register(req.body.id);
    res.send(heartbeat);
});

router.post('/ping', (req, res) => {
    let heartbeat = heartbeatService.ping(req.body.id);
    res.send(heartbeat);
});

module.exports = router;