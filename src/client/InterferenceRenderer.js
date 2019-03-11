import Renderer from 'lance/render/Renderer';
import TwoVector from 'lance/serialize/TwoVector';
import Performer from '../common/Performer';
import Egg from '../common/Egg';

let ctx = null;
let canvas = null;
let w = 0;
let h = 0;
let game = null;
let c = 0;
let count = 0;

export default class InterferenceRenderer extends Renderer {

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);
        game = gameEngine;
        canvas = document.createElement('canvas');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        document.body.insertBefore(canvas, document.getElementById('logo'));
        w = game.w = canvas.width;
        h = game.h = canvas.height;
        ctx = canvas.getContext('2d');
        ctx.lineWidth = 5
    }

    draw(t, dt) {
        super.draw(t, dt);

        if (count > 200) {
            Tone.Transport.seconds = t*0.001;
            count = 0;
        }
        count++;

        
        // Clear the canvas
        ctx.clearRect(0, 0, w, h);

        // Transform the canvas
        // Note that we need to flip the y axis since Canvas pixel coordinates
        // goes from top to bottom, while physics does the opposite.
        ctx.save();
        //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, 400, 400);
        // Draw all things
        game.world.forEachObject((id, obj) => {
            if (obj instanceof Performer) this.drawPerformers(obj, t, dt);
            //else if (obj instanceof Food) this.drawFood(obj);
        });
        ctx.fillStyle = 'black';
        ctx.font = "20px Georgia";
        ctx.fillText(t, 50, 50);
        ctx.fillText(Tone.Transport.position, 50, 75);

        ctx.restore();

    }

    rainbowColors() {
        c += 0.005;
        let zeroTo240 = Math.floor((Math.cos(c) + 1) * 120);
        return `rgb(${zeroTo240},100,200)`;
    }

    drawPerformers(p, t, dt) {
        // draw head and body
        let thisIsPerformer = p.playerId === this.gameEngine.playerId;
        let i = p.number - 1;
        let n = this.gameEngine.world.playerCount;
        let x = (i / n) * w;
        let y = (i / n) * h;
        ctx.fillRect(x, 0,  w / n, h / n)
        if (thisIsPerformer) {
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x, 0, w / n, h / n)
        }
        /*
        this.drawCircle(x, y, game.headRadius, true);
        for (let i = 0; i < p.bodyParts.length; i++) {
            let nextPos = p.bodyParts[i];
            if (isThisPerformer) ctx.fillStyle = this.rainbowColors();
            this.drawCircle(nextPos.x, nextPos.y, game.bodyRadius, true);
        }

        // draw eyes
        let angle = +w.direction;
        if (w.direction === game.directionStop) {
            angle = - Math.PI / 2;
        }
        let eye1 = new TwoVector(Math.cos(angle + game.eyeAngle), Math.sin(angle + game.eyeAngle));
        let eye2 = new TwoVector(Math.cos(angle - game.eyeAngle), Math.sin(angle - game.eyeAngle));
        eye1.multiplyScalar(game.eyeDist).add(w.position);
        eye2.multiplyScalar(game.eyeDist).add(w.position);
        ctx.fillStyle = 'black';
        this.drawCircle(eye1.x, eye1.y, game.eyeRadius, true);
        this.drawCircle(eye2.x, eye2.y, game.eyeRadius, true);
        ctx.fillStyle = 'white';

        // update status
        if (isPerformer) {
            document.getElementById('wiggle-length').innerHTML = 'Wiggle Length: ' + Math.floor(t) + ' ' + Math.floor(dt);
        } */
    }

    drawFood(f) {
        ctx.strokeStyle = ctx.fillStyle = 'Orange';
        this.drawCircle(f.position.x, f.position.y, game.foodRadius, true);
        ctx.strokeStyle = ctx.fillStyle = 'White';
    }

    drawCircle(x, y, radius, fill) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2*Math.PI);
        fill?ctx.fill():ctx.stroke();
        ctx.closePath();
    }

    drawBounds() {
        ctx.beginPath();
        ctx.moveTo(-game.spaceWidth/2, -game.spaceHeight/2);
        ctx.lineTo(-game.spaceWidth/2, game.spaceHeight/2);
        ctx.lineTo( game.spaceWidth/2, game.spaceHeight/2);
        ctx.lineTo( game.spaceWidth/2, -game.spaceHeight/2);
        ctx.lineTo(-game.spaceWidth/2, -game.spaceHeight/2);
        ctx.closePath();
        ctx.stroke();
    }

}
