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
    'celeste': {   
        bg: '#a5d8ff', 
        c1: '#ff8266',
        c2: '#4381af',
        c3: '#ac86b0',
        c4: '#4b719c' 
    },
    'pyre': {   
        bg: '#a32323', 
        c1: '#2375a8',
        c2: '#fbf6f7',
        c3: '#f0ae62',
        c4: '#011936' 
    },
    'journey': {   
        bg: '#fad68a', 
        c1: '#7f2819',
        c2: '#a25a11',
        c3: '#d5a962',
        c4: '#fef8e8' 
    },
    'kirby': {   
        bg: '#a8c256', 
        c1: '#f4a4a7',
        c2: '#e84c41',
        c3: '#f9df6a',
        c4: '#fa8334' 
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
let leftViewBound = 0; // bounds of area to be rendered in game coordinates
let rightViewBound = 0;
let time = 0;
let players = []; 
let playerId = 0;
let thisPlayer = null;
let eggs = [];

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
        ctx.lineWidth = 5;

        window.addEventListener('resize', ()=>{ this.setRendererSize(); });
    }

    draw(t, dt) {
        super.draw(t, dt);

        if (client.room === null) return

        time = client.syncClient.getSyncTime();
        playerId = game.playerId;
        thisPlayer = game.world.queryObject({ playerId });
        if (client.performanceView) {
            players = [thisPlayer];
            leftViewBound = thisPlayer.number * game.playerWidth;
            rightViewBound = (thisPlayer.number + 1) * game.playerWidth;
        }
        else {
            players = game.world.queryObjects({ instanceType: Performer });
            leftViewBound = 0;
            rightViewBound = players.length * game.playerWidth;
        }
        eggs = game.world.queryObjects({ instanceType: Egg });

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
        this.updateClientSequencer();
        this.drawPlayers();
        this.drawEggs();

        /*
        if (this.gameEngine.playerId < 5) {
            Tone.Transport.seconds = t/1000;
            ctx.fillStyle = 'red';
        } */
        ctx.fillStyle = c1;
        ctx.font = "20px Lucida Console";
        ctx.fillText(playerId, 50, 25);
        ctx.fillText(time, 50, 50);
        ctx.fillText(client.transport.position, 50, 75);

        ctx.restore(); 
    }

    drawPlayers() {
        let n = players.length;
        for (let p of players) {
            let i = p.number - (leftViewBound / game.playerWidth);
            let x = ((w / n) * i);
            ctx.fillStyle = paletteTable[p.palette].bg;
            ctx.fillRect(x, 0, w / n, h / n)
        }
        let i = thisPlayer.number;
        let x = (w / n) * (i + 0.5);
        ctx.fillStyle = 'white';
        this.triangle(  x,                      (1.05 * h) / n, 
                        x - ((0.25 * w) / n),   (1.15 * h) / n,
                        x + ((0.25 * w) / n),   (1.15 * h) / n );   
    }

    drawEggs() {
        let leftBound = leftViewBound - game.eggRadius;
        let rightBound = rightViewBound + game.eggRadius;
        for (let e of eggs) {
            if (leftBound < e.position.x && e.position.x < rightBound) {
                ctx.fillStyle = 'white';
                ctx.strokeStyle = 'black';
                let pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y)
                this.circle(pos[0], pos[1], this.gameDistanceToCanvasDistance(game.eggRadius));
            }
        }
    }

    updateClientSequencer() {
        if (thisPlayer) {
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

    gamePositionToCanvasPosition(gameX, gameY) {
        let canvasX = this.mapToRange(gameX, leftViewBound, rightViewBound, 0, w);
        let canvasY = this.mapToRange(gameY, 0, game.playerHeight, 0, h / players.length) 
        return [canvasX, canvasY];
    }

    gameDistanceToCanvasDistance(gameDist) {
        let canvasDist = this.mapToRange(gameDist, 0, game.playerWidth, 0, w / players.length);
        return canvasDist;
    }

    mapToRange(val, l1, h1, l2, h2) {
        return Math.floor(l2 + (h2 - l2) * (val - l1) / (h1 - l1));
    }

    circle(x, y, radius) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2*Math.PI);
        ctx.fill();
        ctx.stroke();
        ctx.closePath();
    }

    triangle(x1, y1, x2, y2, x3, y3) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.lineTo(x3, y3);
        ctx.fill();
        ctx.closePath();
    }

}
