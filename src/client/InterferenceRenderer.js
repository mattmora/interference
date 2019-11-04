import { Renderer, TwoVector } from 'lance-gg';
import Note from '../common/Note';
import Performer from '../common/Performer';
import Egg from '../common/Egg';

const paletteTable = [
    //'default': 
    {
        bg: 'black',
        c1: 'black',
        c2: 'black',
        c3: 'black',
        c4: 'black'
    },
    //'rain': 
    {   
        bg: '#3e2f5b', 
        c1: '#d7dedc',
        c2: '#706563',
        c3: '#457eac',
        c4: '#748386' 
    },
    //'celeste': 
    {   
        bg: '#a5d8ff', 
        c1: '#ff8266',
        c2: '#4381af',
        c3: '#ac86b0',
        c4: '#4b719c' 
    },
    //'pyre': 
    {   
        bg: '#a32323', 
        c1: '#2375a8',
        c2: '#fbf6f7',
        c3: '#f0ae62',
        c4: '#011936' 
    },
    //'journey': 
    {   
        bg: '#fad68a', 
        c1: '#7f2819',
        c2: '#a25a11',
        c3: '#d5a962',
        c4: '#fef8e8' 
    },
    //'kirby': 
    {   
        bg: '#a8c256', 
        c1: '#f4a4a7',
        c2: '#e84c41',
        c3: '#f9df6a',
        c4: '#fa8334' 
    }
]

const animLengths = {
    eggSpawn: 20,
    eggBreak: 30,
    eggNote: 10
}

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
let sequences = null;
let eggs = [];

let bg = paletteTable[0].bg;
let c1 = paletteTable[0].c1;
let c2 = paletteTable[0].c2;
let c3 = paletteTable[0].c3;
let c4 = paletteTable[0].c4;

