import { ServerEngine, TwoVector } from 'lance-gg';
import SyncServer from '@ircam/sync/server';
import Note from '../common/Note';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import { Transport } from 'tone';

//const palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];

export default class InterferenceServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);

        this.myRooms = {}; //roomName: [players in the room]
        this.roomStages = {};
        this.syncServers = {}; //roomName: syncServer
        this.moveTimes = {};
        this.actionCounts = {};
        this.progressionCounts = {};
        this.tempos = {};

        this.gameEngine.on('server__preStep', this.preStepLogic.bind(this));
        this.gameEngine.on('server__postStep', this.postStepLogic.bind(this));
        this.gameEngine.on('beginPerformance', player => { this.onBeginPerformance(player) });
        this.gameEngine.on('eggBounce', e => { this.onEggBounce(e) });
        this.gameEngine.on('noteRemoved', roomName => { this.actionCounts[roomName]++ });
        this.gameEngine.on('playerAction', player => { this.onPlayerAction(player) });
        this.gameEngine.on('playerForfeit', player => { this.onPlayerForfeit(player) });
        this.gameEngine.on('autoProgress', roomName => { this.startFightStage(roomName) });
        this.gameEngine.on('removeNote', player => { this.onRemoveNote(player) });
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

        let player = null;

        socket.on('assignToRoom', roomName => {
            if (!Object.keys(this.myRooms).includes(roomName)) {
                this.createRoom(roomName);
                this.createSyncServer(roomName);
                this.myRooms[roomName] = [];
                this.roomStages[roomName] = 'setup';
                //this.moveTimes[roomName] = 0;
                this.actionCounts[roomName] = 0;
                this.tempos[roomName] = 120;
            }
            if (this.roomStages[roomName] === 'setup') {
                player = new Performer(this.gameEngine, null, {});
                player.playerId = socket.playerId;
                player.number = this.myRooms[roomName].length;
                player.ammo = 0;
                player.direction = 0;
                player.xPos = player.number * this.gameEngine.playerWidth;
                player.yPos = 0;
                player.palette = this.gameEngine.palettes[player.number%this.gameEngine.palettes.length];
                player.stage = this.roomStages[roomName];
                player.gridString = this.getEmptyGridStringByPalette(player.palette);
                player.grid = JSON.parse(player.gridString);
                player.gridChanged = false;
                player.pitchSet = 0;
                player.active = 1;
                this.myRooms[roomName].push(player);
                this.gameEngine.addObjectToWorld(player);

                /*
                if (player.stage === 'build') {
                    for (let e of this.gameEngine.eggsByRoom[roomName]) {
                        if (!e.broken) {
                            player.ammo += this.gameEngine.startingAmmo;
                            e.hp += Math.floor((Math.random() * this.gameEngine.eggHPRange) + this.gameEngine.eggHPMin);
                        }
                    }
                }
                */
                //console.log(player.number);
                this.assignPlayerToRoom(player.playerId, roomName);
                this.assignObjectToRoom(player, roomName);
                this.assignPlayerToSyncServer(socket, roomName);
            }
            else {
                let inactivePlayers = this.gameEngine.queryPlayers({ _roomName: roomName, active: 0 });
                if (inactivePlayers.length === 0) socket.emit('accessDenied');
                else {
                    console.log('found inactive');
                    player = inactivePlayers[0];
                    for (let n of this.gameEngine.queryNotes({ ownerId: player.playerId })) {
                        n.ownerId = socket.playerId;
                    }
                    player.playerId = socket.playerId;
                    player.active = 1;
                    this.assignPlayerToRoom(player.playerId, roomName);
                    this.assignPlayerToSyncServer(socket, roomName);
                }
            }
            socket.emit('assignedRoom', roomName);
        });

        socket.on('updatePalette', pal => {
            if (player == null) return;
            player.palette = pal;
            for (let i = 0; i < player.grid.length; i++) {
                for (let j = 0; j < player.grid[i].length; j++) {
                    player.grid[i][j] = player.palette;
                }
            }
            player.gridString = this.getEmptyGridStringByPalette(player.palette);
        });

        socket.on('paintStep', idArray => {
            if (player == null) return;
            for (let noteId of idArray) {
                let note = this.gameEngine.world.queryObject({ id: noteId });
                if (note != null) note.paint();
                player.gridChanged = true;
            }
        });

        socket.on('paintCell', (noteId, noteX, noteY, palette) => {
            let note = this.gameEngine.world.queryObject({ id: noteId });
            if (note == null) return;
            let pal = this.gameEngine.paletteAttributes[palette];
            let n = Math.floor(noteX / pal.gridWidth);
            for (let p of this.gameEngine.queryPlayers({ number: n })) {
                p.grid[noteX % pal.gridWidth][noteY % pal.gridHeight] = palette;
            }
            player.gridChanged = true;   
        });

        socket.on('playerHitEgg', (ammo, eggId, hp, x, y, sound, inputId) => {
            if (player == null) return;
            let p = player;
            p.ammo = ammo;
            let e = this.gameEngine.world.queryObject({ id: eggId });
            if (e == null) return;
            e.hp = hp;
            let pal = this.gameEngine.paletteAttributes[p.palette];
            let pos = this.gameEngine.quantizedPosition(x, y, pal.gridWidth, pal.gridHeight);
            let dur = pal[sound].subdivision;

            let notes = this.gameEngine.queryNotes({            
                ownerId: p.playerId,
                palette: p.grid[pos[0]%pal.gridWidth][pos[1]%pal.gridHeight],
                sound: sound, 
                //vel: 1, 
                xPos: pos[0],
                yPos: pos[1]
            });
            if (notes.length) notes[0].dur = '2n';
            else {
                let newNote = new Note(this.gameEngine, null, { 
                    ownerId: p.playerId, 
                    palette: p.grid[pos[0]%pal.gridWidth][pos[1]%pal.gridHeight],
                    sound: sound, 
                    dur: dur,
                    vel: 1, 
                    xPos: pos[0],
                    yPos: pos[1],
                    position: new TwoVector(pos[0], pos[1])
                });
                newNote.inputId = inputId;
                this.assignObjectToRoom(newNote, p._roomName);
                this.gameEngine.addObjectToWorld(newNote);
            }
            this.actionCounts[p._roomName]++;
        });

        socket.on('startBuildStage', () => { 
            if (player == null) return;
            this.startBuildStage(player._roomName) 
        });

        socket.on('startFightStage', () => { 
            if (player == null) return;
            this.startFightStage(player._roomName) 
        });

        // socket.on('changeTempo', delta => {
        //     if (player == null) return;
        //     this.tempos[player._roomName] += delta
        //     if (this.tempos[player._roomName] < 60) {
        //         this.tempos[player._roomName] = 60;
        //     }
        //     else if (this.tempos[player._roomName] > 240) {
        //         this.tempos[player._roomName] = 240;
        //     }
        //     socket.emit('changeTempo', this.tempos[player._roomName]);
        //     this.startBuildStage(player._roomName);
        // });

        socket.on('endGame', () => {
            let counts = [];
            for (let p of this.myRooms[player._roomName]) {
                for (let i = 0; i < p.grid.length; i++) {
                    for (let j = 0; j < p.grid[i].length; j++) {
                        if (counts[p.grid[i][j]] == null) counts[p.grid[i][j]] = 0;
                        counts[p.grid[i][j]]++;
                    }
                }
            }
            let max = 0;
            let pal = null;
            for (let i = 0; i < counts.length; i++) {
                if (counts[i] == null) continue;
                if (counts[i] > max) {
                    max = counts[i];
                    pal = i;
                }
            }
            for (let p of this.myRooms[player._roomName]) {
                p.palette = pal;
            }
            this.startOutroStage(player._roomName);
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
        if (player != null) { 
            let room = player._roomName;
            if (this.roomStages[room] === 'setup') {
                let removed = player.number;
                this.gameEngine.removeObjectFromWorld(player.id);
                this.myRooms[room].splice(this.myRooms[room].indexOf(player), 1);
                for (let p of this.myRooms[room]) {
                    if (p.number > removed) {
                        p.number--; 
                        p.move(-this.gameEngine.playerWidth, 0);
                    }
                } 
            }
            else {
                player.active = 0;
            }
            let activePlayers = this.gameEngine.queryPlayers({ _roomName: room, active: 1 });
            if (activePlayers.length === 0) {
                this.gameEngine.world.forEachObject((objId, obj) => { 
                    if (obj._roomName === room) this.gameEngine.removeObjectFromWorld(objId);
                });
                delete this.myRooms[room];
                delete this.syncServers[room];
            }
        }
    }

    onBeginPerformance(player) {
        this.startBuildStage(player._roomName);
    }

    startBuildStage(room) {
        this.setGameStage(room, 'build');
        for (let p of this.myRooms[room]) {
            this.attemptPlayerAssimilation(p);
        }
        if (this.gameEngine.eggsByRoom[room] != null) {
            for (let e of this.gameEngine.eggsByRoom[room]) {
                this.gameEngine.removeObjectFromWorld(e.id);
            }           
        }
        for (let p of this.myRooms[room]) {
            p.moveTo(p.number * this.gameEngine.playerWidth, p.yPos);
            p.ammo = this.gameEngine.startingAmmo;
        }
        let rand = Math.floor(Math.random()*this.gameEngine.eggSoundsToUse.length);
        let sound = this.gameEngine.eggSoundsToUse[rand];
        this.gameEngine.eggSoundsToUse.splice(rand, 1);
        if (this.gameEngine.eggSoundsToUse.length === 0) this.gameEngine.eggSoundsToUse = this.gameEngine.eggSounds.slice();
        this.addEgg(sound, room);
    }

    startFightStage(room) {
        this.setGameStage(room, 'fight');
        if (this.gameEngine.eggsByRoom[room] != null) {
            for (let e of this.gameEngine.eggsByRoom[room]) {
                this.gameEngine.removeObjectFromWorld(e.id);
            }           
        }
        for (let p of this.myRooms[room]) {
            p.ammo = 0;
        }
        this.progressionCounts[room] = 0;
    }

    startOutroStage(room) {
        this.setGameStage(room, 'outro');
        if (this.gameEngine.eggsByRoom[room] != null) {
            for (let e of this.gameEngine.eggsByRoom[room]) {
                this.gameEngine.removeObjectFromWorld(e.id);
            }           
        }
        for (let p of this.myRooms[room]) {
            p.ammo = 0;
            this.assimilatePlayerToPalette(p, p.palette);
        }
    }

    onEggBounce(e) {
        for (let p of this.myRooms[e._roomName]) {
            if (p.ammo < this.gameEngine.maxAmmo && Math.random() < this.gameEngine.ammoDropChance) p.ammo++;
        }
    }

    onPlayerAction(p) {
        this.actionCounts[p._roomName]++
    }

    onRemoveNote(p) {
        if (this.roomStages[p._roomName] === 'outro') {
            let notes = this.gameEngine.queryNotes({ _roomName: p._roomName });
            if (notes.length > 0) {
                let note = notes[Math.floor(Math.random()*notes.length)];
                this.gameEngine.removeObjectFromWorld(note.id);                
            }
            else {
                for (let player of this.myRooms[p._roomName]) {
                    this.assimilatePlayerToPalette(player, 0);
                }
            }
        }   
    }

    onPlayerForfeit(p) {
        let counts = [];
        for (let i = 0; i < p.grid.length; i++) {
            for (let j = 0; j < p.grid[i].length; j++) {
                if (counts[p.grid[i][j]] == null) counts[p.grid[i][j]] = 0;
                counts[p.grid[i][j]]++;
            }
        }
        let max = 0;
        let pal = null;
        for (let i = 0; i < counts.length; i++) {
            if (counts[i] == null) continue;
            if (counts[i] > max) {
                if (i !== p.palette) {
                    max = counts[i];
                    pal = i;
                }
            }
        }
        if (pal === null) return;

        this.assimilatePlayerToPalette(p, pal);
    } 

    attemptPlayerAssimilation(p) {
        let counts = [];
        for (let i = 0; i < p.grid.length; i++) {
            for (let j = 0; j < p.grid[i].length; j++) {
                if (counts[p.grid[i][j]] == null) counts[p.grid[i][j]] = 0;
                counts[p.grid[i][j]]++;
            }
        }
        let max = 0;
        let pal = null;
        for (let i = 0; i < counts.length; i++) {
            if (counts[i] == null) continue;
            if (counts[i] > max) {
                max = counts[i];
                pal = i;
            }
        }
        if (pal === p.palette) return;

        this.assimilatePlayerToPalette(p, pal);
    } 

    assimilatePlayerToPalette(player, pal) {
        player.palette = pal;

        for (let n of this.gameEngine.queryNotes({ ownerId: player.playerId })) {
            n.palette = player.palette
        }

        player.gridString = this.getEmptyGridStringByPalette(player.palette);
        player.grid = JSON.parse(player.gridString);
    }

    addEgg(sound, roomName) {
        let newEgg = new Egg(this.gameEngine, null, {   position: this.gameEngine.randPos(roomName), 
                                                        velocity: this.gameEngine.velRandY(roomName) });
        let numPlayers = this.gameEngine.playersByRoom[roomName].length;
        //for (let p of this.myRooms[roomName]) p.ammo += this.gameEngine.startingAmmo;
        //newEgg.number = 0;
        newEgg.sound = sound;
        newEgg.hp = Math.round((Math.random() * numPlayers * this.gameEngine.eggHPRange) + (numPlayers * this.gameEngine.eggHPMin));
        this.assignObjectToRoom(newEgg, roomName);
        this.gameEngine.addObjectToWorld(newEgg);
    }

    setGameStage(room, stage) {
        this.roomStages[room] = stage;
        for (let p of this.myRooms[room])
            p.stage = stage;
    }

    preStepLogic() {
        for (let room of Object.keys(this.myRooms)) {
            if (this.myRooms[room].length === 1) continue; 
            if (this.roomStages[room] === 'setup' || this.roomStages[room] === 'outro') continue;

            let assimilated = true;
            let pal = null;
            for (let p of this.myRooms[room]) {
                if (pal == null) {
                    pal = p.palette;
                    continue;
                }
                if (pal != p.palette) {
                    assimilated = false;
                    break;
                }
            }
            if (assimilated) {
                this.startOutroStage(room);
            }
        }
    }

    postStepLogic() {
        for (let room of Object.keys(this.myRooms)) {
            if (this.actionCounts[room] > this.myRooms[room].length * this.gameEngine.actionThreshold) {
                for (let p of this.myRooms[room]) {
                    p.pitchSet = (p.pitchSet + 1) % (this.gameEngine.paletteAttributes[p.palette].pitchSets.length - 1);
                    this.actionCounts[room] = 0;
                    //console.log('change');
                }
                this.progressionCounts[room]++;
            }
            /*
            if (this.syncServers[room].getSyncTime() >= this.moveTimes[room]) {
                this.moveTimes[room] += 2;
                for (let p of this.myRooms[room]) {
                    p.move();
                }
            } */
            if (this.roomStages[room] === 'build') {
                let reload = true;
                for (let p of this.myRooms[room]) {
                    if (p.ammo > 0) reload = false;
                }
                if (reload) {
                    for (let p of this.myRooms[room]) {
                        p.ammo += this.gameEngine.reloadSize;
                    }
                }
            }
            else if (this.roomStages[room] === 'fight') {
                if (this.progressionCounts[room] > this.gameEngine.progressionThreshold) this.startBuildStage(room);
                for (let p of this.myRooms[room]) {
                    if (p.gridChanged) p.gridString = JSON.stringify(p.grid);
                }
            }
            else if (this.roomStages[room] === 'outro') {
                if (this.gameEngine.eggsByRoom[room] != null) {
                    for (let e of this.gameEngine.eggsByRoom[room]) {
                        this.gameEngine.removeObjectFromWorld(e.id);
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
