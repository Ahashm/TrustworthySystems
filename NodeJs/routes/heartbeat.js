var express = require('express');
var router = express.Router();
const heartbeatService = require('../service/heartbeatService')

router.get('/:lockId/online', (req, res) => {
    let lockId = req.params.lockId;
    let isOnline = heartbeatService.isOnline(lockId);
    let response = { isOnline : isOnline};
    res.send(JSON.stringify(response));
});

module.exports = router;