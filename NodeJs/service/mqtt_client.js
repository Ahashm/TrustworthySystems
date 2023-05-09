const mqtt = require('mqtt')
const heartbeatModel = require('../models/heartbeats')
const eventModel = require('../models/events')

let client = null;

const host = 'broker.hivemq.com'
const porti = '1883'

const lockTopicPath = "lock/+/"
const events = "events";
const heartbeat = "heartbeats";

const idPosition = () => {
  return lockTopicPath.split("/").indexOf("+");
};

exports.connect = (clientId) => {
  const connectUrl = `mqtt://${host}:${porti}`
  client = mqtt.connect(connectUrl, {
    clientId,
    clean: true,
    connectTimeout: 4000,
    //username: 'emqx',
    //password: 'public',
    reconnectPeriod: 1000,
  })

  client.on('connect', () => {
    console.log('Connected')
    client.subscribe('lock/+/events');
    client.subscribe(lockTopicPath + heartbeat);
  });

  client.on('message', (topic, payload) => {
    let type = topic.split("/").pop();
    switch (type){
      case heartbeat:{
        let heartbeat = JSON.parse(payload);
        heartbeatModel.createHeartbeat(heartbeat);
        break;
      }
      case events:{
        let event = JSON.parse(payload);
        eventModel.createEvent(event);
        break;
      }
      default : {
        console.log("what");
      }
    }
    console.log('Received Message:', topic, payload.toString())
  });
}

exports.publish = (userId, lockId, message) => {
  let topic = createTopicPath(userId, lockId);
  client.publish(topic, message, { qos: 1, retain: false }, (error) => {
    if (error) {
      return error;
    }
  })
}


function createTopicPath(lock) {
  return `lock/${lock}/actions`;
}