export default class InterferenceRenderer extends Renderer {

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);

        game = this.gameEngine;
        client = this.clientEngine;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        canvas[0] = document.createElement('canvas');
        ctx[0] = canvas[0].getContext('2d');


        canvas[1] = document.createElement('canvas');
        ctx[1] = canvas[1].getContext('2d');

        w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
        h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;

        document.body.insertBefore(this.canvas, document.getElementById('logo'));

        window.addEventListener('resize', ()=>{ this.setRendererSize(); });
    }

    draw(t, dt) {
        super.draw(t, dt);

        if (client.room == null) return;

        time = client.syncClient.getSyncTime();
        playerId = game.playerId;
        thisPlayer = game.world.queryObject({ playerId });
        if (thisPlayer == null) return;
        players = game.world.queryObjects({ instanceType: Performer });
        if (client.performanceView) {
            leftViewBound = thisPlayer.xPos;
            rightViewBound = (leftViewBound + game.playerWidth) % (players.length * game.playerWidth);
        }
        else {
            leftViewBound = 0;
            rightViewBound = players.length * game.playerWidth;
        }
        sequences = client.sequences;
        eggs = game.world.queryObjects({ instanceType: Egg });

        bg = paletteTable[thisPlayer.palette].bg;
        c1 = paletteTable[thisPlayer.palette].c1;
        c2 = paletteTable[thisPlayer.palette].c2;
        c3 = paletteTable[thisPlayer.palette].c3;
        c4 = paletteTable[thisPlayer.palette].c4;
        
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
        this.drawSequences();
        this.drawEggs();

        if (!client.performanceView) {
            ctx[1].fillStyle = 'white';
            ctx[1].strokeStyle = 'black';
            this.strokeWeight(1, 1);
            ctx[1].font = "20px Lucida Console";
            //ctx[1].fillText(playerId, 50, 25);
            time = Number(time).toFixed(3);
            ctx[1].fillText(time, w * 0.05, h * 0.95);
            ctx[1].strokeText(time, w * 0.05, h * 0.95);
            ctx[1].fillText(thisPlayer.number, w * 0.05, h * 0.85);
            ctx[1].strokeText(thisPlayer.number, w * 0.05, h * 0.85);
            //ctx[1].fillText(client.transport.position, 50, 75);
        }

        this.ctx.drawImage(canvas[0], 0, 0);
        this.ctx.drawImage(canvas[1], 0, 0);

        ctx[0].restore(); 
        ctx[1].restore();
    }

    drawPlayers() {
        let n = players.length;
        if (client.performanceView) n = 1;
        for (let p of players) {
            if (players.length === 1) {
                this.drawPlayer(p, false);
                this.drawPlayer(p, true);
                this.drawPlayheads(p, false);
                this.drawPlayheads(p, true);
            }
            else {
                let inView = true;
                let wrap = false;
                if (leftViewBound < rightViewBound) inView = (leftViewBound - game.playerWidth < p.number * game.playerWidth) && 
                                                             (p.number * game.playerWidth < rightViewBound);
                else {
                    inView = (leftViewBound - game.playerWidth < p.number * game.playerWidth) || (p.number * game.playerWidth < rightViewBound);
                    wrap = (p.number * game.playerWidth < rightViewBound);
                }
                if (inView) {
                    this.drawPlayer(p, wrap)
                    this.drawPlayheads(p, wrap);
                }
            }
        }
        let x = (w / n) * (thisPlayer.number + 0.5);
        ctx[0].fillStyle = 'white';
        this.fillTriangle(  x,                      (1.05 * h) / n, 
                            x - ((0.25 * w) / n),   (1.15 * h) / n,
                            x + ((0.25 * w) / n),   (1.15 * h) / n, false, 0 );   
    }

    drawPlayer(p, wrap) {
        let n = players.length;
        if (client.performanceView) n = 1;
        let i = p.number - (leftViewBound / game.playerWidth);
        if (wrap) i += players.length;
        let pal = game.paletteAttributes[p.palette];
        let xDim = this.gameXDimToCanvasXDim(game.playerWidth / pal.gridWidth);
        let yDim = this.gameYDimToCanvasYDim(game.playerHeight / pal.gridHeight);
        for (let xIdx = 0; xIdx < pal.gridWidth; xIdx++) {
            let x = ((w / n) * i) + (xIdx * xDim);
            for (let yIdx = 0; yIdx < pal.gridHeight; yIdx++) {
                let y = yIdx * yDim;
                this.fillColor(p.grid[xIdx + (yIdx * pal.gridWidth)], 'bg', 0);
                this.fillRect(x, y, xDim, yDim, false, 0)
            }
        }
        this.fillColor(0, 'bg', 1);
        for (let a = 0; a < p.ammo; a++) {
            let x = ((w / n) * i);
            let x1 = x + ((a + 1) * ((w / n) / (p.ammo + 1)));
            let y1 = (h / n) * 0.92;
            this.fillTriangle(  x1, y1, 
                                x1 - ((0.02 * w) / n), y1 + ((0.04 * h) / n),
                                x1 + ((0.02 * w) / n), y1 + ((0.04 * h) / n), false, 1);
        }
    }

    drawSequences() {
        this.strokeWeight(2, 0);
        this.strokeWeight(2, 1);
        // draw notes
        for (let number of Object.keys(sequences)) {
            if (sequences[number].bass != null) for (let step of sequences[number].bass) if (step != null) this.drawStep(step);
            if (sequences[number].melody != null) for (let step of sequences[number].melody) if (step != null) this.drawStep(step); 
            if (sequences[number].perc != null) for (let step of sequences[number].perc) if (step != null) this.drawStep(step);                     
        }
    }

    drawEggs() {
        for (let e of eggs) {
            let scale = this.mapToRange(e.animFrames.spawn, 0, animLengths.eggSpawn, 0.0, 1.0);
            this.fillColor(0, 'c1', 1);
            //this.strokeColor(0, 'bg', 1);
            let dimX = this.gameXDimToCanvasXDim(game.eggRadius) * scale;
            let dimY = this.gameYDimToCanvasYDim(game.eggRadius) * scale;
            let pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y);
            let x = pos[0];
            let y = pos[1];
            //this.strokeWeight((dimX + dimY) * 0.0625, 1);
            if (e.hp > 0) {
                if (e.sound === 'melody') {
                    this.fillEllipse(x, y, dimX, dimY, 0, 0, 2*Math.PI, false, 1);
                }
                else if (e.sound === 'bass') {
                    this.fillRect(x - dimX, y - dimY, dimX * 2, dimY * 2, false, 1);
                }
                else if (e.sound === 'perc') {
                    this.fillQuad(  x - dimX, y, x, y - dimY, 
                                    x + dimX, y, x, y + dimY, false, 1);
                }
            }
            else this.drawBrokenEgg(e, x, y, dimX, dimY, false, 1);
            if (e.position.x < game.playerWidth) {
                pos = this.gamePositionToCanvasPosition(e.position.x + (players.length * game.playerWidth), e.position.y);
                x = pos[0];
                y = pos[1];
                //this.strokeWeight((dimX + dimY) * 0.0625, 1);
                if (e.hp > 0) {
                    if (e.sound === 'melody') {
                        this.fillEllipse(x, y, dimX, dimY, 0, 0, 2*Math.PI, false, 1);
                    }
                    else if (e.sound === 'bass') {
                        this.fillRect(x - dimX, y - dimY, dimX * 2, dimY * 2, false, 1);
                    }
                    else if (e.sound === 'perc') {
                        this.fillQuad(  x - dimX, y, x, y - dimY, 
                                        x + dimX, y, x, y + dimY, false, 1);
                    }
                }
                else this.drawBrokenEgg(e, x, y, dimX, dimY, false, 1);
            }
            if (e.animFrames.spawn < animLengths.eggSpawn) e.animFrames.spawn++;
        }
    }

    drawPlayheads(p, wrap) {
        let dimX = this.gameXDimToCanvasXDim(1);   
        let dimY = this.gameYDimToCanvasYDim(game.playerHeight);
        let shift = p.number * game.playerWidth;
        if (wrap) shift += players.length * game.playerWidth;
        let melodyPos = this.cellToCanvasPosition(shift + client.melodyStep + 0.45, 0, 32, 18);
        let percPos = this.cellToCanvasPosition(shift + client.percStep + 0.4, 0, 32, 18);
        let bassPos = this.cellToCanvasPosition(shift + client.bassStep + 0.35, 0, 32, 18);
        this.fillColor(0, 'c1', 1);
        this.fillRect(melodyPos[0], melodyPos[1], dimX * 0.1, dimY, false, 1);
        this.fillColor(0, 'c2', 1);
        this.fillRect(percPos[0], percPos[1], dimX * 0.2, dimY, false, 1);
        this.fillColor(0, 'c3', 1);
        this.fillRect(bassPos[0], bassPos[1], dimX * 0.3, dimY, false, 1);
    }

    drawStep(step) {
        for (let n of step) {
            if (players.length === 1) {
                this.drawNote(n, false);
                this.drawNote(n, true);
            }
            else {
                let inView = true;
                let wrap = false;
                if (leftViewBound < rightViewBound) inView = (leftViewBound - game.playerWidth < n.xPos) && (n.xPos < rightViewBound);
                else {
                    inView = (leftViewBound - game.playerWidth < n.xPos) || (n.xPos < rightViewBound);
                    wrap = (n.xPos < rightViewBound);
                }
                if (inView) this.drawNote(n, wrap);
            }
            if (n.animFrame < animLengths.eggNote) n.animFrame++;
        }
    }

    drawNote(n, wrap) {
        let gridWidth = game.paletteAttributes[n.palette].gridWidth;
        let gridHeight = game.paletteAttributes[n.palette].gridHeight;
        let shift = 0;
        if (wrap) shift = (gridWidth * players.length);
        let pos = this.cellToCanvasPosition(n.xPos + shift, n.yPos, gridWidth, gridHeight);
        let dimX = this.gameXDimToCanvasXDim(game.playerWidth / gridWidth); 
        let dimY = this.gameYDimToCanvasYDim(game.playerHeight / gridHeight);
        let x = pos[0];
        let y = pos[1];
        let c = 'bg';
        let layer = 1;
        if (n.sound === 'melody') {
            x += dimX * 0.5;
            y += dimY * 0.5;
            //dimX *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridWidth, 1);
            dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight, 1);
            c = 'c1';
            if (n.dur === '2n') { 
                c = 'c2'; 
                dimX *= 2;
                dimY *= 2;
                layer = 0; 
            }
            if (n.step === client.melodyStep) {
                client.paintNote(n);
                c = 'c4';
            }
            this.fillColor(n.palette, c, layer);
            this.strokeColor(n.palette, 'bg', layer);
            this.fillEllipse(x, y, dimX / 2, dimY / 2, 0, 0, 2*Math.PI, true, layer);
        }
        else if (n.sound === 'bass') {
            y = this.mapToRange(n.animFrame, 0, animLengths.eggNote, 0, y);
            dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight, 1);
            c = 'c2';
            if (n.dur === '2n') { 
                c = 'c3'; 
                dimX *= (gridWidth / 4); 
                layer = 0; 
            }
            if (n.step === client.bassStep) {
                client.paintNote(n);
                c = 'c4';
            }
            this.fillColor(n.palette, c, layer);
            this.strokeColor(n.palette, 'bg', layer);
            this.fillRect(x, y, dimX, dimY, true, layer);
        }
        else if (n.sound === 'perc') {
            x += dimX * 0.5;
            y += dimY * 0.5;
            dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, gridHeight / 2, 1);
            let x1 = x - (dimX * 0.5);
            let y1 = y;
            let x2 = x;
            let y2 = y - (dimY * 0.5);
            let x3 = x + (dimX * 0.5);
            let y3 = y;
            let x4 = x;
            let y4 = y + (dimY * 0.5);
            c = 'c3'
            if (n.dur === '2n') { 
                c = 'c1'; 
                x2 += dimX;
                x4 -= dimX
                layer = 0;             
            }
            if (n.step === client.percStep) {
                client.paintNote(n);
                c = 'c4';
            }
            this.fillColor(n.palette, c, layer);
            this.strokeColor(n.palette, 'bg', layer);
            this.fillQuad(x1, y1, x2, y2, x3, y3, x4, y4, true, layer);
        }   
    }

    setRendererSize() {
        w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
        h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;
    }

    gamePositionToCanvasPosition(gameX, gameY) {
        let div = players.length;
        if (client.performanceView) div = 1;
        let hi = rightViewBound;
        if (leftViewBound >= rightViewBound) hi += players.length * game.playerWidth;
        let canvasX = Math.floor(this.mapToRange(gameX, leftViewBound, hi, 0, w));
        let canvasY = Math.floor(this.mapToRange(gameY, 0, game.playerHeight, 0, h / div)); 
        return [canvasX, canvasY];
    }

    gameXDimToCanvasXDim(gameX) {
        let div = players.length;
        if (client.performanceView) div = 1;
        return this.mapToRange(gameX, 0, game.playerWidth, 0, w / div);
    }

    gameYDimToCanvasYDim(gameY) {
        let div = players.length;
        if (client.performanceView) div = 1;
        return this.mapToRange(gameY, 0, game.playerHeight, 0, h / div);
    }

    cellToCanvasPosition(cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
        let gameX = (game.playerWidth / cellsXPerPlayer) * cellX;
        let gameY = (game.playerHeight / cellsYPerPlayer) * cellY;
        return this.gamePositionToCanvasPosition(gameX, gameY);
    }

    playerCellToCanvasPosition(p, cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
        let gameX = (game.playerWidth / cellsXPerPlayer) * (cellX + (p.number * cellsXPerPlayer));
        let gameY = (game.playerHeight / cellsYPerPlayer) * cellY;
        return this.gamePositionToCanvasPosition(gameX, gameY);
    }

    mapToRange(val, l1, h1, l2, h2) {
        return (l2 + (h2 - l2) * (val - l1) / (h1 - l1));
    }

    drawBrokenEgg(e, x, y, radiusX, radiusY, stroke, layer) {
        let gapX = radiusX * (e.animFrames.break / animLengths.eggBreak);
        let gapY = radiusY * (e.animFrames.break / animLengths.eggBreak);
        this.fillEllipse(x+gapX, y-gapY, radiusX, radiusY, 0, 0, 0.5*Math.PI, stroke, layer)
        this.fillEllipse(x-gapX, y-gapY, radiusX, radiusY, 0, 0.5*Math.PI, Math.PI, stroke, layer)
        this.fillEllipse(x-gapX, y+gapY, radiusX, radiusY, 0, Math.PI, 1.5*Math.PI, stroke, layer)
        this.fillEllipse(x+gapX, y+gapY, radiusX, radiusY, 0, 1.5*Math.PI, 2*Math.PI, stroke, layer)
        if (e.animFrames.break < animLengths.eggBreak) e.animFrames.break++
    }
    
    strokeWeight(weight, layer) {
        ctx[layer].lineWidth = weight;
    }

    strokeColor(pal, which, layer) {
        if (paletteTable[pal]) {
            ctx[layer].strokeStyle = paletteTable[pal][which];
        }  
        else ctx[layer].strokeStyle = paletteTable[0][which];
    }

    fillColor(pal, which, layer) {
        if (paletteTable[pal]) {
            ctx[layer].fillStyle = paletteTable[pal][which];
        }  
        else ctx[layer].fillStyle = paletteTable[0][which];
    }

    fillEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, stroke, layer) {
        ctx[layer].beginPath();
        ctx[layer].ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
        ctx[layer].fill();
        if (stroke) ctx[layer].stroke();
    }

    fillTriangle(x1, y1, x2, y2, x3, y3, stroke, layer) {
        ctx[layer].beginPath();
        ctx[layer].moveTo(x1, y1);
        ctx[layer].lineTo(x2, y2);
        ctx[layer].lineTo(x3, y3);
        ctx[layer].fill();
        ctx[layer].closePath();
        if (stroke) ctx[layer].stroke();
    }

    fillRect(x, y, dimX, dimY, stroke, layer) {
        ctx[layer].fillRect(x, y, dimX, dimY);
        if (stroke) ctx[layer].strokeRect(x, y, dimX, dimY);
    }

    fillQuad(x1, y1, x2, y2, x3, y3, x4, y4, stroke, layer) {
        ctx[layer].beginPath();
        ctx[layer].moveTo(x1, y1);
        ctx[layer].lineTo(x2, y2);
        ctx[layer].lineTo(x3, y3);
        ctx[layer].lineTo(x4, y4);
        ctx[layer].fill();
        ctx[layer].closePath();
        if (stroke) ctx[layer].stroke();
    }
}
