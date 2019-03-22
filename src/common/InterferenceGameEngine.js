import { GameEngine, SimplePhysicsEngine, TwoVector } from 'lance-gg';
import Performer from './Performer';
import Egg from './Egg';

const scaleTable = {
    'rain':     [60, 64, 66, 69, 71],
    'celeste':  [60, 62, 63, 65, 67],
    'pyre':     [60, 62, 63, 67, 70],
    'journey':  [60, 62, 64, 67, 69],
    'kirby':    [60, 62, 64, 65, 67],
    'default':  [60, 62, 64, 65, 67]
}
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
            cellSize: 1, playerWidth: 16, playerHeight: 9,
            leftBound: 0, topBound: 0, bottomBound: 9,
            transportSyncInterval: 200, eggRadius: 1, eggBaseXVelocity: 0.1
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
                } 
                else if ((e.position.x + this.eggRadius) > this.rightBoundByRoom[r]) {
                    e.velocity.x *= -1;
                    e.position.x = this.rightBoundByRoom[r] - this.eggRadius;
                }
                if ((e.position.y - this.eggRadius) < this.topBound) {
                    e.velocity.y *= -1
                    e.position.y = this.topBound + this.eggRadius;
                }
                else if ((e.position.y + this.eggRadius) > this.bottomBound) {
                    e.velocity.y *= -1
                    e.position.y = this.bottomBound - this.eggRadius;
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
        if (player) {
            if (inputData.input == 'c') {
                player.palette = palettes[(palettes.indexOf(player.palette)+1)%palettes.length];
                console.log(player.palette);
            }
        }
        if (isServer) { 
        // stuff that should only be processed on the server, such as randomness, which would otherwise cause discrepancies
            if (inputData.input == 'n') {
                let scale = scaleTable[player.palette];
                player.notestack = player.notestack.concat(
                    String.fromCharCode(scale[Math.floor(Math.random() * scale.length)])
                );
                console.log(player.notestack);
            }
            if (inputData.input == 'b') {
                this.emit('beginPerformance', player);
            }
        }
    }
}
