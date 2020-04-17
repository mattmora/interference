"use strict";

import { GameEngine, SimplePhysicsEngine, TwoVector } from 'lance-gg';
import Note from './Note';
import Performer from './Performer';
import Egg from './Egg';

//const palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];

export default class InterferenceGameEngine extends GameEngine {

    constructor(options) {
        super(options);
        this.physicsEngine = new SimplePhysicsEngine({
            gameEngine: this,
            collisions: { type: 'HSHG', autoResolve: false }
        });

        // game variables
        Object.assign(this, {
            room: null,
            shadowIdCount: this.options.clientIDSpace, paramsByRoom: {},
            rooms: [], playersByRoom: {}, eggsByRoom: {}, rightBoundByRoom: {}, notesByRoom: {}
        });

        this.setRoomParamsToDefault('__defaultRoom');

        this.on('preStep', this.preStepLogic.bind(this));
        this.on('postStep', this.postStepLogic.bind(this));
    }

    getNewShadowId() {
        let id = this.shadowIdCount;
        this.shadowIdCount++;
        return id;
    }

    // based on lance findLocalShadow; instead of finding the shadow of a server obj,
    // looks for the server copy of a shadow obj, and removes the shadow if the server copy is found
    resolveShadowObject(shadowObj) {
        if (this.world.queryObject({ id: shadowObj.id }) == null) return null;
        for (let localId of Object.keys(this.world.objects)) {
            if (Number(localId) >= this.options.clientIDSpace) continue;
            let serverObj = this.world.objects[localId];
            if (serverObj.hasOwnProperty('inputId') && serverObj.inputId === shadowObj.inputId) {
                this.removeObjectFromWorld(shadowObj.id);
                return serverObj;
            }
        }
        return null;
    }

    registerClasses(serializer) {
        serializer.registerClass(Note);
        serializer.registerClass(Performer);
        serializer.registerClass(Egg);
    }

    start() {
        super.start();
    }

    wrap(n, mod) {
        return (n % mod + mod) % mod;
    }

    randPos(roomName) {
        let x = Math.random() * this.paramsByRoom[roomName].playerWidth * this.playersByRoom[roomName].length;
        let y = Math.random() * this.paramsByRoom[roomName].playerHeight;
        return new TwoVector(x, y);
    }

    velRandY(roomName) {
        let v = this.paramsByRoom[roomName].eggBaseVelocity;
        let y = v * ((Math.random() * 2) - 1);
        let x = v * ((Math.round(Math.random()) * 2) - 1) * (1 + Math.log(this.playersByRoom[roomName].length));
        return new TwoVector(x, y);
    }

    preStepLogic(stepInfo) {

        this.playersByRoom = this.groupBy(this.world.queryObjects({ instanceType: Performer }), 'room');
        this.rooms = Object.keys(this.playersByRoom);
        this.eggsByRoom = this.groupBy(this.world.queryObjects({ instanceType: Egg }), 'room');
        this.rightBoundByRoom = {};
        this.notesByRoom = this.groupBy(this.world.queryObjects({ instanceType: Note }), 'room');
        for (let r of this.rooms) {
            if (this.paramsByRoom[r] == null) continue;
            this.rightBoundByRoom[r] = this.playersByRoom[r].length * this.paramsByRoom[r].playerWidth;
            if (this.notesByRoom[r] != null) {
                if (this.notesByRoom[r].length > this.paramsByRoom[r].maxNotes) {
                    // let note = this.notesByRoom[r][Math.floor(Math.random()*this.notesByRoom[r].length)];
                    this.removeObjectFromWorld(this.notesByRoom[r][0].id); 
                }
            }
        }
    }

    postStepLogic(stepInfo) {
        for (let r of this.rooms) {
            this.resolveCollisions(r);
            this.gameLogic(r);
        }
    }

