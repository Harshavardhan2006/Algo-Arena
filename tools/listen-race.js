const raceId = process.argv[2];
const socket = new WebSocket('ws://localhost:8081/ws/websocket');

socket.onopen = () => {
    socket.send('CONNECT\naccept-version:1.2\nheart-beat:0,0\n\n\0');
};

socket.onmessage = (message) => {
    const frame = String(message.data);
    if (frame.startsWith('CONNECTED')) {
        socket.send(`SUBSCRIBE\nid:sub-0\ndestination:/topic/race/${raceId}\n\n\0`);
        console.log(`listening on race ${raceId}`);
        return;
    }
    if (frame.startsWith('MESSAGE')) {
        const body = frame.split('\n\n').slice(1).join('\n\n').replace(/\0$/, '');
        console.log(body);
        if (body.includes('"race_completed"')) {
            socket.close();
        }
    }
};

socket.onerror = (error) => {
    console.log('socket error', error.message || error);
};