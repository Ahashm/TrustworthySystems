const mqtt = require('mqtt');
const heartbeatModel = require('../models/heartbeats');
const heartbeatService = require('./heartbeatService');
const eventModel = require('../models/events');


let client = null;
//const host = 'broker.hivemq.com'
//const porti = '1883'
const host = '192.168.138.91'
const porti = '1885'

const lockTopicPath = "lock/+/"
const events = "events";
const heartbeat = "heartbeats";

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
    client.subscribe(lockTopicPath + events);
    client.subscribe(lockTopicPath + heartbeat);

    setInterval(function () {
      client.publish(heartbeat, 'heartbeat', { qos: 1, retain: false }, (error) => {
        if (error) {
          console.error(error)
        }
      })
    }, 60000);

  });

  client.on('message', (topic, payload) => {
    let type = topic.split("/").pop();
    switch (type) {
      case heartbeat: {
        let heartbeat = JSON.parse(payload);
        heartbeatModel.createHeartbeat(heartbeat);
        heartbeatService.registerOnline(heartbeat.Id);
        console.log('Received Message:', topic, payload.toString())
        break;
      }
      case events: {
        let event = JSON.parse(payload);
        eventModel.createEvent(event);
        break;
      }
      default: {
        console.log("what");
      }
    }
  });
}

exports.publish = (lockId, message) => {
  if (!heartbeatService.isOnline(lockId)) {
    return "The lock is currently offline.";
  }

  let topic = createTopicPath(lockId);
  client.publish(topic, message, { qos: 1, retain: false }, (error) => {
    if (error) {
      return error;
    }
  })
}


function createTopicPath(lock) {
  return `lock/${lock}/actions`;
}