    resolveCollisions(r) {
        /*
        if (stepInfo.isReenact)
            return;
        */
        if (this.paramsByRoom[r] == null) return;

        if (this.notesByRoom[r]) {
            for (let i = 0; i < this.notesByRoom[r].length; i++) {
                let removed = null;
                for (let j = i + 1; j < this.notesByRoom[r].length; j++) {
                    if (this.notesByRoom[r][i] == null) break;
                    if (this.notesByRoom[r][j] == null) continue;
                    if (this.notesByRoom[r][i].xPos === this.notesByRoom[r][j].xPos &&
                        this.notesByRoom[r][i].yPos === this.notesByRoom[r][j].yPos) {
                        if (this.notesByRoom[r][i].palette === this.notesByRoom[r][j].palette) continue;
                        // two notes of the same type collide
                        if (this.notesByRoom[r][i].sound === this.notesByRoom[r][j].sound) continue;
                        else if (this.notesByRoom[r][i].sound === 'melody' && this.notesByRoom[r][j].sound === 'perc') {
                            this.resolveNotes(this.notesByRoom[r][i], this.notesByRoom[r][j]);
                            break;
                        }
                        else if (this.notesByRoom[r][i].sound === 'melody' && this.notesByRoom[r][j].sound === 'bass') {
                            this.resolveNotes(this.notesByRoom[r][j], this.notesByRoom[r][i]);
                            break;
                        }
                        else if (this.notesByRoom[r][i].sound === 'perc' && this.notesByRoom[r][j].sound === 'bass') {
                            this.resolveNotes(this.notesByRoom[r][i], this.notesByRoom[r][j]);
                            break;
                        }
                        else if (this.notesByRoom[r][i].sound === 'perc' && this.notesByRoom[r][j].sound === 'melody') {
                            this.resolveNotes(this.notesByRoom[r][j], this.notesByRoom[r][i]);
                            break;
                        }
                        else if (this.notesByRoom[r][i].sound === 'bass' && this.notesByRoom[r][j].sound === 'melody') {
                            this.resolveNotes(this.notesByRoom[r][i], this.notesByRoom[r][j]);
                            break;
                        }
                        else if (this.notesByRoom[r][i].sound === 'bass' && this.notesByRoom[r][j].sound === 'perc') {
                            this.resolveNotes(this.notesByRoom[r][j], this.notesByRoom[r][i]);
                            break;
                        }
                    }
                }
            }
        }

        if (this.eggsByRoom[r]) {
            for (let e of this.eggsByRoom[r]) {
                // bounce off walls
                if (this.paramsByRoom[r].ballWraps) {
                    if (e.position.x < this.paramsByRoom[r].leftBound) {
                        e.position.x = this.rightBoundByRoom[r];
                    }
                    else if (e.position.x > this.rightBoundByRoom[r]) {
                        e.position.x = this.paramsByRoom[r].leftBound;
                    }
                }
                else {
                    if ((e.position.x - this.paramsByRoom[r].eggRadius) < this.paramsByRoom[r].leftBound) {
                        e.velocity.x = Math.abs(e.velocity.x);
                        e.position.x = this.paramsByRoom[r].leftBound + this.paramsByRoom[r].eggRadius;
                        this.emit('eggBounce', e);
                    }
                    else if ((e.position.x + this.paramsByRoom[r].eggRadius) > this.rightBoundByRoom[r]) {
                        e.velocity.x = -Math.abs(e.velocity.x);
                        e.position.x = this.rightBoundByRoom[r] - this.paramsByRoom[r].eggRadius;
                        this.emit('eggBounce', e);
                    }
                }
                if ((e.position.y - this.paramsByRoom[r].eggRadius) < this.paramsByRoom[r].topBound) {
                    e.velocity.y = Math.abs(e.velocity.y);
                    e.position.y = this.paramsByRoom[r].topBound + this.paramsByRoom[r].eggRadius;
                    this.emit('eggBounce', e);
                }
                else if ((e.position.y + this.paramsByRoom[r].eggRadius) > this.paramsByRoom[r].playerHeight) {
                    e.velocity.y = -Math.abs(e.velocity.y);
                    e.position.y = Number(this.paramsByRoom[r].playerHeight) - Number(this.paramsByRoom[r].eggRadius);
                    this.emit('eggBounce', e);
                }
                // check if broken
                if (e.hp <= 0 && !e.broken) {
                    e.broken = true;
                    this.emit('eggBroke', e);
                }
            }
        }
    }

