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

const animLengths = {
    eggSpawn: 20,
    eggBreak: 30,
    eggNote: 10
}

let transportSyncCount = 0;
let game = null;
let client = null;
let canvas = []
let ctx = [];
let w = 0;
let h = 0;
let leftViewBound = 0; // bounds of area to be rendered in game coordinates
let rightViewBound = 0;
let time = 0;
let players = []; 
let playerId = 0;
let thisPlayer = null;
let graphicNotes = [];
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
        this.ctx = this.canvas.getContext('2d');

        canvas[0] = document.createElement('canvas');
        ctx[0] = canvas[0].getContext('2d');
        ctx[0].lineWidth = 1;

        canvas[1] = document.createElement('canvas');
        ctx[1] = canvas[1].getContext('2d');
        ctx[1].lineWidth = 1;

        w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
        h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;

        document.body.insertBefore(this.canvas, document.getElementById('logo'));

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

        graphicNotes = client.graphicNotes;
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
                //console.log(client.transport.state);
            }
            transportSyncCount++
        }
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, w, h);
        ctx[0].clearRect(0, 0, w, h);
        ctx[1].clearRect(0, 0, w, h);

        // Transform the canvas
        // Note that we need to flip the y axis since Canvas pixel coordinates
        // goes from top to bottom, while physics does the opposite.
        ctx[0].save();
        ctx[1].save();
        //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
        // Draw all things
        this.drawPlayers();
        this.drawNoteGraphics();
        this.drawEggs();

        /*()
        ctx[1].fillStyle = c1;
        ctx[1].font = "20px Lucida Console";
        ctx[1].fillText(playerId, 50, 25);
        ctx[1].fillText(time, 50, 50);
        ctx[1].fillText(client.transport.position, 50, 75);
        */
        this.ctx.drawImage(canvas[0], 0, 0);
        this.ctx.drawImage(canvas[1], 0, 0);

        ctx[0].restore(); 
        ctx[1].restore();
    }

    drawPlayers() {
        let n = players.length;
        for (let p of players) {
            let i = p.number - (leftViewBound / game.playerWidth);
            let x = ((w / n) * i);
            this.fillColor(p, 'bg', 0);
            ctx[0].fillRect(x, 0, w / n, h / n)
        }
        let i = thisPlayer.number;
        let x = (w / n) * (i + 0.5);
        ctx[0].fillStyle = 'white';
        this.fillTriangle(  x,                      (1.05 * h) / n, 
                            x - ((0.25 * w) / n),   (1.15 * h) / n,
                            x + ((0.25 * w) / n),   (1.15 * h) / n, 0 );   
    }

    drawNoteGraphics() {
        for (let g of graphicNotes) {
            if (g.type === 'egg') {
                let pos = this.playerCellToCanvasPosition(thisPlayer, g.cell.x, g.cell.y);
                let x = pos[0];
                let y = this.mapToRange(g.animFrame, 0, animLengths.eggNote, 0, pos[1]);
                let heightFactor = this.mapToRange(g.animFrame, 0, animLengths.eggNote, game.playerCellHeight, 1);
                let dimX = this.gameXDimToCanvasXDim(game.cellWidth); 
                let dimY = this.gameYDimToCanvasYDim(game.cellHeight*heightFactor);
                let c = 'c1';
                let layer = 1;
                if (g.duration === '2n') {
                    c = 'c3';
                    dimX *= game.playerCellWidth / 2;
                    layer = 0;
                }
                if (g.step === client.currentStep) c = 'c2'
                this.fillColor(thisPlayer, c, layer);
                ctx[layer].fillRect(x, y, dimX, dimY);
                if (g.animFrame < animLengths.eggNote) g.animFrame++;
            }
        }
    }

    drawEggs() {
        let leftBound = leftViewBound - game.eggRadius;
        let rightBound = rightViewBound + game.eggRadius;
        for (let e of eggs) {
            if (leftBound < e.position.x && e.position.x < rightBound) {
                let scale = this.mapToRange(e.animFrames.spawn, 0, animLengths.eggSpawn, 0.0, 1.0);
                ctx[1].fillStyle = 'white';
                ctx[1].strokeStyle = 'black';
                let pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y)
                if (e.hp > 0) {
                    this.ellipse(pos[0], pos[1], 
                        this.gameXDimToCanvasXDim(game.eggRadius) * scale, 
                        this.gameYDimToCanvasYDim(game.eggRadius) * scale,
                        0, 0, 2*Math.PI, 1);
                }
                else this.drawBrokenEgg(e, pos[0], pos[1], 
                    this.gameXDimToCanvasXDim(game.eggRadius), this.gameYDimToCanvasYDim(game.eggRadius), 1);
            }
        if (e.animFrames.spawn < animLengths.eggSpawn) e.animFrames.spawn++;
        }
    }

    setRendererSize() {
        w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
        h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;
    }

    gamePositionToCanvasPosition(gameX, gameY) {
        let canvasX = Math.floor(this.mapToRange(gameX, leftViewBound, rightViewBound, 0, w));
        let canvasY = Math.floor(this.mapToRange(gameY, 0, game.playerHeight, 0, h / players.length)); 
        return [canvasX, canvasY];
    }

    gameXDimToCanvasXDim(gameX) {
        return Math.floor(this.mapToRange(gameX, 0, game.playerWidth, 0, w / players.length));
    }

    gameYDimToCanvasYDim(gameY) {
        return Math.floor(this.mapToRange(gameY, 0, game.playerHeight, 0, h / players.length));
    }

    playerCellToCanvasPosition(p, cellX, cellY) {
        let gameX = game.cellWidth * (cellX + (p.number * game.playerCellWidth));
        let gameY = game.cellHeight * cellY;
        return this.gamePositionToCanvasPosition(gameX, gameY);
    }

    mapToRange(val, l1, h1, l2, h2) {
        return (l2 + (h2 - l2) * (val - l1) / (h1 - l1));
    }

    drawBrokenEgg(e, x, y, radiusX, radiusY, layer) {
        let gapX = radiusX * (e.animFrames.break / animLengths.eggBreak);
        let gapY = radiusY * (e.animFrames.break / animLengths.eggBreak);
        this.ellipse(x+gapX, y-gapY, radiusX, radiusY, 0, 0, 0.5*Math.PI, layer)
        this.ellipse(x-gapX, y-gapY, radiusX, radiusY, 0, 0.5*Math.PI, Math.PI, layer)
        this.ellipse(x-gapX, y+gapY, radiusX, radiusY, 0, Math.PI, 1.5*Math.PI, layer)
        this.ellipse(x+gapX, y+gapY, radiusX, radiusY, 0, 1.5*Math.PI, 2*Math.PI, layer)
        if (e.animFrames.break < animLengths.eggBreak) e.animFrames.break++
    }

    fillColor(p, which, layer) {
        if (paletteTable[p.palette]) {
            ctx[layer].fillStyle = paletteTable[p.palette][which];
        }  
        else ctx[layer].fillStyle = paletteTable['default'][which];
    }

    ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, layer) {
        ctx[layer].beginPath();
        ctx[layer].ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
        ctx[layer].fill();
        ctx[layer].stroke();
    }

    fillTriangle(x1, y1, x2, y2, x3, y3, layer) {
        ctx[layer].beginPath();
        ctx[layer].moveTo(x1, y1);
        ctx[layer].lineTo(x2, y2);
        ctx[layer].lineTo(x3, y3);
        ctx[layer].fill();
        ctx[layer].closePath();
    }

}
