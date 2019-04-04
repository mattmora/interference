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
            eggSounds: ['melody', 'bass', 'perc'], eggHPRange: 4, eggHPMin: 3, startingAmmo: 2, reloadSize: 2,
            leftBound: 0, topBound: 0, bottomBound: 18,
            transportSyncInterval: 200, eggRadius: 1, eggBaseXVelocity: 0.5,
            palettes: [1, 2, 3, 4, 5],
            paletteAttributes: [
                { //default
                    scale: [0, 2, 4, 5, 7], 
                    gridWidth: 1,
                    gridHeight: 1,
                    melody: {
                        subdivision: '1n',
                        length: 0
                    },
                    bass: {
                        subdivision: '1n',
                        length: 0
                    },
                    perc: {
                        subdivision: '1n',
                        length: 0
                    }
                },
                { //rain
                    scale: [2, 3, 5, 9, 10], 
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
                    scale: [0, 4, 5, 9, 10], 
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
                    scale: [0, 2, 6, 7, 11], 
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
                    scale: [1, 2, 6, 7, 9], 
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
                    scale: [0, 4, 5, 7, 11], 
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
            rooms: [], playersByRoom: {}, eggsByRoom: {}, rightBoundByRoom: {},
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

    velRandY() {
        let y = (Math.random() - 0.5) * this.eggBaseXVelocity;
        return new TwoVector(this.eggBaseXVelocity, y);
    }

    preStepLogic(stepInfo) {
        this.playersByRoom = this.groupBy(this.world.queryObjects({ instanceType: Performer }), '_roomName');
        this.rooms = Object.keys(this.playersByRoom);
        this.eggsByRoom = this.groupBy(this.world.queryObjects({ instanceType: Egg }), '_roomName');
        this.rightBoundByRoom = {};
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

        if (this.eggsByRoom[r]) {
            for (let e of this.eggsByRoom[r]) {
                // bounce off walls
                if ((e.position.x - this.eggRadius) < this.leftBound) {
                    e.velocity.x *= -1;
                    e.position.x = this.leftBound + this.eggRadius;
                    this.emit('eggBounce', e);
                } 
                else if ((e.position.x + this.eggRadius) > this.rightBoundByRoom[r]) {
                    e.velocity.x *= -1;
                    e.position.x = this.rightBoundByRoom[r] - this.eggRadius;
                    this.emit('eggBounce', e);
                }
                if ((e.position.y - this.eggRadius) < this.topBound) {
                    e.velocity.y *= -1
                    e.position.y = this.topBound + this.eggRadius;
                    this.emit('eggBounce', e);
                }
                else if ((e.position.y + this.eggRadius) > this.bottomBound) {
                    e.velocity.y *= -1
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
        
                        /*
        this.world.forEachObject((id, obj) => {
            if (obj instanceof Egg) {

                // if the position changed, add a body part and trim the length
                let pos = obj.position.clone();
                if (obj.bodyParts.length === 0 || pos.subtract(obj.bodyParts[obj.bodyParts.length-1]).length() > 0.05) {
                    obj.bodyParts.push(obj.position.clone());
                    while (obj.bodyLength < obj.bodyParts.length) obj.bodyParts.shift();
                }

                // if not stopped, move along
                if (obj.direction === this.directionStop) return;
                let move = new TwoVector(Math.cos(obj.direction), Math.sin(obj.direction));
                move.multiplyScalar(0.05);
                obj.position.add(move);
                obj.position.y = Math.min(obj.position.y, this.spaceHeight / 2);
                obj.position.y = Math.max(obj.position.y, -this.spaceHeight / 2);
                obj.position.x = Math.min(obj.position.x, this.spaceWidth / 2);
                obj.position.x = Math.max(obj.position.x, -this.spaceWidth / 2);

            }
        });                */
    }

    gameLogic(r) {
        if (this.eggsByRoom[r]) {
            for (let e of this.eggsByRoom[r]) {
                if (e.hp <= 0) {
                    e.velocity.x = 0;
                    e.velocity.y = 0;
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
                    if (newNumber < 0) newNumber = players.length - 1;
                    for (let p of players) { 
                        if (p.number === newNumber) {
                            p.number = player.number; 
                            p.move((p.number - newNumber) * this.playerWidth, 0);
                        }
                    }
                    player.move((newNumber - player.number) * this.playerWidth, 0);
                    player.number = newNumber;
                }
                else if (inputData.input == ']') {
                    let newNumber = player.number + 1;
                    if (newNumber >= players.length) newNumber = 0;
                    for (let p of players) { 
                        if (p.number === newNumber) {
                            p.number = player.number; 
                            p.move((p.number - newNumber) * this.playerWidth, 0);
                        }
                    }
                    player.move((newNumber - player.number) * this.playerWidth, 0);
                    player.number = newNumber;
                } 
            }
        }
        else if (player.stage === 'intro') {

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
                    player.paint();
                }
                else if (inputData.input == 'a') {
                    player.move(-1, 0);
                    player.paint();
                }
                else if (inputData.input == 's') {
                    player.move(0, 1);
                    player.paint();
                }
                else if (inputData.input == 'd') {
                    player.move(1, 0);
                    player.paint();
                }
                if (inputData.input == 'b') {
                    this.emit('beginPerformance', player);
                }
            }
        }
    }
}