    gameLogic(r) {
        if (this.eggsByRoom[r]) {
            for (let e of this.eggsByRoom[r]) {
                if (e.hp <= 0) {
                    e.velocity.x = 0;
                    e.velocity.y = 0;
                }
            }
            if (this.playersByRoom[r]) {
                for (let p of this.playersByRoom[r]) {
                    if (p.active === 0) {
                        for (let e of this.eggsByRoom[r]) {
                            if (e.broken) {
                                if (this.positionIsInPlayer(e.position.x, p)) this.emit('autoProgress', r);
                            }
                        }
                    }
                }
            }
        }
    }

    positionIsInPlayer(x, p) {
        let leftBound = p.xPos;
        let rightBound = (leftBound + Number(this.paramsByRoom[p.room].playerWidth)) % this.rightBoundByRoom[p.room];
        if (leftBound < rightBound) return (leftBound < x && x < rightBound);
        else return (x > leftBound || x < rightBound);
    }

    quantizedPosition(x, y, divX, divY, roomName) {
        let cellX = Math.floor(x / (this.paramsByRoom[roomName].playerWidth / divX)) * (this.paramsByRoom[roomName].playerWidth / divX);
        let cellY = Math.floor(y / (this.paramsByRoom[roomName].playerHeight / divY)) * (this.paramsByRoom[roomName].playerHeight / divY);
        return [cellX, cellY];
    }

    playerQuantizedPosition(p, x, y, divX, divY) {
        let cell = this.quantizedPosition(x, y, divX, divY, p.room);
        let playerCellX = cell[0] - (p.number * divX);
        let playerCellY = cell[1];
        return [playerCellX, playerCellY];
    }

    groupBy(arr, property) {
        return arr.reduce((grouped, current) => {
            if (!grouped[current[property]]) grouped[current[property]] = [];
            grouped[current[property]].push(current);
            return grouped;
        }, {});
    }

    // based on lance GameWorld.queryObjects
    queryPlayers(query) {
        let queriedPlayers = [];
        for (let p of this.world.queryObjects({ instanceType: Performer })) {
            let conditions = [];

            for (let k of Object.keys(query)) {
                conditions.push(!(k in query) || query[k] !== null && p[k] === query[k]);
            }

            // all conditions are true, object is qualified for the query
            if (conditions.every(value => value)) {
                queriedPlayers.push(p);
            }
        }
        return queriedPlayers;
    }

    playerHitEgg(p, e, isServer) {
        this.emit('playerHitEgg', e);
    }

    // based on lance GameWorld.queryObjects
    queryNotes(query) {
        let queriedNotes = [];
        for (let note of this.world.queryObjects({ instanceType: Note })) {
            let conditions = [];

            for (let k of Object.keys(query)) {
                conditions.push(!(k in query) || query[k] !== null && note[k] === query[k]);
            }

            // all conditions are true, object is qualified for the query
            if (conditions.every(value => value)) {
                queriedNotes.push(note);
            }
        }
        return queriedNotes;
    }

    resolveNotes(remover, removed) {
        if (removed.dur === '4n') {
            removed.sound = remover.sound;
            removed.dur = remover.dur;
        }
        else if (this.world.queryObject({ instanceType: Note, id: removed.id }) != null) {
            this.removeObjectFromWorld(removed.id);
        }
    }

