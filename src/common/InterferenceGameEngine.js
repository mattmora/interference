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
            collisions: { autoResolve: false }
        });

        // game constants
        Object.assign(this, {
            // map: { setup: { variations: [0]['intro'], 
            // intro: ['buildMelody', 'buildBass', 'buildPerc'],
            // buildMelody: ['fight']
            // fight
            // },
            playerWidth: 32, playerHeight: 18, 
            eggSounds: ['melody', 'bass', 'perc'], eggHPRange: 3, eggHPMin: 4, startingAmmo: 1, maxAmmo: 8, reloadSize: 2,
            leftBound: 0, topBound: 0, bottomBound: 18,
            transportSyncInterval: 200, eggRadius: 1, eggBaseVelocity: 0.2, ammoDropChance: 0.3,
            actionThreshold: 2, progressionThreshold: 4, 
            palettes: [1, 2, 3, 4, 5],
            paletteAttributes: [
                { //default
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
                        [0, 2, 4],
                        [0, 1, 2, 3, 4, 5, 6] //scale
                    ],
                    gridWidth: 1,
                    gridHeight: 1,
                    melody: {
                        subdivision: '32n',
                        length: 0
                    },
                    bass: {
                        subdivision: '8n',
                        length: 0
                    },
                    perc: {
                        subdivision: '16n',
                        length: 0
                    }
                },
                { //rain
                    scale: [1, 2, 4, 5, 7, 9, 10], // D harm min
                    pitchSets: [
                        [1, 3, 5], //1
                        [1, 3, 5],
                        [0, 2, 5],
                        [0, 2, 5],
                        [2, 4, 6], //5
                        [2, 4, 6],
                        [1, 4, 6],
                        [1, 4, 6],
                        [1, 4, 6], //9
                        [1, 4, 6],
                        [1, 4, 6],
                        [1, 4, 6],
                        [0, 2, 5], //13
                        [0, 2, 5],
                        [1, 3, 5],
                        [1, 3, 5],
                        [0, 1, 2, 3, 4, 5, 6] //scale
                    ],
                    gridWidth: 32,
                    gridHeight: 18,
                    melody: {
                        subdivision: '32n',
                        length: 32
                    },
                    bass: {
                        subdivision: '8n',
                        length: 32
                    },
                    perc: {
                        subdivision: '16n',
                        length: 32
                    }
                },
                { //celeste
                    scale: [1, 3, 4, 6, 7, 9, 11], // E mel min asc
                    pitchSets: [
                        [0, 3, 5], //1
                        [0, 3, 5],
                        [0, 3, 5],
                        [2, 4, 6],
                        [1, 3, 6], //5
                        [1, 3, 6],
                        [0, 2, 5],
                        [0, 2, 5],
                        [0, 3, 5], //9
                        [0, 3, 5],
                        [1, 3, 6],
                        [1, 3, 6],
                        [2, 4, 6], //13
                        [1, 3, 6],
                        [0, 3, 5],
                        [0, 3, 5],
                        [0, 1, 2, 3, 4, 5, 6] //scale
                    ],
                    gridWidth: 32,
                    gridHeight: 18,
                    melody: {
                        subdivision: '32n',
                        length: 32
                    },
                    bass: {
                        subdivision: '8n',
                        length: 32
                    },
                    perc: {
                        subdivision: '16n',
                        length: 32
                    }
                },
                { //pyre
                    scale: [0, 2, 4, 6, 7, 9, 11], // E minor
                    pitchSets: [
                        [2, 4, 6], //1
                        [2, 4, 6],
                        [2, 4, 6],
                        [2, 4, 6],
                        [2, 4, 6], //5
                        [1, 3, 6],
                        [2, 4, 6],
                        [2, 4, 6],
                        [0, 2, 5], //9
                        [0, 2, 5],
                        [2, 4, 6],
                        [2, 4, 6],
                        [2, 4, 6], //13
                        [1, 3, 5],
                        [0, 2, 4],
                        [1, 3, 5],
                        [0, 1, 2, 3, 4, 5, 6] //scale
                    ],
                    gridWidth: 32,
                    gridHeight: 18,
                    melody: {
                        subdivision: '32n',
                        length: 32
                    },
                    bass: {
                        subdivision: '8n',
                        length: 32
                    },
                    perc: {
                        subdivision: '16n',
                        length: 32
                    }
                },
                { //journey
                    scale: [0, 2, 3, 5, 7, 9, 10], // F mixo
                    pitchSets: [
                        [0, 3, 5], //1
                        [0, 3, 5],
                        [2, 4, 6],
                        [2, 4, 6],
                        [1, 3, 5], //5
                        [1, 3, 5],
                        [1, 3, 5],
                        [1, 3, 5],
                        [0, 3, 5], //9
                        [0, 3, 5],
                        [0, 2, 4],
                        [0, 2, 4],
                        [1, 3, 6], //13
                        [1, 3, 6],
                        [1, 3, 6],
                        [1, 3, 6],
                        [0, 1, 2, 3, 4, 5, 6] //scale
                    ],
                    gridWidth: 32,
                    gridHeight: 18,
                    melody: {
                        subdivision: '32n',
                        length: 32
                    },
                    bass: {
                        subdivision: '8n',
                        length: 32
                    },
                    perc: {
                        subdivision: '16n',
                        length: 32
                    }
                },
                { //kirby
                    scale: [0, 2, 4, 5, 7, 9, 11], // C diatonic (C maj)
                    pitchSets: [
                        [0, 2, 4], //1
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 4],
                        [1, 3, 5], //5
                        [1, 4, 6],
                        [0, 2, 4],
                        [0, 2, 4],
                        [0, 2, 5], //9
                        [0, 2, 5],
                        [1, 4, 6],
                        [0, 2, 4],
                        [0, 2, 5], //13
                        [0, 2, 5],
                        [1, 4, 6],
                        [0, 2, 4],
                        [0, 1, 2, 3, 4, 5, 6] //scale
                    ],
                    gridWidth: 32,
                    gridHeight: 18,
                    melody: {
                        subdivision: '32n',
                        length: 32
                    },
                    bass: {
                        subdivision: '8n',
                        length: 32
                    },
                    perc: {
                        subdivision: '16n',
                        length: 32
                    }
                }
            ]
        });

        // game variables
        Object.assign(this, {
            shadowIdCount: this.options.clientIDSpace, 
            rooms: [], playersByRoom: {}, eggsByRoom: {}, rightBoundByRoom: {}, notesByRoom: {},
            eggSoundsToUse: this.eggSounds.slice()
        });

        this.on('preStep', this.preStepLogic.bind(this));
        this.on('postStep', this.postStepLogic.bind(this));
    }

    getNewShadowId() {
        let id = this.shadowIdCount;
        this.shadowIdCount++;
        return id;
    }

    // based on lance findLocalShadow; instead of finding the shadow of a server obj,
    // looks for the server copy of a shadow obj, and removes the shadow if the server copy if found
    resolveShadowObject(shadowObj) {
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
        let x = Math.random() * this.playerWidth * this.playersByRoom[roomName].length;
        let y = Math.random() * this.playerHeight;
        return new TwoVector(x, y);
    }

    velRandY(roomName) {
        let v = this.eggBaseVelocity * (1 + Math.log(this.playersByRoom[roomName].length));
        let y = v * ((Math.random() * 2) - 1);
        let x = v * ((Math.round(Math.random()) * 2) - 1)
        return new TwoVector(x, y);
    }

    preStepLogic(stepInfo) {
        this.playersByRoom = this.groupBy(this.world.queryObjects({ instanceType: Performer }), '_roomName');
        this.rooms = Object.keys(this.playersByRoom);
        this.eggsByRoom = this.groupBy(this.world.queryObjects({ instanceType: Egg }), '_roomName');
        this.rightBoundByRoom = {};
        this.notesByRoom = this.groupBy(this.world.queryObjects({ instanceType: Note }), '_roomName');
        for (let r of this.rooms) {
            this.rightBoundByRoom[r] = this.playersByRoom[r].length * this.playerWidth;
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
        if (this.notesByRoom[r]) {
            let removed = null;
            for (let i = 0; i < this.notesByRoom[r].length; i++) {
                // skip this one if it's been removed?
                // if (removed === this.notesByRoom[r][i].id) continue;
                for (let j = i + 1; j < this.notesByRoom[r].length; j++) {
                    if (this.notesByRoom[r][i].xPos === this.notesByRoom[r][j].xPos &&
                        this.notesByRoom[r][i].yPos === this.notesByRoom[r][j].yPos) {
                        if (this.notesByRoom[r][i].palette === this.notesByRoom[r][j].palette) continue;
                        // two notes of the same type collide
                        if (this.notesByRoom[r][i].sound === this.notesByRoom[r][j].sound) {
                            // TODO what to do?
                        }
                        else if (   this.notesByRoom[r][i].sound === 'melody' &&
                                    this.notesByRoom[r][j].sound === 'perc') {
                            if (this.world.queryObject(this.notesByRoom[r][j].id) != null) {
                                this.removeObjectFromWorld(this.notesByRoom[r][j].id);
                                removed = this.notesByRoom[r][j].id;
                                this.emit('removedNote', r);
                            } 
                        }
                        else if (   this.notesByRoom[r][i].sound === 'melody' &&
                                    this.notesByRoom[r][j].sound === 'bass') {
                            if (this.world.queryObject(this.notesByRoom[r][i].id) != null) {
                                this.removeObjectFromWorld(this.notesByRoom[r][i].id);
                                this.emit('removedNote', r);
                            }
                        }
                        else if (   this.notesByRoom[r][i].sound === 'perc' &&
                                    this.notesByRoom[r][j].sound === 'bass') {
                            if (this.world.queryObject(this.notesByRoom[r][j].id) != null) {
                                this.removeObjectFromWorld(this.notesByRoom[r][j].id);
                                removed = this.notesByRoom[r][j].id;
                                this.emit('removedNote', r);
                            }
                        }
                        else if (   this.notesByRoom[r][i].sound === 'perc' &&
                                    this.notesByRoom[r][j].sound === 'melody') {
                            if (this.world.queryObject(this.notesByRoom[r][i].id) != null) {
                                this.removeObjectFromWorld(this.notesByRoom[r][i].id);
                                this.emit('removedNote', r);
                            }
                        }
                        else if (   this.notesByRoom[r][i].sound === 'bass' &&
                                    this.notesByRoom[r][j].sound === 'melody') {
                            if (this.world.queryObject(this.notesByRoom[r][j].id) != null) {
                                this.removeObjectFromWorld(this.notesByRoom[r][j].id);
                                removed = this.notesByRoom[r][j].id;
                                this.emit('removedNote', r);
                            }
                        }                   
                        else if (   this.notesByRoom[r][i].sound === 'bass' &&
                                    this.notesByRoom[r][j].sound === 'perc') {
                            if (this.world.queryObject(this.notesByRoom[r][i].id) != null) {
                                this.removeObjectFromWorld(this.notesByRoom[r][i].id);
                                this.emit('removedNote', r);
                            }
                        }
                    }
                }
            }   
        }

        if (this.eggsByRoom[r]) {
            for (let e of this.eggsByRoom[r]) {
                // bounce off walls
                if ((e.position.x - this.eggRadius) < this.leftBound) {
                    e.velocity.x = Math.abs(e.velocity.x);
                    e.position.x = this.leftBound + this.eggRadius;
                    this.emit('eggBounce', e);
                } 
                else if ((e.position.x + this.eggRadius) > this.rightBoundByRoom[r]) {
                    e.velocity.x = -Math.abs(e.velocity.x);
                    e.position.x = this.rightBoundByRoom[r] - this.eggRadius;
                    this.emit('eggBounce', e);
                }
                if ((e.position.y - this.eggRadius) < this.topBound) {
                    e.velocity.y = Math.abs(e.velocity.y);
                    e.position.y = this.topBound + this.eggRadius;
                    this.emit('eggBounce', e);
                }
                else if ((e.position.y + this.eggRadius) > this.bottomBound) {
                    e.velocity.y = -Math.abs(e.velocity.y);
                    e.position.y = this.bottomBound - this.eggRadius;
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
        let leftBound = p.number * this.playerWidth;
        let rightBound = (p.number + 1) * this.playerWidth;
        return (leftBound < x && x < rightBound);
    }

    quantizedPosition(x, y, divX, divY) {
        let cellX = Math.floor(x / (this.playerWidth / divX)) * (this.playerWidth / divX);
        let cellY = Math.floor(y / (this.playerHeight / divY)) * (this.playerHeight / divY);
        return [cellX, cellY];
    }

    playerQuantizedPosition(p, x, y, divX, divY) {
        let cell = this.quantizedPosition(x, y, divX, divY);
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

    playerHitEgg(p, e, isServer) {
        this.emit('playerHitEgg', e);
    }

    processInput(inputData, playerId, isServer) {

        super.processInput(inputData, playerId);
        
        let player = this.world.queryObject({ playerId });
        let players = this.playersByRoom[player._roomName];
        let eggs = this.eggsByRoom[player._roomName];
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
            if (inputData.input == 'p') {
                this.emit('playerAction', player);
            }
            else if (inputData.input == 'back slash') {
                this.emit('playerForfeit', player);
            }
        }
        if (player.stage === 'intro') {

        }
        else if (player.stage === 'build') {
            if (inputData.input == 'space') {
                for (let e of eggs) {
                    if (this.positionIsInPlayer(e.position.x, player)) {
                        //player.direction = 1;
                        this.playerHitEgg(player, e, isServer);
                    }
                }
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
                }
                else if (inputData.input == 'a') {
                    player.move(-1, 0);
                }
                else if (inputData.input == 's') {
                    player.move(0, 1);
                }
                else if (inputData.input == 'd') {
                    player.move(1, 0);
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
                }
                else if (inputData.input == 'a') {
                    player.move(-1, 0);
                }
                else if (inputData.input == 's') {
                    player.move(0, 1);
                }
                else if (inputData.input == 'd') {
                    player.move(1, 0);
                }
                else if (inputData.input == 'space') {
                    this.emit('removeNote', player);
                }
            }
        }
    }
}
