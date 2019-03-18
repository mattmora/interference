import ServerEngine from 'lance/ServerEngine';
import TwoVector from 'lance/serialize/TwoVector';
import Performer from '../common/Performer';
import Egg from '../common/Egg';

let idCount = 0;
let transportSyncCount = 0;

export default class InterferenceServerEngine extends ServerEngine {

    constructor(io, gameEngine, inputOptions) {
        super(io, gameEngine, inputOptions);
        this.gameEngine.on('postStep', this.stepLogic.bind(this));
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
        player.number = this.gameEngine.world.playerCount;
        console.log(this.gameEngine.world.playerCount);
        player.playerId = socket.playerId;
        this.gameEngine.addObjectToWorld(player);
    }

    onPlayerDisconnected(socketId, playerId) {
        super.onPlayerDisconnected(socketId, playerId);
        let player = this.gameEngine.world.queryObject({ playerId });
        if (player) { 
            let removed = player.number;
            this.gameEngine.removeObjectFromWorld(player.id);
            let players = this.gameEngine.world.queryObjects({ instanceType: Performer });
            for (let p of players) if (p.number > removed) p.number--; 
        }
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

        let players = this.gameEngine.world.queryObjects({ instanceType: Performer });
        let eggs = this.gameEngine.world.queryObjects({ instanceType: Egg });
        for (let p of players) {
            /*
            // check for collision
            for (let w2 of wiggles) {
                if (w === w2)
                    continue;

                for (let i = 0; i < w2.bodyParts.length; i++) {
                    let distance = w2.bodyParts[i].clone().subtract(w.position);
                    if (distance.length() < this.gameEngine.collideDistance)
                        this.wiggleHitWiggle(w, w2);
                }
            }

            // check for food-eating
            for (let f of foodObjects) {
                let distance = w.position.clone().subtract(f.position);
                if (distance.length() < this.gameEngine.eatDistance) {
                    this.wiggleEatFood(w, f);
                }
            }

            // move AI wiggles
            if (w.AI) {
                if (Math.random() < 0.01) w.turnDirection *= -1;
                w.direction += w.turnDirection * (Math.random() - 0.9)/20;
                if (w.position.y >= this.gameEngine.spaceHeight / 2) w.direction = -Math.PI/2;
                if (w.position.y <= -this.gameEngine.spaceHeight / 2) w.direction = Math.PI/2;
                if (w.position.x >= this.gameEngine.spaceWidth / 2) w.direction = Math.PI;
                if (w.position.x <= -this.gameEngine.spaceWidth / 2) w.direction = 0;
                if (w.direction > Math.PI * 2) w.direction -= Math.PI * 2;
                if (w.direction < 0) w.direction += Math.PI * 2;
            }
            */
        }

    
    }
}
