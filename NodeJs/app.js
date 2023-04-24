var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
let heartbeatRouter = require("./routes/heartbeat");

var app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/heartbeat", heartbeatRouter);

const mqtt = require('mqtt')

const host = '192.168.138.91'
const porti = '1885'
const clientId = `nodejs_server`

const connectUrl = `mqtt://${host}:${porti}`
const client = mqtt.connect(connectUrl, {
  clientId,
  clean: true,
  connectTimeout: 4000,
  //username: 'emqx',
  //password: 'public',
  reconnectPeriod: 1000,
})

const topic = 'esp32/ahash'
client.on('connect', () => {
  console.log('Connected')
  client.subscribe([topic], () => {
    console.log(`Subscribe to topic '${topic}'`)
  })
  client.publish(topic, 'yeet', { qos: 0, retain: false }, (error) => {
    if (error) {
      console.error(error)
    }
  })
})
client.on('message', (topic, payload) => {
  console.log('Received Message:', topic, payload.toString())
})


module.exports = app;

app.listen(port, (req, res) => {
  console.log(`Server running, listening on port ${port}`);
})