    processInput(inputData, playerId, isServer) {

        super.processInput(inputData, playerId);

        let player = this.world.queryObject({ playerId: playerId });
        if (player == null) return;
        if (!isServer) player.room = this.room;
        let players = this.playersByRoom[player.room];
        let eggs = this.eggsByRoom[player.room];
        let eggsByType = {};
        if (eggs) {
            eggsByType = this.groupBy(eggs, 'sound');
        }
        //console.log(inputData.input);
        if (player.stage === 'setup') {
            //TODO need to update a bunch of stuff on a color change, 
            // also need to be careful when referencing the player palette vs a cell palette, player palette should not change after setup?
            if (inputData.input == 'c') {
                this.emit('updatePalette');
            }
            else if (isServer) {
                // stuff that should only be processed on the server, such as randomness, which would otherwise cause discrepancies
                // or actions that require more info than is available to one player
                //console.log(inputData.input);
                if (inputData.input == 'b') {
                    this.emit('beginPerformance', player);
                }
                else if (inputData.input == '[') {
                    let newNumber = player.number - 1;
                    let newX = null;
                    let newY = null;
                    if (newNumber < 0) newNumber = players.length - 1;
                    for (let p of players) {
                        if (p.number === newNumber) {
                            p.number = player.number;
                            newX = p.xPos;
                            newY = p.yPos;
                            p.moveTo(player.xPos, player.yPos);
                        }
                    }
                    player.moveTo(newX, newY);
                    player.number = newNumber;
                }
                else if (inputData.input == ']') {
                    let newNumber = player.number + 1;
                    let newX = null;
                    let newY = null;
                    if (newNumber >= players.length) newNumber = 0;
                    for (let p of players) {
                        if (p.number === newNumber) {
                            p.number = player.number;
                            newX = p.xPos;
                            newY = p.yPos;
                            p.moveTo(player.xPos, player.yPos);
                        }
                    }
                    player.moveTo(newX, newY);
                    player.number = newNumber;
                }
            }
        }
        else {
            if (!isServer) {
                if (inputData.input == 'space') {
                    if (eggs != null) {
                        for (let e of eggs) {
                            if (this.positionIsInPlayer(e.position.x, player) && !e.broken) {
                                //player.direction = 1;
                                this.playerHitEgg(player, e, isServer);
                                break;
                            }
                        }
                    }
                }
            }
            if (inputData.input == 'p') {
                this.emit('playerAction', player);
            }
            // else if (inputData.input == 'back slash') {
            //     this.emit('playerForfeit', player);
            // }
        }

        if (player.stage === 'build') {
            if (isServer) {
                if (inputData.input == 'w') {
                    player.move(0, -1);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 's') {
                    player.move(0, 1);
                    this.emit('playerAction', player);
                }
                /*
                if (inputData.input == 'b') {
                    this.emit('beginPerformance', player);
                } */
            }
            /*
            else if (inputData.input == 'w') {
                for (let e of eggsByType.perc) {
                    if (this.positionIsInPlayer(e.position.x, player)) {
                        this.playerHitEgg(player, e, isServer);
                    }
                }
            }
            else if (inputData.input == 'e') {
                for (let e of eggsByType.bass) {
                    if (this.positionIsInPlayer(e.position.x, player)) {
                        this.playerHitEgg(player, e, isServer);
                    }
                }
            } */
        }
        else if (player.stage === 'fight') {
            if (isServer) {
                if (inputData.input == 'w') {
                    player.move(0, -1);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 'a') {
                    player.move(-1, 0);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 's') {
                    player.move(0, 1);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 'd') {
                    player.move(1, 0);
                    this.emit('playerAction', player);
                }
                /*
                if (inputData.input == 'b') {
                    this.emit('beginPerformance', player);
                } */
            }
        }
        else if (player.stage === 'outro') {
            if (isServer) {
                if (inputData.input == 'w') {
                    player.move(0, -1);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 'a') {
                    player.move(-1, 0);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 's') {
                    player.move(0, 1);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 'd') {
                    player.move(1, 0);
                    this.emit('playerAction', player);
                }
                else if (inputData.input == 'b' || inputData.input == 'r') {
                    this.emit('removeNote', player);
                    this.emit('playerAction', player);
                }
            }
        }
    }

