import { GameEngine, SimplePhysicsEngine, TwoVector } from 'lance-gg';
import Performer from './Performer';
import Egg from './Egg';

const palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];

export default class InterferenceGameEngine extends GameEngine {

    constructor(options) {
        super(options);
        this.physicsEngine = new SimplePhysicsEngine({
            gameEngine: this,
            collisions: { autoResolve: false }
        });

        // game constants
        Object.assign(this, {
            cellWidth: 1, cellHeight: 1, playerWidth: 16, playerHeight: 9, 
            leftBound: 0, topBound: 0, bottomBound: 9,
            transportSyncInterval: 200, eggRadius: 1, eggBaseXVelocity: 0.1
        });

        // dependent game constants
        Object.assign(this, {
            playerCellWidth: this.playerWidth / this.cellWidth, 
            playerCellHeight: this.playerHeight / this.cellHeight, 
            cellsPerPlayer: (this.playerWidth / this.cellWidth) * (this.playerHeight / this.cellHeight) 
        });

        // game variables
        Object.assign(this, {
            rooms: [], playersByRoom: {}, eggsByRoom: {}, rightBoundByRoom: {}
        });

        this.on('preStep', this.preStepLogic.bind(this));
        this.on('postStep', this.postStepLogic.bind(this));
    }

    registerClasses(serializer) {
        serializer.registerClass(Performer);
        serializer.registerClass(Egg);
    }

    start() {
        super.start();
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
        this.playersByRoom = this.groupBy(this.world.queryObjects({ instanceType: Performer }), "_roomName");
        this.rooms = Object.keys(this.playersByRoom);
        this.eggsByRoom = this.groupBy(this.world.queryObjects({ instanceType: Egg }), "_roomName");
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

    playerHitEgg(p, e, isServer) {
        if (e.hp <= 0) return;
        if (p.ammo <= 0) return;
        p.ammo--;
        this.emit('playerHitEgg', e);
        if (isServer) {
            e.hp--;
            console.log(e.hp)
        }
    }

    positionIsInPlayer(x, p) {
        let leftBound = p.number * this.playerWidth;
        let rightBound = (p.number + 1) * this.playerWidth;
        return (leftBound < x && x < rightBound);
    }

    cellAtPosition(x, y) {
        let cellX = Math.floor(x / this.cellWidth);
        let cellY = Math.floor(y / this.cellHeight);
        return [cellX, cellY];
    }

    playerCellAtPosition(p, x, y) {
        let cell = this.cellAtPosition(x, y)
        let playerCellX = cell[0] - (p.number * this.playerCellWidth);
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

    processInput(inputData, playerId, isServer) {

        super.processInput(inputData, playerId);
        
        let player = this.world.queryObject({ playerId });
        let players = this.playersByRoom[player._roomName];
        let eggs = this.eggsByRoom[player._roomName];

        if (player.stage === 'setup') {
            if (inputData.input == 'c') {
                player.palette = palettes[(palettes.indexOf(player.palette)+1)%palettes.length];
                console.log(player.palette);
            }
            if (isServer) { 
            // stuff that should only be processed on the server, such as randomness, which would otherwise cause discrepancies
            // or actions that require more info than is available to one player
            //console.log(inputData.input);
                if (inputData.input == '[') {
                    let newNumber = player.number - 1;
                    if (newNumber < 0) newNumber = players.length - 1;
                    for (let p of players) { 
                        if (p.number === newNumber) p.number = player.number; 
                    }
                    player.number = newNumber;
                }
                else if (inputData.input == ']') {
                    let newNumber = player.number + 1;
                    if (newNumber >= players.length) newNumber = 0;
                    for (let p of players) { 
                        if (p.number === newNumber) p.number = player.number; 
                    }
                    player.number = newNumber;
                } 
                else if (inputData.input == 'b') {
                    this.emit('beginPerformance', player);
                }
            }
        }
        else if (player.stage === 'intro') {
            if (inputData.input == 'space') {
                for (let e of eggs) {
                    if (this.positionIsInPlayer(e.position.x, player)) {
                        this.playerHitEgg(player, e, isServer);
                    }
                }
            }
        }
        /*
        else if (inputData.input == 'n') {
            let scale = scaleTable[player.palette];
            player.notestack = player.notestack.concat(
                String.fromCharCode(scale[Math.floor(Math.random() * scale.length)])
            );
            console.log(player.notestack);
        } */
    }
}
