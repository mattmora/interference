import { ServerEngine } from 'lance-gg';
import SyncServer from '@ircam/sync/server';
import Performer from '../common/Performer';
import Egg from '../common/Egg';

let transportSyncCount = 0;
let rooms = {};
const palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];

export default class InterferenceServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        // MJW: sync init
        this.startTime = process.hrtime();

        this.syncServer = new SyncServer(() => {
            let now = process.hrtime(this.startTime);
            return now[0] + now[1] * 1e-9;
        });

        this.gameEngine.on('postStep', this.stepLogic.bind(this));
    }

    // create food and AI robots
    start() {
        super.start();
        /*
        for (let f = 0; f < this.gameEngine.foodCount; f++) {
            let newF = new Egg(this.gameEngine, null, { position: this.gameEngine.randPos() });
            this.gameEngine.addObjectToWorld(newF);
        }
        */
    }

    onPlayerConnected(socket) {
        super.onPlayerConnected(socket);

        this.syncServer.start(
        // sync send function
        (pingId, clientPingTime, serverPingTime, serverPongTime) => {
            //console.log(`[pong] - id: %s, clientPingTime: %s, serverPingTime: %s, serverPongTime: %s`,
            //  pingId, clientPingTime, serverPingTime, serverPongTime);
            const response = [];
            response[0] = 1; // this is a pong
            response[1] = pingId;
            response[2] = clientPingTime;
            response[3] = serverPingTime;
            response[4] = serverPongTime;
            socket.emit('syncServerData', response);
        }, 
        //sync receive function
        callback => {
            socket.on('syncClientData', data => {
                const request = data;

                if (request[0] === 0) { // this is a ping
                    const pingId = request[1];
                    const clientPingTime = request[2];

                    //console.log(`[ping] - pingId: %s, clientPingTime: %s`, clientPingTime);

                    callback(pingId, clientPingTime);
                }
            });
        });
        //let numPlayers = this.gameEngine.world.queryObjects({ instanceType: Performer }).length;
        let player = new Performer(this.gameEngine, null, {});
        player.number = -1;
        player.palette = 'default';
        player.notestack = '';
        player.rhythmstack = '';
        console.log(player.number);
        player.playerId = socket.playerId;
        this.gameEngine.addObjectToWorld(player);

        socket.on('assignToRoom', roomName => {
            if (!Object.keys(rooms).includes(roomName)) {
                this.createRoom(roomName);
                rooms[roomName] = [];
            }
            player.number = rooms[roomName].length;
            player.palette = palettes[player.number%palettes.length];
            console.log(player.number);
            rooms[roomName].push(player);
            this.assignPlayerToRoom(player.playerId, roomName);
            this.assignObjectToRoom(player, roomName);
            socket.emit('assignedRoom', roomName);
        });
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);
        let player = this.gameEngine.world.queryObject({ playerId });
        if (player) { 
            let removed = player.number;
            this.gameEngine.removeObjectFromWorld(player.id);
            for (let k of Object.keys(rooms)) {
                if (rooms[k].includes(player)) {
                    rooms[k].splice(rooms[k].indexOf(player), 1);
                    for (let p of rooms[k]) if (p.number > removed) p.number--; 
                }
            }
        }
    }

    /*
    // Eating Egg:
    // increase body length, and remove the food
    wiggleEatFood(w, f) {
        if (!(f.id in this.gameEngine.world.objects))
            return;

        w.bodyLength++;
        this.gameEngine.removeObjectFromWorld(f);
        let newF = new Egg(this.gameEngine, null, { position: this.gameEngine.randPos() });
        this.gameEngine.addObjectToWorld(newF);
    }

    wiggleHitWiggle(w1, w2) {
        if (!(w2.id in this.gameEngine.world.objects) || !(w1.id in this.gameEngine.world.objects))
            return;

        this.gameEngine.removeObjectFromWorld(w1);
        if (w1.AI) this.addAI();
    }
    */
    stepLogic() {

        let players = this.gameEngine.world.queryObjects({ instanceType: Performer });
        let eggs = this.gameEngine.world.queryObjects({ instanceType: Egg });
        for (let p of players) {
            /*
            // check for collision
            for (let w2 of wiggles) {
                if (w === w2)
                    continue;

                for (let i = 0; i < w2.bodyParts.length; i++) {
                    let distance = w2.bodyParts[i].clone().subtract(w.position);
                    if (distance.length() < this.gameEngine.collideDistance)
                        this.wiggleHitWiggle(w, w2);
                }
            }

            // check for food-eating
            for (let f of foodObjects) {
                let distance = w.position.clone().subtract(f.position);
                if (distance.length() < this.gameEngine.eatDistance) {
                    this.wiggleEatFood(w, f);
                }
            }

            // move AI wiggles
            if (w.AI) {
                if (Math.random() < 0.01) w.turnDirection *= -1;
                w.direction += w.turnDirection * (Math.random() - 0.9)/20;
                if (w.position.y >= this.gameEngine.spaceHeight / 2) w.direction = -Math.PI/2;
                if (w.position.y <= -this.gameEngine.spaceHeight / 2) w.direction = Math.PI/2;
                if (w.position.x >= this.gameEngine.spaceWidth / 2) w.direction = Math.PI;
                if (w.position.x <= -this.gameEngine.spaceWidth / 2) w.direction = 0;
                if (w.direction > Math.PI * 2) w.direction -= Math.PI * 2;
                if (w.direction < 0) w.direction += Math.PI * 2;
            }
            */
        }

    
    }
}
