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

            if (player.stage === 'intro') {
                for (let e of this.gameEngine.eggsByRoom[roomName]) {
                    if (!e.broken) {
                        player.ammo += this.gameEngine.startingAmmo;
                        e.hp += Math.floor((Math.random() * this.gameEngine.eggHPRange) + this.gameEngine.eggHPMin);
                    }
                }
            }

            console.log(player.number);
            this.myRooms[roomName].push(player);
            this.assignPlayerToRoom(player.playerId, roomName);
            this.assignObjectToRoom(player, roomName);
            this.assignPlayerToSyncServer(socket, roomName);
            socket.emit('assignedRoom', roomName);
        });

        socket.on('updatePalette', pal => {
            player.palette = pal;
        });

        socket.on('playerHitEgg', (ammo, eggId, hp, x, y, sound, inputId) => {
            let p = player;
            p.ammo = ammo;
            let e = this.gameEngine.world.queryObject({ id: eggId });
            e.hp = hp;
            let pal = p.palette;
            let pos = this.gameEngine.playerQuantizedPosition(p, x, y, 
                this.gameEngine.paletteAttributes[pal].gridWidth, this.gameEngine.paletteAttributes[pal].gridHeight);
            let scale = this.gameEngine.paletteAttributes[pal].scale; //TODO should base this on palette of the cell?
            let pitch = (this.gameEngine.paletteAttributes[pal].gridHeight - pos[1]) + (scale.length * 4);
            let dur = this.gameEngine.paletteAttributes[pal][sound].subdivision;

            let notes = this.gameEngine.queryNotes({            
                ownerId: p.playerId, 
                palette: pal,
                sound: sound, 
                pitch: pitch, 
                //vel: 1, 
                xCell: pos[0], 
                yCell: pos[1] 
            });
            if (notes.length) notes[0].dur = '2n';
            else {
                let newNote = new Note(this.gameEngine, null, { 
                    ownerId: p.playerId, 
                    palette: pal,
                    sound: sound, 
                    pitch: pitch, 
                    dur: dur,
                    vel: 1, 
                    xCell: pos[0], 
                    yCell: pos[1] 
                });
                newNote.inputId = inputId;
                this.assignObjectToRoom(newNote, p._roomName);
                this.gameEngine.addObjectToWorld(newNote);
            }
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
            for (let n of this.gameEngine.queryNotes({ ownerId: playerId })) {
                this.gameEngine.removeObjectFromWorld(n);
            }
            for (let k of Object.keys(this.myRooms)) {
                if (player._roomName === k) {
                    this.myRooms[k].splice(this.myRooms[k].indexOf(player), 1);
                    for (let p of this.myRooms[k]) {
                        if (p.number > removed) p.number--; 
                    }
                }
                if (this.myRooms[k].length === 0) {
                    this.gameEngine.world.forEachObject((objId, obj) => { 
                        if (obj._roomName === k) this.gameEngine.removeObjectFromWorld(objId);
                    });
                    delete this.myRooms[k];
                    delete this.syncServers[k];
                }
            }
        }
    }

    onBeginPerformance(player) {
        console.log('beginning');
        let r = player._roomName;
        this.setGameStage(r, 'intro');
        this.addEgg('melody', r);
        this.addEgg('bass', r);
        this.addEgg('perc', r);
    }

    addEgg(sound, roomName) {
        let newEgg = new Egg(this.gameEngine, null, {   position: this.gameEngine.randPos(roomName), 
                                                        velocity: this.gameEngine.velRandY() });
        let numPlayers = this.myRooms[roomName].length;
        for (let p of this.myRooms[roomName]) p.ammo += this.gameEngine.startingAmmo;
        //newEgg.number = 0;
        newEgg.sound = sound;
        newEgg.hp = Math.floor((Math.random() * numPlayers * this.gameEngine.eggHPRange) + (numPlayers * this.gameEngine.eggHPMin));
        this.assignObjectToRoom(newEgg, roomName);
        this.gameEngine.addObjectToWorld(newEgg);
    }

    setGameStage(room, stage) {
        this.roomStages[room] = stage;
        for (let p of this.myRooms[room])
            p.stage = stage;
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
            if (this.roomStages[k] === 'intro') {
                let reload = true;
                for (let p of this.myRooms[k]) {
                    if (p.ammo > 0) reload = false;
                }
                if (reload) {
                    for (let p of this.myRooms[k]) {
                        p.ammo += (this.gameEngine.reloadSize * this.gameEngine.eggsByRoom[k].length);
                    }
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