    setRoomParamsToDefault(room) {
        this.paramsByRoom[room] = {};
        Object.assign(this.paramsByRoom[room], {

            playerWidth: 16, playerHeight: 9, maxNotes: 100,
            eggSounds: ['melody', 'bass', 'perc'], eggSoundsToUse: ['melody', 'bass', 'perc'],
            numStartingEggs: 2, numEggsToAdd: 1, ballWraps: true,
            eggHPRange: 0, eggHPMin: 2, eggHPPerPlayer: 1,
            startingAmmo: 1, maxAmmo: 5, reloadSize: 2, // 1 5 1
            leftBound: 0, topBound: 0, eggDroneVolume: -8, // in decibels
            transportSyncInterval: 180, eggRadius: 1, eggBaseVelocity: 0.1, ammoDropChance: 0.025,
            actionThreshold: 8, progressionThreshold: 8,
            palettes: [1, 2, 3, 4, 5], buildRate: 0.5, fightRate: 1.0, outroRate: 0.5,
            fightRateInc: 0.5, fightRateDec: 1.0, maxFightRate: 2.0,
            melodyBuildOctave: 0, melodyFightOctave: 1,
            bassBuildOctave: 0, bassFightOctave: -1,
            percBuildOctave: 0, percFightOctave: -1,
            buildRelease: 3.0, fightRelease: 0.3, outroRelease: 1.0,
            spectator: false, freezeThreshold: 4, //8
            ringView: false, numRows: 1, isLeader: true, inPersonPerformance: false,
            paletteAttributes: [
                { //default
                    //'default': 
                    colors: {
                        bg: '#000',
                        c1: '#000',
                        c2: '#000',
                        c3: '#000',
                        c4: '#000'
                    },
                    scale: [0, 2, 4, 5, 7, 9, 11],
                    pitchSets: [
                        [0, 2, 4], //1
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4], //5
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4], //9
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4], //13
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4]
                    ],
                    melody: {
                        modulationIndex: 4,
                        harmonicity: 4,
                        osc: "sawtooth",
                        modType: "sine",
                        subdivision: '32n' // for now these need to be the same across each palette color
                    },
                    bass: {
                        modulationIndex: 6,
                        harmonicity: 5,
                        osc: "triangle",
                        modType: "sine",
                        subdivision: '8n' // for now these need to be the same across each palette color
                    },
                    perc: {
                        pitchDecay: 0.05,
                        octaves: 10,
                        osc: "sine",
                        subdivision: '16n' // for now these need to be the same across each palette color
                    }
                },
                { //rain
                    colors: {
                        bg: '#3e2f5b',
                        c1: '#d7dedc',
                        c2: '#706563',
                        c3: '#457eac',
                        c4: '#748386'
                    },
                    scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    pitchSets: [
                        [2, 7, 10], //1
                        [2, 7, 10],
                        [2, 6, 9],
                        [2, 6, 9],
                        [0, 5, 8], //5
                        [0, 2, 5, 8],
                        [0, 3, 7],
                        [0, 3, 7],
                        [0, 3, 8], //9
                        [0, 3, 8],
                        [0, 3, 7],
                        [0, 3, 7],
                        [2, 6, 9], //13
                        [2, 6, 9],
                        [2, 7, 11],
                        [2, 7, 9]
                    ],
                    melody: {
                        modulationIndex: 2,
                        harmonicity: 4,
                        osc: "sawtooth",
                        modType: "square",
                        subdivision: '32n'
                    },
                    bass: {
                        modulationIndex: 6,
                        harmonicity: 1.5,
                        osc: "triangle",
                        modType: "square",
                        subdivision: '8n'
                    },
                    perc: {
                        pitchDecay: 0.05,
                        octaves: 2,
                        osc: "sine",
                        subdivision: '16n'
                    }
                },
                { //celeste
                    colors: {
                        bg: '#a5d8ff',
                        c1: '#ff8266',
                        c2: '#4381af',
                        c3: '#ac86b0',
                        c4: '#4b719c'
                    },
                    scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    pitchSets: [
                        [0, 4, 8, 9], //1
                        [0, 4, 7],
                        [0, 5, 9],
                        [4, 8, 11],
                        [0, 4, 8, 9], //5
                        [0, 4, 7],
                        [0, 5, 9],
                        [4, 8, 11],
                        [0, 4, 9], //9
                        [2, 4, 8, 11],
                        [0, 4, 7],
                        [0, 2, 5, 9],
                        [0, 4, 9], //13
                        [0, 4, 9],
                        [4, 8, 11],
                        [4, 8, 11]
                    ],
                    melody: {
                        modulationIndex: 3,
                        harmonicity: 2,
                        osc: "sine",
                        modType: "square",
                        subdivision: '32n'
                    },
                    bass: {
                        modulationIndex: 6,
                        harmonicity: 3,
                        osc: "triangle",
                        modType: "sine",
                        subdivision: '8n'
                    },
                    perc: {
                        pitchDecay: 0.05,
                        octaves: 10,
                        osc: "sine",
                        subdivision: '16n'
                    }
                },
                { //pyre
                    colors: {
                        bg: '#a32323',
                        c1: '#2375a8',
                        c2: '#fbf6f7',
                        c3: '#f0ae62',
                        c4: '#011936'
                    },
                    scale: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
                    pitchSets: [
                        [4, 7, 11], //1
                        [4, 7, 11],
                        [2, 6, 9, 11],
                        [2, 6, 9, 11],
                        [0, 4, 7], //5
                        [0, 4, 7],
                        [2, 6, 9],
                        [2, 6, 9],
                        [2, 4, 7, 11], //9
                        [2, 6, 11],
                        [0, 4, 7],
                        [2, 7, 11],
                        [0, 4, 6, 9], //13
                        [4, 7, 11],
                        [3, 6, 11],
                        [3, 6, 9, 11]
                    ],
                    melody: {
                        modulationIndex: 40,
                        harmonicity: 20,
                        osc: "square",
                        modType: "sawtooth",
                        subdivision: '32n'
                    },
                    bass: {
                        modulationIndex: 8,
                        harmonicity: 5,
                        osc: "triangle",
                        modType: "sawtooth",
                        subdivision: '8n'
                    },
                    perc: {
                        pitchDecay: 0.001,
                        octaves: 10,
                        osc: "sine",
                        subdivision: '16n'
                    }
                },
                { //journey
                    colors: {
                        bg: '#fad68a',
                        c1: '#7f2819',
                        c2: '#a25a11',
                        c3: '#d5a962',
                        c4: '#fef8e8'
                    },
                    scale: [0, 2, 3, 5, 7, 9, 10], // F mixo
                    pitchSets: [
                        [0, 3, 5], //1
                        [0, 2, 3, 6],
                        [1, 2, 4, 6],
                        [0, 3, 5],
                        [2, 4, 6], //5
                        [1, 4, 6],
                        [1, 3, 4, 6],
                        [0, 4, 5],
                        [0, 3, 5], //9
                        [0, 4, 5],
                        [0, 3, 5],
                        [1, 2, 4],
                        [0, 2, 4], //13
                        [1, 4, 6],
                        [1, 4, 5],
                        [2, 4, 6]
                    ],
                    melody: {
                        modulationIndex: 0,
                        harmonicity: 4,
                        osc: "triangle",
                        modType: "sawtooth",
                        subdivision: '32n'
                    },
                    bass: {
                        modulationIndex: 6,
                        harmonicity: 0.5,
                        osc: "triangle",
                        modType: "square",
                        subdivision: '8n'
                    },
                    perc: {
                        pitchDecay: 0.001,
                        octaves: 5,
                        osc: "sine",
                        subdivision: '16n'
                    }
                },
                { //kirby
                    colors: {
                        bg: '#a8c256',
                        c1: '#f4a4a7',
                        c2: '#e84c41',
                        c3: '#f9df6a',
                        c4: '#fa8334'
                    },
                    scale: [0, 2, 4, 5, 7, 9, 11], // C diatonic (C maj)
                    pitchSets: [
                        [0, 2, 4], //1
                        [0, 2, 4, 6],
                        [0, 3, 4, 6],
                        [0, 2, 4],
                        [1, 3, 5], //5
                        [0, 1, 3, 5],
                        [1, 4, 6],
                        [1, 3, 4, 6],
                        [0, 2, 5], //9
                        [0, 2, 4, 5],
                        [1, 4, 6],
                        [0, 3, 5],
                        [0, 2, 4], //13
                        [0, 2, 4, 6],
                        [0, 3, 4, 6],
                        [1, 3, 4, 6]
                    ],
                    melody: {
                        modulationIndex: 10,
                        harmonicity: 4,
                        osc: "square",
                        modType: "sawtooth",
                        subdivision: '32n'
                    },
                    bass: {
                        modulationIndex: 10,
                        harmonicity: 20,
                        osc: "square",
                        modType: "sawtooth",
                        subdivision: '8n'
                    },
                    perc: {
                        pitchDecay: 0.001,
                        octaves: 1,
                        osc: "sine",
                        subdivision: '16n'
                    }
                }
            ]
        });
    }
}
