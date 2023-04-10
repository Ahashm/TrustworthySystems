const clients = {};
const lostConnections = {};
let idIndex = 1;

exports.register = (ip) => {
    let id = randomNumber();
    let heartbeat = {
        id: id,
        senderIp: ip
    }

    let client = {
        heartbeat: heartbeat,
    };

    setNextDeadline(client);
    addElement(client);
    return heartbeat;
}

exports.ping = (id) => {
    let client = clients[id];
    clearTimeout(client.deadline);
    setNextDeadline(client);
    console.log(`Heartbeat received for id: ${client.heartbeat.id}`);
    return client.heartbeat;
}

exports.clients = () => {
    let heartbeats = {};
    for(let key in clients){
        heartbeats[key] = clients[key].heartbeat;
    }
    return heartbeats;
}


function randomNumber() {
    let id = idIndex++;
    return id;
}

function addElement(client){
    clients[client.heartbeat.id] = client;
}

function setNextDeadline(client){
    client.deadline = setTimeout(() => {
        let id = client.heartbeat.id;
        delete clients[id];
        lostConnections[id] = client.heartbeat;
        console.log(`Lost connection to id: ${id}`);
    }, 5000, client)
}