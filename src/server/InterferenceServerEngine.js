"use strict";

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
        let soloSpectator = false;

        socket.on('assignToRoom', (roomName, params) => {
            if (!Object.keys(this.myRooms).includes(roomName)) {
                if (params.spectator) {
                    params.spectator = false;
                    soloSpectator = true;
                }
                this.createRoom(roomName);
                this.createSyncServer(roomName);
                this.myRooms[roomName] = [];
                this.roomStages[roomName] = 'setup';
                //this.moveTimes[roomName] = 0;
                this.actionCounts[roomName] = 0;
                this.tempos[roomName] = 120;
                this.gameEngine.setRoomParamsToDefault(roomName);
                Object.assign(this.gameEngine.paramsByRoom[roomName], params);
            }
            if (this.roomStages[roomName] === 'setup') {
                if (!params.spectator) {
                    player = new Performer(this.gameEngine, null, {});
                    player.playerId = socket.playerId;
                    player.number = this.myRooms[roomName].length;
                    player.ammo = 0;
                    player.direction = 0;
                    player.xPos = player.number * this.gameEngine.paramsByRoom[roomName].playerWidth;
                    player.yPos = 0;
                    player.palette = this.gameEngine.paramsByRoom[roomName]
                                        .palettes[player.number%this.gameEngine.paramsByRoom[roomName].palettes.length];
                    player.stage = this.roomStages[roomName];
                    player.grid = new Array(this.gameEngine.paramsByRoom[roomName].playerWidth * 
                                        this.gameEngine.paramsByRoom[roomName].playerHeight).fill(player.palette);
                    player.gridChanged = false;
                    player.pitchSet = 0;
                    player.active = 1;
                    if (soloSpectator) player.active = 0;
                    this.myRooms[roomName].push(player);
                    this.gameEngine.addObjectToWorld(player);
                    player.room = roomName;
                    this.assignObjectToRoom(player, roomName);
                }
                this.assignPlayerToRoom(socket.playerId, roomName);
                this.assignPlayerToSyncServer(socket, roomName);
                socket.emit('assignedRoom', roomName, this.gameEngine.paramsByRoom[roomName]);
            }
            else if (params.spectator) {
                this.assignPlayerToRoom(socket.playerId, roomName);
                this.assignPlayerToSyncServer(socket, roomName);
                socket.emit('assignedRoom', roomName, this.gameEngine.paramsByRoom[roomName]);
            }
            else {
                let inactivePlayers = this.gameEngine.queryPlayers({ room: roomName, active: 0 });
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

                    socket.emit('assignedRoom', roomName, this.params);
                }
            }
        });

        socket.on('updatePalette', pal => {
            if (player == null) return;
            player.palette = pal;

            player.grid = new Array(this.gameEngine.paramsByRoom[player.room].playerWidth * 
                this.gameEngine.paramsByRoom[player.room].playerHeight).fill(player.palette);
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
            if (player == null) return;
            if (note == null) return;
            if (note.room == null) return;
            let n = Math.floor(noteX / this.gameEngine.paramsByRoom[note.room].playerWidth);
            for (let p of this.gameEngine.queryPlayers({ number: n })) {
                p.grid[(noteX % this.gameEngine.paramsByRoom[note.room].playerWidth) + 
                    ((noteY % this.gameEngine.paramsByRoom[note.room].playerHeight) * 
                    this.gameEngine.paramsByRoom[note.room].playerWidth)] = palette;
            }
            player.gridChanged = true;   
        });

        socket.on('playerHitEgg', (ammo, eggId, hp, x, y, sound, inputId) => {
            if (player == null) return;
            //console.log(`grid=${player.grid}`);
            let p = player;
            let roomName = p.room;
            p.ammo = ammo;
            let e = this.gameEngine.world.queryObject({ id: eggId });
            if (e == null) return;
            e.hp = hp;
            let playerWidth = this.gameEngine.paramsByRoom[roomName].playerWidth;
            let playerHeight = this.gameEngine.paramsByRoom[roomName].playerHeight;
            let pos = this.gameEngine.quantizedPosition(x, y, playerWidth, playerHeight, roomName);
            let dur = this.gameEngine.paramsByRoom[roomName].paletteAttributes[player.palette][sound].subdivision;

            let notes = this.gameEngine.queryNotes({            
                ownerId: p.playerId,
                //palette: p.grid[(pos[0] % playerWidth) + ((pos[1] % playerHeight) * playerWidth)],
                palette: p.palette,
                sound: sound, 
                //vel: 1, 
                xPos: pos[0],
                yPos: pos[1]
            });
            if (notes.length) notes[0].dur = '2n';
            else {
                let newNote = new Note(this.gameEngine, null, { 
                    ownerId: p.playerId, 
                    //palette: p.grid[(pos[0] % playerWidth) + ((pos[1] % playerHeight) * playerWidth)],
                    palette: p.palette,
                    sound: sound, 
                    dur: dur,
                    vel: 1, 
                    xPos: pos[0],
                    yPos: pos[1],
                    position: new TwoVector(pos[0], pos[1])
                });
                newNote.inputId = inputId;
                newNote.room = roomName;
                this.assignObjectToRoom(newNote, roomName);
                this.gameEngine.addObjectToWorld(newNote);
            }
            this.actionCounts[roomName]++;
        });

        socket.on('startBuildStage', () => { 
            if (player == null) return;
            this.startBuildStage(player.room, this.roomStages[player.room]);
        });

        socket.on('startFightStage', () => { 
            if (player == null) return;
            this.startFightStage(player.room);
        });

        socket.on('clearBrokenEggs', () => { 
            if (player == null) return;
            this.clearBrokenEggs(player.room);
        });

        // socket.on('changeTempo', delta => {
        //     if (player == null) return;
        //     this.tempos[player.room] += delta
        //     if (this.tempos[player.room] < 60) {
        //         this.tempos[player.room] = 60;
        //     }
        //     else if (this.tempos[player.room] > 240) {
        //         this.tempos[player.room] = 240;
        //     }
        //     socket.emit('changeTempo', this.tempos[player.room]);
        //     this.startBuildStage(player.room);
        // });

        socket.on('endGame', () => {
            let counts = [];
            for (let p of this.myRooms[player.room]) {
                for (let i = 0; i < p.grid.length; i++) {
                    if (counts[p.grid[i]] == null) counts[p.grid[i]] = 0;
                    counts[p.grid[i]]++;
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
            for (let p of this.myRooms[player.room]) {
                p.palette = pal;
            }
            this.startOutroStage(player.room);
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
            let room = player.room;
            if (this.roomStages[room] === 'setup') {
                let removed = player.number;
                this.gameEngine.removeObjectFromWorld(player.id);
                this.myRooms[room].splice(this.myRooms[room].indexOf(player), 1);
                for (let p of this.myRooms[room]) {
                    if (p.number > removed) {
                        p.number--; 
                        p.move(-this.gameEngine.paramsByRoom[room].playerWidth, 0);
                    }
                } 
            }
            else {
                player.active = 0;
            }
            let activePlayers = this.gameEngine.queryPlayers({ room: room, active: 1 });
            if (activePlayers.length === 0) {
                this.gameEngine.world.forEachObject((objId, obj) => { 
                    if (obj.room === room) this.gameEngine.removeObjectFromWorld(objId);
                });
                delete this.myRooms[room];
                delete this.syncServers[room];
            }
            if (this.myRooms.length === 0) this.gameEngine.restoreDefaultSettings();
        }
    }

    onBeginPerformance(player) {
        this.startBuildStage(player.room, this.roomStages[player.room]);
    }

    startBuildStage(room, from) {
        this.setGameStage(room, 'build');
        this.clearBrokenEggs(room);
        for (let p of this.myRooms[room]) {
            this.attemptPlayerAssimilation(p);
        }
        // if (this.gameEngine.eggsByRoom[room] != null) {
        //     for (let e of this.gameEngine.eggsByRoom[room]) {
        //         this.gameEngine.removeObjectFromWorld(e.id);
        //     }           
        // }
        for (let p of this.myRooms[room]) {
            p.moveTo(p.number * this.gameEngine.paramsByRoom[room].playerWidth, p.yPos);
            p.ammo = this.gameEngine.paramsByRoom[room].startingAmmo;
        }
        let numEggs = this.gameEngine.paramsByRoom[room].numEggsToAdd;
        if (from === "setup") numEggs = this.gameEngine.paramsByRoom[room].numStartingEggs;

        for (let i = 0; i < numEggs; i++) {
            let rand = Math.floor(Math.random()*this.gameEngine.paramsByRoom[room].eggSoundsToUse.length);
            let sound = this.gameEngine.paramsByRoom[room].eggSoundsToUse[rand];
            // this.gameEngine.eggSoundsToUse.splice(rand, 1);
            // if (this.gameEngine.eggSoundsToUse.length === 0) this.gameEngine.eggSoundsToUse = this.gameEngine.eggSounds.slice();
            this.addEgg(sound, room);
        }
    }

    clearBrokenEggs(room)
    {
        if (this.gameEngine.eggsByRoom[room] != null) {
            for (let e of this.gameEngine.eggsByRoom[room]) {
                if (e.broken) this.gameEngine.removeObjectFromWorld(e.id);
            }           
        }
    }

    startFightStage(room) {
        this.setGameStage(room, 'fight');
        this.clearBrokenEggs(room);
        for (let p of this.myRooms[room]) {
            p.ammo = 0;
        }
        this.progressionCounts[room] = 0;
    }

    endFightStage(room) {
        this.setGameStage(room, 'fightEnd');
        this.clearBrokenEggs(room);
        this.actionCounts[room] = 0;
    }

    startOutroStage(room) {
        this.setGameStage(room, 'outro');
        this.clearBrokenEggs(room);
        for (let p of this.myRooms[room]) {
            this.assimilatePlayerToPalette(p, p.palette);
        }
    }

    onEggBounce(e) {
        for (let p of this.myRooms[e.room]) {
            if (p.ammo < this.gameEngine.paramsByRoom[e.room].maxAmmo && 
                Math.random() < this.gameEngine.paramsByRoom[e.room].ammoDropChance) p.ammo++;
        }
    }

    onPlayerAction(p) {
        this.actionCounts[p.room]++;
    }

    onRemoveNote(p) {
        if (this.roomStages[p.room] === 'outro') {
            this.clearBrokenEggs(p.room);
            let notes = this.gameEngine.groupBy(this.gameEngine.world.queryObjects({ instanceType: Note }), 'room')[p.room];
            if (notes != null) {
                if (notes.length > 0) {
                    let note = notes[Math.floor(Math.random()*notes.length)];
                    this.gameEngine.removeObjectFromWorld(note); 
                    return;               
                }
            }
            for (let player of this.myRooms[p.room]) {
                this.assimilatePlayerToPalette(player, 0);
            }
        }   
    }

    onPlayerForfeit(p) {
        let counts = [];
        for (let i = 0; i < p.grid.length; i++) {
            if (counts[p.grid[i]] == null) counts[p.grid[i]] = 0;
            counts[p.grid[i]]++;
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
            if (counts[p.grid[i]] == null) counts[p.grid[i]] = 0;
            counts[p.grid[i]]++;
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

        let playerWidth = this.gameEngine.paramsByRoom[player.room].playerWidth;
        let playerHeight = this.gameEngine.paramsByRoom[player.room].playerHeight;
        player.grid = new Array(playerWidth * playerHeight).fill(player.palette);
    }

    addEgg(sound, roomName) {
        let newEgg = new Egg(this.gameEngine, null, {   position: this.gameEngine.randPos(roomName), 
                                                        velocity: this.gameEngine.velRandY(roomName) });
        let numPlayers = this.gameEngine.playersByRoom[roomName].length;
        //for (let p of this.myRooms[roomName]) p.ammo += this.gameEngine.startingAmmo;
        //newEgg.number = 0;
        newEgg.sound = sound;
        newEgg.hp = Math.round((Math.random() * 
            this.gameEngine.paramsByRoom[roomName].eggHPRange)) + 
            (numPlayers * this.gameEngine.paramsByRoom[roomName].eggHPPerPlayer) + 
            this.gameEngine.paramsByRoom[roomName].eggHPMin;
        newEgg.room = roomName;
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
            if (this.roomStages[room] === 'setup') return;
            let reload = true;
            for (let p of this.myRooms[room]) {
                if (p.ammo > 0) reload = false;
            }
            if (reload) {
                for (let p of this.myRooms[room]) {
                    p.ammo += this.gameEngine.paramsByRoom[room].reloadSize;
                }
            }
            if (this.roomStages[room] !== 'fightEnd') {
                if (this.actionCounts[room] > this.myRooms[room].length * 
                    this.gameEngine.paramsByRoom[room].actionThreshold) {
                    for (let p of this.myRooms[room]) {
                        p.pitchSet = (p.pitchSet + 1) % 
                        (this.gameEngine.paramsByRoom[room].paletteAttributes[p.palette].pitchSets.length - 1);
                        this.actionCounts[room] = 0;
                        //console.log('change');
                    }
                    this.progressionCounts[room]++;
                }
            }
            else if (this.roomStages[room] === 'fight') {
                if (this.progressionCounts[room] >= this.gameEngine.paramsByRoom[room].progressionThreshold) 
                    this.endFightStage(room)
                    
            }
            else if (this.roomStages[room] === 'fightEnd') {
                if (this.actionCounts[room] >= this.myRooms[room].length * this.gameEngine.paramsByRoom[room].freezeThreshold)
                    this.startBuildStage(room, this.roomStages[room]);
            }
            else if (this.roomStages[room] === 'outro') {
                // if (this.gameEngine.eggsByRoom[room] != null) {
                //     for (let e of this.gameEngine.eggsByRoom[room]) {
                //         this.gameEngine.removeObjectFromWorld(e.id);
                //     }           
                // }
            }
        }
    }
}
