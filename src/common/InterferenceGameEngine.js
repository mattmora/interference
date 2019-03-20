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
        this.on('preStep', this.moveAll.bind(this));

        // game variables
        Object.assign(this, {
            playerWidth: 16, playerHeight: 9, transportSyncInterval: 200
        });

        /*
        Object.assign(this, {
            foodRadius: 0.1, headRadius: 0.15, bodyRadius: 0.1,
            eyeDist: 0.08, eyeRadius: 0.03, eyeAngle: 0.5,
            spaceWidth: 16, spaceHeight: 9, moveDist: 0.06,
            foodCount: 16, eatDistance: 0.3, collideDistance: 0.3,
            startBodyLength: 10, aiCount: 3, directionStop: 100
        }); */
    }

    registerClasses(serializer) {
        serializer.registerClass(Performer);
        serializer.registerClass(Egg);
    }

    start() {
        super.start();
    }

    randPos() {
        let x = (Math.random() - 0.5) * this.spaceWidth;
        let y = (Math.random() - 0.5) * this.spaceHeight;
        return new TwoVector(x, y);
    }

    moveAll(stepInfo) {

        if (stepInfo.isReenact)
            return;

        this.world.forEachObject((id, obj) => {
            if (obj instanceof Performer) {
                /*
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
                */
            }
        });
    }

    processInput(inputData, playerId, isServer) {

        super.processInput(inputData, playerId);
        
        let player = this.world.queryObject({ playerId });
        if (player) {
            if (inputData.input == 'n') {
                let scale = scaleTable[player.palette];
                player.notestack = player.notestack.concat(
                    String.fromCharCode(scale[Math.floor(Math.random() * scale.length)])
                );
                console.log(player.notestack);
            }
            else if (inputData.input == 'c') {
                player.palette = palettes[(palettes.indexOf(player.palette)+1)%palettes.length];
                console.log(player.palette);
            }
        }
        if (isServer) {

        }
        else {
            if (player) {
                if (inputData.input == 'space') {

                }
            }
        }
    }
}
