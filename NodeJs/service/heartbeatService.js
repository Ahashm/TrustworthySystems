const clients = {};

exports.registerOnline = (id) => {
    if (!containsId(id)) {
        addElement(id);
    }

    let client = clients[id];
    clearTimeout(client.deadline);
    setNextDeadline(client);
    console.log(`Heartbeat received for id: ${id}`);
}

exports.isOnline = (id) => {
    let hasConnection = containsId(id);
    console.log(`Lock: ${id} is currently ${hasConnection ? "online" : "offline"}`);
    return hasConnection;
}

function addElement(id) {
    let client = {};
    clients[id] = client;
}

function setNextDeadline(client) {
    client.deadline = setTimeout(() => {
        let id = client.heartbeat.id;
        delete clients[id];
        lostConnections[id] = client.heartbeat;
        console.log(`Lost connection to id: ${id}`);
    }, 90000, client)
}

function containsId(id){
    return clients[id] != undefined;
}