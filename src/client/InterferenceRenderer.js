import Renderer from 'lance/render/Renderer';
import TwoVector from 'lance/serialize/TwoVector';
import Performer from '../common/Performer';
import Egg from '../common/Egg';

let transportSyncCount = 0;
let game = null;
let client = null;
let ctx = null;
let w = 0;
let h = 0;

export default class InterferenceRenderer extends Renderer {

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);

        game = this.gameEngine;
        client = this.clientEngine;

        this.canvas = document.createElement('canvas');
        w = this.canvas.width = window.innerWidth;
        h = this.canvas.height = window.innerHeight;
        document.body.insertBefore(this.canvas, document.getElementById('logo'));
        ctx = this.ctx = this.canvas.getContext('2d');
        this.ctx.lineWidth = 5;

        window.addEventListener('resize', ()=>{ this.setRendererSize(); });
    }

    draw(t, dt) {
        super.draw(t, dt);

        if (client.transport.state === 'started') {
            if (transportSyncCount >= game.transportSyncInterval) {
                client.transport.seconds = t*0.001;
                transportSyncCount = 0;
                console.log(client.transport.state);
            }
            transportSyncCount++
        }
        
        // Clear the canvas
        ctx.clearRect(0, 0, w, h);

        // Transform the canvas
        // Note that we need to flip the y axis since Canvas pixel coordinates
        // goes from top to bottom, while physics does the opposite.
        ctx.save();
        //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
        // Draw all things
        game.world.forEachObject((id, obj) => {
            if (obj instanceof Performer) this.drawPerformers(obj, t, dt);
            //else if (obj instanceof Food) this.drawFood(obj);
        });
        ctx.fillStyle = 'black';
        /*
        if (this.gameEngine.playerId < 5) {
            Tone.Transport.seconds = t/1000;
            ctx.fillStyle = 'red';
        } */
        ctx.font = "20px Georgia";
        ctx.fillText(game.playerId, 50, 25);
        ctx.fillText(t, 50, 50);
        ctx.fillText(client.transport.position, 50, 75);

        ctx.restore(); 
    }

    drawPerformers(p, t, dt) {
        // draw head and body
        let thisIsPerformer = p.playerId === game.playerId;
        let i = p.number - 1;
        let n = game.world.playerCount;
        console.log(n);
        let x = (i / n) * w;
        let y = (i / n) * h;
        ctx.fillStyle = 'black';
        ctx.fillText(p.state, x + 20, 100);
        ctx.fillStyle = 'white';
        ctx.fillRect(x, 0,  w / n, h / n)
        if (thisIsPerformer) {
            client.notestack = p.notestack;
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

    setRendererSize() {
        w = this.canvas.width = window.innerWidth;
        h = this.canvas.height = window.innerHeight;
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
