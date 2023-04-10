var express = require('express');
var router = express.Router();
const heartbeatService = require('../service/heartbeatService');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send(heartbeatService.clients());
});

module.exports = router;
