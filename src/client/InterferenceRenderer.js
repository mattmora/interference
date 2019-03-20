import { Renderer, TwoVector } from 'lance-gg';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import { Frequency } from 'tone';

const paletteTable = {
    'rain': {   
        bg: '#3e2f5b', 
        c1: '#d7dedc',
        c2: '#706563',
        c3: '#457eac',
        c4: '#748386' 
    },
    'default': {
        bg: 'black',
        c1: 'white',
        c2: 'white',
        c3: 'white',
        c4: 'white'
    }
}

let transportSyncCount = 0;
let game = null;
let client = null;
let ctx = null;
let w = 0;
let h = 0;
let time = 0;
let players = []; 
let playerId = 0;
let thisPlayer = null;

let prevNotestack = '';
let prevRhythmstack = '';

let bg = paletteTable['default'].bg;
let c1 = paletteTable['default'].c1;
let c2 = paletteTable['default'].c2;
let c3 = paletteTable['default'].c3;
let c4 = paletteTable['default'].c4;

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

        if (client.room === null) return

        time = client.syncClient.getSyncTime();
        players = game.world.queryObjects({ instanceType: Performer });
        playerId = game.playerId;
        thisPlayer = game.world.queryObject({ playerId });

        bg = paletteTable[thisPlayer.palette].bg;
        c1 = paletteTable[thisPlayer.palette].c1;
        c2 = paletteTable[thisPlayer.palette].c2;
        c3 = paletteTable[thisPlayer.palette].c3;
        c4 = paletteTable[thisPlayer.palette].c4;

        if (client.transport.state === 'started') {
            if (transportSyncCount >= game.transportSyncInterval) {
                client.transport.seconds = time;
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
        this.drawField();
        /*
        if (this.gameEngine.playerId < 5) {
            Tone.Transport.seconds = t/1000;
            ctx.fillStyle = 'red';
        } */
        ctx.fillStyle = 'black';
        ctx.font = "20px Georgia";
        ctx.fillText(playerId, 50, 25);
        ctx.fillText(time, 50, 50);
        ctx.fillText(client.transport.position, 50, 75);

        ctx.restore(); 
    }

    drawField() {
        let n = players.length;
        for (let p of players) {
            let i = p.number;
            let x = (i / n) * w;
            let y = (i / n) * h;
            ctx.fillStyle = paletteTable[p.palette].bg;
            ctx.fillRect(x, 0, w / n, h / n)
        }
        if (thisPlayer) {
            let i = thisPlayer.number;
            let x = (i / n) * w;
            let y = (i / n) * h;
            ctx.strokeStyle = 'black';
            ctx.strokeRect(x, 0, w / n, h / n)   
            if (thisPlayer.notestack !== prevNotestack) {
                client.notestack = [];
                for (let c = 0; c < thisPlayer.notestack.length; c++) {
                    client.notestack.push(Frequency(thisPlayer.notestack.charCodeAt(c), 'midi').toNote());
                }
                prevNotestack = thisPlayer.notestack;
                console.log(client.notestack);
            }
            if (thisPlayer.rhythmstack !== prevRhythmstack) {
                client.rhythmstack = thisPlayer.rhythmstack.split(' ');
                prevRhythmstack = thisPlayer.rhythmstack;
                console.log(client.rhythmstack);
            }
        }
    }

    drawPerformers(p, t, dt) {
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
