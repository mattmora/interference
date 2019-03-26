import { ServerEngine } from 'lance-gg';
import SyncServer from '@ircam/sync/server';
import Note from '../common/Note';
import Performer from '../common/Performer';
import Egg from '../common/Egg';

//const palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];

export default class InterferenceServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.myRooms = {}; //roomName: [players in the room]
        this.roomStages = {};
        this.syncServers = {}; //roomName: syncServer

        this.gameEngine.on('postStep', this.stepLogic.bind(this));
        this.gameEngine.on('beginPerformance', player => { this.onBeginPerformance(player) });
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

        let player = new Performer(this.gameEngine, null, {});
        player.number = -1;
        player.palette = 0; //default
        player.ammo = 0;
        player.stage = 'setup';
        player.gridString = this.getEmptyGridStringByPalette(0);
        player.melody = JSON.stringify([]);
        player.bass = JSON.stringify([]);
        player.perc = JSON.stringify([]);

        console.log(player.number);
        player.playerId = socket.playerId;
        this.gameEngine.addObjectToWorld(player);

        socket.on('assignToRoom', roomName => {
            if (!Object.keys(this.myRooms).includes(roomName)) {
                this.createRoom(roomName);
                this.createSyncServer(roomName);
                this.myRooms[roomName] = [];
                this.roomStages[roomName] = 'setup';
            }
            player.number = this.myRooms[roomName].length;
            player.palette = this.gameEngine.palettes[player.number%this.gameEngine.palettes.length];
            player.stage = this.roomStages[roomName];
            player.gridString = this.getEmptyGridStringByPalette(player.palette);
            player.melody = JSON.stringify([]);
            player.bass = JSON.stringify([]);
            player.perc = JSON.stringify([]);

            if (player.stage === 'intro') {
                player.ammo = this.gameEngine.startingAmmo;
                for (let e of this.gameEngine.eggsByRoom[roomName]) {
                    e.hp += Math.floor((Math.random() * this.gameEngine.eggHPRange) + this.gameEngine.eggHPMin);
                }
            }

            console.log(player.number);
            this.myRooms[roomName].push(player);
            this.assignPlayerToRoom(player.playerId, roomName);
            this.assignObjectToRoom(player, roomName);
            this.assignPlayerToSyncServer(socket, roomName);
            socket.emit('assignedRoom', roomName);
        });
    }

    createSyncServer(roomName) {
        const startTime = process.hrtime();
        this.syncServers[roomName] = new SyncServer(() => {
            let now = process.hrtime(startTime);
            return now[0] + now[1] * 1e-9;
        });
    }

    assignPlayerToSyncServer(socket, roomName) {
        this.syncServers[roomName].start(
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
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);
        let player = this.gameEngine.world.queryObject({ playerId });
        if (player) { 
            let removed = player.number;
            this.gameEngine.removeObjectFromWorld(player.id);
            for (let k of Object.keys(this.myRooms)) {
                if (this.myRooms[k].includes(player)) {
                    this.myRooms[k].splice(this.myRooms[k].indexOf(player), 1);
                    for (let p of this.myRooms[k]) {
                        if (p.number > removed) p.number--; 
                    }
                }
                if (this.myRooms[k].length === 0) {
                    for (let e of this.gameEngine.world.queryObjects({ instanceType: Egg })) 
                        this.gameEngine.removeObjectFromWorld(e);
                    delete this.myRooms[k];
                    delete this.syncServers[k];
                }
            }
        }
    }

    onBeginPerformance(player) {
        console.log('beginning');
        let r = player._roomName;
        this.roomStages[r] = 'intro';
        for (let p of this.myRooms[r])
            p.stage = 'intro';
        this.addEgg('melody', r);
        this.addEgg('bass', r);
        this.addEgg('perc', r);
    }

    addEgg(sound, roomName) {
        let newEgg = new Egg(this.gameEngine, null, {   position: this.gameEngine.randPos(roomName), 
                                                        velocity: this.gameEngine.velRandY() });
        let numPlayers = this.myRooms[roomName].length;
        for (let p of this.myRooms[roomName]) p.ammo += this.gameEngine.startingAmmo;
        newEgg.number = 0;
        newEgg.sound = sound;
        newEgg.hp = Math.floor((Math.random() * numPlayers * this.gameEngine.eggHPRange) + (numPlayers * this.gameEngine.eggHPMin));
        this.assignObjectToRoom(newEgg, roomName)
        this.gameEngine.addObjectToWorld(newEgg);
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

        for (let k of Object.keys(this.myRooms)) {
            let reload = true;
            for (let p of this.myRooms[k]) {
                if (p.ammo > 0) reload = false;
            }
            if (reload) {
                for (let p of this.myRooms[k]) {
                    p.ammo += this.gameEngine.reloadSize;
                }
            }
        }
    }

    getEmptyGridStringByPalette(p) {
        let gridString = new Array(this.gameEngine.paletteAttributes[p].gridWidth).fill(
            new Array(this.gameEngine.paletteAttributes[p].gridHeight).fill(p));
        return JSON.stringify(gridString);
    }
}
