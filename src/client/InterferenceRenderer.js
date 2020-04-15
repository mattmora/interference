"use strict";

import { Renderer } from 'lance-gg';
// import Note from '../common/Note';
import Performer from '../common/Performer';
import Egg from '../common/Egg';
import invert from 'invert-color';

const animLengths = {
    eggSpawn: 20,
    eggBreak: 30,
    eggNote: 10
}
const PI = Math.PI;

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
let thisPlayer = null;
let sequences = null;
let eggs = [];
let paletteTable = [];
let bg = 'black';
let c1 = 'black';
let c2 = 'black';
let c3 = 'black';
let c4 = 'black';


export default class InterferenceRenderer extends Renderer {

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);

        client = this.clientEngine;

        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        canvas[0] = document.createElement('canvas');
        ctx[0] = canvas[0].getContext('2d');


        canvas[1] = document.createElement('canvas');
        ctx[1] = canvas[1].getContext('2d');

        // could scaling this down improve performance?
        w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
        h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;

        document.body.insertBefore(this.canvas, document.getElementById('logo'));

        window.addEventListener('resize', ()=>{ this.setRendererSize(); });
    }

    draw(t, dt) {
        super.draw(t, dt);

        if (client.room == null) return;

        if (game == null) {
            game = this.gameEngine.paramsByRoom[client.room];

            paletteTable = game.paletteAttributes;
            bg = paletteTable[0].colors.bg;
            c1 = paletteTable[0].colors.c1;
            c2 = paletteTable[0].colors.c2;
            c3 = paletteTable[0].colors.c3;
            c4 = paletteTable[0].colors.c4;
        }

        time = client.syncClient.getSyncTime();
        thisPlayer = client.player;
        if (thisPlayer == null) return;
        players = this.gameEngine.world.queryObjects({ instanceType: Performer });
    
        if (client.performanceView) {
            // console.log(`${thisPlayer.xPos}`);
            leftViewBound = thisPlayer.xPos;
            // console.log(`${leftViewBound}`);
            rightViewBound = (leftViewBound + Number(game.playerWidth)) % (players.length * Number(game.playerWidth));
            // console.log(`${(leftViewBound + game.playerWidth)}`);
            // console.log(`${(players.length * game.playerWidth)}`);
        }
        else {
            leftViewBound = 0;
            rightViewBound = players.length * game.playerWidth;
        }
        sequences = client.sequences;
        eggs = this.gameEngine.world.queryObjects({ instanceType: Egg });
        
        // Clear the canvas
        this.ctx.clearRect(0, 0, w, h);
        ctx[0].clearRect(0, 0, w, h);
        ctx[1].clearRect(0, 0, w, h);

        // Transform the canvas
        ctx[0].save();
        ctx[1].save();
        //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
        // Draw all the things
        this.drawPlayers();
        this.drawSequences();
        this.drawEggs();

        if (!client.isSpectator && client.showControlText) {

            this.fillColor(thisPlayer.palette, 'c2', 1);
            this.strokeWeight(1, 1);
            ctx[1].font = "bold 20px sans serif";
            //ctx[1].fillText(playerId, 50, 25);
            time = Number(time).toFixed(3);
            let rules = ["Very basic rules/objective: ",
            "Place notes in your sequence and using your notes, try to convert all players to your color palette.",
            "The game ends when all players have the same color palette."];
            let controls = [ "Basic controls:", 
            "v : Toggle view between the whole game and your space",
            "space (with a ball in your space) : Add a note to your sequence",
            "1 or 2 (after breaking a ball) : Start a build phase or a fight phase",
            "w/a/s/d : Move (cannot move horizontally during a build phase)",
            "h : Hide/unhide this text and the cursor"];

            ctx[1].fillText(rules[0], w * 0.05, h * 0.05);
            ctx[1].fillText(rules[1], w * 0.05, h * 0.15);
            ctx[1].fillText(rules[2], w * 0.05, h * 0.225);

            ctx[1].fillText(controls[0], w * 0.05, h * 0.35);
            ctx[1].fillText(controls[1], w * 0.05, h * 0.45);
            ctx[1].fillText(controls[2], w * 0.05, h * 0.525);
            ctx[1].fillText(controls[3], w * 0.05, h * 0.6);
            ctx[1].fillText(controls[4], w * 0.05, h * 0.675)
            ctx[1].fillText(controls[5], w * 0.05, h * 0.75)
            
            ctx[1].fillText(time, w * 0.05, h * 0.95);
            ctx[1].fillText("Player " + thisPlayer.number, w * 0.05, h * 0.85);
            //ctx[1].fillText(client.transport.position, 50, 75);
        }

        this.ctx.drawImage(canvas[0], 0, 0);
        this.ctx.drawImage(canvas[1], 0, 0);

        ctx[0].restore(); 
        ctx[1].restore();
    }

    drawPlayers() {
        let n = players.length / client.numRows;
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
                    wrap = (p.number * game.playerWidth < rightViewBound);
                    inView = (leftViewBound - game.playerWidth < p.number * game.playerWidth) || wrap;
                }
                if (inView) {
                    this.drawPlayer(p, wrap)
                    this.drawPlayheads(p, wrap);
                }
            }
        }

        if (!client.isSpectator && !client.ringView) {
            let pos = this.gamePositionToCanvasPosition(thisPlayer.xPos, 0)
            let x = (w / n) * 0.5 + pos[0];
            ctx[0].fillStyle = 'white';
            this.drawTriangle(  x,                      ((0.95 * h) / n) + pos[1], 
                                x - ((0.15 * w) / n),   (h / n) + pos[1],
                                x + ((0.15 * w) / n),   (h / n) + pos[1], true, false, 0);   
        }
    }

    drawPlayer(p, wrap) {
        let n = players.length / client.numRows;
        if (client.performanceView) n = 1;
        let i = p.number - (leftViewBound / game.playerWidth);
        if (wrap) i += players.length;
        let pal = game.paletteAttributes[p.palette];
        if (client.ringView && !client.performanceView) {
            let rDim = (h * 0.5) / game.playerHeight;
            if (n > 2 && n < 7) rDim *= 0.5;
            else if (n >= 7) rDim *= 3 / n;
            else rDim *= 0.975;
            let aDim = (2*PI / n) / game.playerWidth;
            for (let aIdx = 0; aIdx < game.playerWidth; aIdx++) {
                let a = aIdx * aDim + (2*PI / n) * p.number;
                for (let rIdx = 0; rIdx < game.playerHeight; rIdx++) {
                    let r = rIdx * rDim;
                    if (n > 2 && n < 7) r += h * 0.25 - h * 0.025;
                    else if (n >= 7) r += h * 0.5 * ((n - 3) / n) - h * 0.025;
                    this.strokeColor(p.grid[aIdx + (rIdx * game.playerWidth)], 'bg', 0);
                    this.drawRingSegment(r, r+rDim, a, a+aDim, 0);
                }
            }
        }
        else {  
            let pos = this.gamePositionToCanvasPosition(p.number*game.playerWidth, 0)
            // console.log(pos);
            let xDim = this.gameXDimToCanvasXDim(1);
            let yDim = this.gameYDimToCanvasYDim(1);
            for (let xIdx = 0; xIdx < game.playerWidth; xIdx++) {
                let x = (xIdx * xDim) + pos[0];
                for (let yIdx = 0; yIdx < game.playerHeight; yIdx++) {
                    let y = (yIdx * yDim) + pos[1];
                    this.fillColor(p.grid[xIdx + (yIdx * game.playerWidth)], 'bg', 0);
                    this.drawRect(x, y, xDim, yDim, true, false, 0);
                }
            }
            this.fillColor(0, 'bg', 1);
            this.drawRect(pos[0], pos[1]-4, xDim*game.playerWidth, 8, true, false, 1);
            this.drawRect(pos[0], pos[1]-4+(yDim*game.playerHeight), xDim*game.playerWidth, 8, true, false, 1);
            if (client.player.stage != "outro") {
                // this.fillColor(0, 'bg', 1);
                for (let a = 0; a < p.ammo; a++) {
                    let x1 = pos[0] + ((a + 1) * ((w / n) / (p.ammo + 1)));
                    let y1 = (h / n) * 0.92 + pos[1];
                    this.drawTriangle(  x1, y1, 
                                        x1 - ((0.02 * w) / n), y1 + ((0.04 * h) / n),
                                        x1 + ((0.02 * w) / n), y1 + ((0.04 * h) / n), true, false, 1);
                }  
            }   
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
        // TODO: Ring
        this.strokeWeight(10, 1);
        for (let e of eggs) {
            let scale = this.mapToRange(e.animFrames.spawn, 0, animLengths.eggSpawn, 0.0, 1.0);
            this.strokeColor(0, 'c1', 1);
            let pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y);
            let rpos = this.gamePositionToCanvasPosition(e.position.x + game.eggRadius, e.position.y);
            let x = pos[0];
            let y = pos[1];
            let dimX = this.gameXDimToCanvasXDim(game.eggRadius) * scale;
            let dimY = this.gameYDimToCanvasYDim(game.eggRadius) * scale;
            if (client.ringView && !client.performanceView) {
                let r = Math.sqrt((pos[0] - rpos[0])*(pos[0] - rpos[0]) + (pos[1] - rpos[1])*(pos[1] - rpos[1]));
                let gr = game.eggRadius * scale;
                if (e.hp > 0) {
                    if (e.sound === 'melody') {
                        this.drawEllipse(x, y, r, r, 0, 0, 2*Math.PI, false, true, 1);
                    }
                    else if (e.sound === 'bass') {
                        let pos1 = this.gamePositionToCanvasPosition(e.position.x - gr, e.position.y - gr);
                        let pos2 = this.gamePositionToCanvasPosition(e.position.x - gr, e.position.y + gr);
                        let pos3 = this.gamePositionToCanvasPosition(e.position.x + gr, e.position.y + gr);
                        let pos4 = this.gamePositionToCanvasPosition(e.position.x + gr, e.position.y - gr);
                        this.drawQuad(pos1[0], pos1[1], pos2[0], pos2[1], pos3[0], pos3[1], pos4[0], pos4[1], false, true, 1);
                    }
                    else if (e.sound === 'perc') {
                        let pos1 = this.gamePositionToCanvasPosition(e.position.x, e.position.y - gr);
                        let pos2 = this.gamePositionToCanvasPosition(e.position.x - gr, e.position.y);
                        let pos3 = this.gamePositionToCanvasPosition(e.position.x, e.position.y + gr);
                        let pos4 = this.gamePositionToCanvasPosition(e.position.x + gr, e.position.y);
                        this.drawQuad(pos1[0], pos1[1], pos2[0], pos2[1], pos3[0], pos3[1], pos4[0], pos4[1], false, true, 1);
                    }
                }
                else this.drawBrokenEgg(e, x, y, r, r, false, true, 1);
            }
            else {
                //this.strokeWeight((dimX + dimY) * 0.0625, 1);
                if (e.hp > 0) {
                    if (e.sound === 'melody') {
                        this.drawEllipse(x, y, dimX, dimY, 0, 0, 2*Math.PI, false, true, 1);
                    }
                    else if (e.sound === 'bass') {
                        this.drawRect(x - dimX, y - dimY, dimX * 2, dimY * 2, false, true, 1);
                    }
                    else if (e.sound === 'perc') {
                        this.drawQuad(  x - dimX, y, x, y - dimY, 
                                        x + dimX, y, x, y + dimY, false, true, 1);
                    }
                }
                else this.drawBrokenEgg(e, x, y, dimX, dimY, false, true, 1);
                if (e.position.x < game.playerWidth) {
                    pos = this.gamePositionToCanvasPosition(e.position.x + (players.length * game.playerWidth), e.position.y);
                    x = pos[0];
                    y = pos[1];
                    //this.strokeWeight((dimX + dimY) * 0.0625, 1);
                    if (e.hp > 0) {
                        if (e.sound === 'melody') {
                            this.drawEllipse(x, y, dimX, dimY, 0, 0, 2*Math.PI, false, true, 1);
                        }
                        else if (e.sound === 'bass') {
                            this.drawRect(x - dimX, y - dimY, dimX * 2, dimY * 2, false, true, 1);
                        }
                        else if (e.sound === 'perc') {
                            this.drawQuad(  x - dimX, y, x, y - dimY, 
                                            x + dimX, y, x, y + dimY, false, true, 1);
                        }
                    }
                    else this.drawBrokenEgg(e, x, y, dimX, dimY, false, true, 1);
                }
            }
            if (e.animFrames.spawn < animLengths.eggSpawn) e.animFrames.spawn++;
        }
    }

    drawPlayheads(p, wrap) {
        // TODO: Ring
        if (client.ringView && !client.performanceView) {
            let width = this.gameYDimToCanvasYDim(1);  
            let shift = p.number * game.playerWidth; 
            let m1 = this.gamePositionToCanvasPosition(shift + client.melodyStep + 0.5, 0);
            let p1 = this.gamePositionToCanvasPosition(shift + client.percStep + 0.5, 0);
            let b1 = this.gamePositionToCanvasPosition(shift + client.bassStep + 0.5, 0);
            let m2 = this.gamePositionToCanvasPosition(shift + client.melodyStep + 0.5, game.playerHeight);
            let p2 = this.gamePositionToCanvasPosition(shift + client.percStep + 0.5, game.playerHeight);
            let b2 = this.gamePositionToCanvasPosition(shift + client.bassStep + 0.5, game.playerHeight);
            console.log(m1);
            this.strokeColor(0, 'c1', 1);
            this.drawLine(m1[0], m1[1], m2[0], m2[1], width*0.1, 'round', 1);
            this.strokeColor(0, 'c2', 1);
            this.drawLine(p1[0], p1[1], p2[0], p2[1], width*0.2, 'round', 1);
            this.strokeColor(0, 'c3', 1);
            this.drawLine(b1[0], b1[1], b2[0], b2[1], width*0.3, 'round', 1);       
        }
        else {
            let dimX = this.gameXDimToCanvasXDim(1);   
            let dimY = this.gameYDimToCanvasYDim(game.playerHeight);
            let shift = p.number * game.playerWidth;
            if (wrap) shift += players.length * game.playerWidth;
            let melodyPos = this.gamePositionToCanvasPosition(shift + client.melodyStep + 0.45, 0);
            let percPos = this.gamePositionToCanvasPosition(shift + client.percStep + 0.4, 0);
            let bassPos = this.gamePositionToCanvasPosition(shift + client.bassStep + 0.35, 0);
            this.fillColor(0, 'c1', 1);
            this.drawRect(melodyPos[0], melodyPos[1], dimX * 0.1, dimY, true, false, 1);
            this.fillColor(0, 'c2', 1);
            this.drawRect(percPos[0], percPos[1], dimX * 0.2, dimY, true, false, 1);
            this.fillColor(0, 'c3', 1);
            this.drawRect(bassPos[0], bassPos[1], dimX * 0.3, dimY, true, false, 1);         
        }

    }

    drawStep(step) {
        // TODO: Ring
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
        // TODO: Ring
        let playerWidth = Number(game.playerWidth);
        let playerHeight = Number(game.playerHeight);

        if (client.ringView && !client.performanceView) {
            let c = 'bg';
            let layer = 1;
            if (n.sound === 'melody') {
                let cpos = this.gamePositionToCanvasPosition(n.xPos + 0.5, n.yPos + 0.5);
                let rpos = this.gamePositionToCanvasPosition(n.xPos + 0.5, n.yPos);
                let x = cpos[0];
                let y = cpos[1];
                let r = Math.sqrt((cpos[0] - rpos[0])*(cpos[0] - rpos[0]) + (cpos[1] - rpos[1])*(cpos[1] - rpos[1]))
                //dimX *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, playerWidth, 1);
                // rDim *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, playerHeight, 1);
                c = 'c1';
                if (n.dur === '4n') { 
                    c = 'c2'; 
                    r *= 2;
                    layer = 0; 
                }
                if (n.step === client.melodyStep) {
                    client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawEllipse(x, y, r, r, 0, 0, 2*Math.PI, true, true, layer);
            }
            else if (n.sound === 'bass') {
                let pos1 = [];
                let pos2 = [];
                let pos3 = [];
                let pos4 = [];
                c = 'c2';
                if (n.dur === '4n') { 
                    pos1 = this.gamePositionToCanvasPosition(n.xPos - 0.2, n.yPos - 0.2);
                    pos2 = this.gamePositionToCanvasPosition(n.xPos - 0.2, n.yPos + 1.2);
                    pos3 = this.gamePositionToCanvasPosition(n.xPos + 1.2, n.yPos + 1.2);
                    pos4 = this.gamePositionToCanvasPosition(n.xPos + 1.2, n.yPos - 0.2);
                    c = 'c3'; 
                    layer = 0; 
                }
                else {
                    pos1 = this.gamePositionToCanvasPosition(n.xPos + 0.2, n.yPos + 0.2);
                    pos2 = this.gamePositionToCanvasPosition(n.xPos + 0.2, n.yPos + 0.8);
                    pos3 = this.gamePositionToCanvasPosition(n.xPos + 0.8, n.yPos + 0.8);
                    pos4 = this.gamePositionToCanvasPosition(n.xPos + 0.8, n.yPos + 0.2);
                }
                if (n.step === client.bassStep) {
                    client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawQuad(pos1[0], pos1[1], pos2[0], pos2[1], pos3[0], pos3[1], pos4[0], pos4[1], true, true, layer);
            }
            else if (n.sound === 'perc') {
                let pos1 = [];
                let pos2 = [];
                let pos3 = [];
                let pos4 = [];
                c = 'c3'
                if (n.dur === '4n') { 
                    pos1 = this.gamePositionToCanvasPosition(n.xPos + 0.5, n.yPos - 0.3);
                    pos2 = this.gamePositionToCanvasPosition(n.xPos + 1.3, n.yPos + 0.5);
                    pos3 = this.gamePositionToCanvasPosition(n.xPos + 0.5, n.yPos + 1.3);
                    pos4 = this.gamePositionToCanvasPosition(n.xPos - 0.3, n.yPos + 0.5);
                    c = 'c1'; 
                    layer = 0;             
                }
                else {
                    pos1 = this.gamePositionToCanvasPosition(n.xPos + 0.5, n.yPos + 0.1);
                    pos2 = this.gamePositionToCanvasPosition(n.xPos + 0.9, n.yPos + 0.5);
                    pos3 = this.gamePositionToCanvasPosition(n.xPos + 0.5, n.yPos + 0.9);
                    pos4 = this.gamePositionToCanvasPosition(n.xPos + 0.1, n.yPos + 0.5);
                }
                if (n.step === client.percStep) {
                    client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawQuad(pos1[0], pos1[1], pos2[0], pos2[1], pos3[0], pos3[1], pos4[0], pos4[1], true, true, layer);
            }   

        }
        else {
            let shift = 0;
            if (wrap) shift = (playerWidth * players.length);
            let pos = this.gamePositionToCanvasPosition(n.xPos + shift, n.yPos);
            let dimX = this.gameXDimToCanvasXDim(1); 
            let dimY = this.gameYDimToCanvasYDim(1);
            let x = pos[0];
            let y = pos[1];
            let c = 'bg';
            let layer = 1;
            if (n.sound === 'melody') {
                x += dimX * 0.5;
                y += dimY * 0.5;
                //dimX *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, playerWidth, 1);
                dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, playerHeight, 1);
                c = 'c1';
                if (n.dur === '4n') { 
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
                this.drawEllipse(x, y, dimX / 2, dimY / 2, 0, 0, 2*Math.PI, true, true, layer);
            }
            else if (n.sound === 'bass') {
                y = this.mapToRange(n.animFrame, 0, animLengths.eggNote, 0, y);
                dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, playerHeight, 1);
                c = 'c2';
                if (n.dur === '4n') { 
                    c = 'c3'; 
                    dimX *= (playerWidth / 4); 
                    layer = 0; 
                }
                if (n.step === client.bassStep) {
                    client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawRect(x + (0.1*dimX), y + (0.1*dimY), dimX*0.8, dimY*0.8, true, true, layer);
            }
            else if (n.sound === 'perc') {
                x += dimX * 0.5;
                y += dimY * 0.5;
                dimY *= this.mapToRange(n.animFrame, 0, animLengths.eggNote, playerHeight / 2, 1);
                let x1 = x - (dimX * 0.5);
                let y1 = y;
                let x2 = x;
                let y2 = y - (dimY * 0.5);
                let x3 = x + (dimX * 0.5);
                let y3 = y;
                let x4 = x;
                let y4 = y + (dimY * 0.5);
                c = 'c3'
                if (n.dur === '4n') { 
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
                this.drawQuad(x1, y1, x2, y2, x3, y3, x4, y4, true, true, layer);
            }   
        }
        
    }

    setRendererSize() {
        w = canvas[0].width = canvas[1].width = this.canvas.width = window.innerWidth;
        h = canvas[0].height = canvas[1].height = this.canvas.height = window.innerHeight;
    }

    gamePositionToCanvasPosition(gameX, gameY) {
        let div = players.length / client.numRows;
        if (client.ringView && !client.performanceView) {
            let rDim = (h * 0.5) / game.playerHeight;
            if (div > 2 && div < 7) rDim *= 0.5;
            else if (div >= 7) rDim *= 3 / div;
            else rDim *= 0.975;
            let r = 0;
            if (div > 2 && div < 7) r += h * 0.25 - h * 0.025;
            else if (div >= 7) r += h * 0.5 * ((div - 3) / div) - h * 0.025;
            let x = gameX;
            let y = gameY;
            let canvasX = (y * rDim + r) * Math.cos(this.mapToRange(x, 0, game.playerWidth*div, 0, 2*PI)) + w * 0.5;
            let canvasY = (y * rDim + r) * Math.sin(this.mapToRange(x, 0, game.playerWidth*div, 0, 2*PI)) + h * 0.5;
            return [canvasX, canvasY];
        }
        else {
            if (client.performanceView) div = 1;
            let hi = rightViewBound;
            let playerCanvasHeight = h / div;
            if (leftViewBound >= rightViewBound) hi += players.length * game.playerWidth;
            let canvasX = this.mapToRange(gameX, leftViewBound, hi, 0, w);
            let canvasY = this.mapToRange(gameY, 0, game.playerHeight, 0, playerCanvasHeight); 
            if (!client.performanceView) {
                let yOffset = h * 0.5 - (playerCanvasHeight * client.numRows) * 0.5;
                let row = 0;
                canvasX *= client.numRows;
                while (canvasX >= w) {
                    canvasX -= w;
                    row += 1;
                }
                canvasY += (playerCanvasHeight * row) + yOffset;
            }
            return [Math.floor(canvasX), Math.floor(canvasY)];
        }
    }

    gameXDimToCanvasXDim(gameX) {
        let div = players.length / client.numRows;
        if (client.performanceView) div = 1;
        return this.mapToRange(gameX, 0, game.playerWidth, 0, w / div);
    }

    gameYDimToCanvasYDim(gameY) {
        let div = players.length / client.numRows;
        if (client.performanceView) div = 1;
        return this.mapToRange(gameY, 0, game.playerHeight, 0, h / div);
    }

    // cellToCanvasPosition(cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
    //     let gameX = (game.playerWidth / cellsXPerPlayer) * cellX;
    //     let gameY = (game.playerHeight / cellsYPerPlayer) * cellY;
    //     return this.gamePositionToCanvasPosition(gameX, gameY);
    // }

    playerCellToCanvasPosition(p, cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
        let gameX = (game.playerWidth / cellsXPerPlayer) * (cellX + (p.number * cellsXPerPlayer));
        let gameY = (game.playerHeight / cellsYPerPlayer) * cellY;
        return this.gamePositionToCanvasPosition(gameX, gameY);
    }

    mapToRange(val, l1, h1, l2, h2) {
        return (l2 + (h2 - l2) * (val - l1) / (h1 - l1));
    }

    drawBrokenEgg(e, x, y, radiusX, radiusY, fill, stroke, layer) {
        let gapX = radiusX * (e.animFrames.break / animLengths.eggBreak);
        let gapY = radiusY * (e.animFrames.break / animLengths.eggBreak);
        this.drawEllipse(x+gapX, y-gapY, radiusX, radiusY, 0, 1.5*Math.PI, 2*Math.PI, fill, stroke, layer)
        this.drawEllipse(x-gapX, y-gapY, radiusX, radiusY, 0, Math.PI, 1.5*Math.PI, fill, stroke, layer)
        this.drawEllipse(x-gapX, y+gapY, radiusX, radiusY, 0, 0.5*Math.PI, Math.PI, fill, stroke, layer)
        this.drawEllipse(x+gapX, y+gapY, radiusX, radiusY, 0, 0, 0.5*Math.PI, fill, stroke, layer)
        if (e.animFrames.break < animLengths.eggBreak) e.animFrames.break++
    }
    
    strokeWeight(weight, layer) {
        ctx[layer].lineWidth = weight;
    }

    strokeColor(pal, which, layer) {    
        let color = paletteTable[0].colors[which];
        if (paletteTable[pal]) {
            if (paletteTable[pal].colors) {
                color = paletteTable[pal].colors[which];
            }  
        }
        if (client.player.stage == "fightEnd") ctx[layer].strokeStyle = invert(color);
        else ctx[layer].strokeStyle = color
    }

    fillColor(pal, which, layer) {
        let color = paletteTable[0].colors[which];
        if (paletteTable[pal]) {
            if (paletteTable[pal].colors) {
                color = paletteTable[pal].colors[which];
            }  
        }
        if (client.player.stage == "fightEnd") ctx[layer].fillStyle = invert(color);
        else ctx[layer].fillStyle = color
    }

    drawEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, fill, stroke, layer) {
        ctx[layer].beginPath();
        ctx[layer].ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
        if (fill) ctx[layer].fill();
        if (stroke) ctx[layer].stroke();
    }

    drawTriangle(x1, y1, x2, y2, x3, y3, fill, stroke, layer) {
        ctx[layer].beginPath();
        ctx[layer].moveTo(x1, y1);
        ctx[layer].lineTo(x2, y2);
        ctx[layer].lineTo(x3, y3);
        if (fill) ctx[layer].fill();
        ctx[layer].closePath();
        if (stroke) ctx[layer].stroke();
    }

    drawRect(x, y, dimX, dimY, fill, stroke, layer) {
        if (fill) ctx[layer].fillRect(x, y, dimX, dimY);
        if (stroke) ctx[layer].strokeRect(x, y, dimX, dimY);
    }

    drawQuad(x1, y1, x2, y2, x3, y3, x4, y4, fill, stroke, layer) {
        ctx[layer].beginPath();
        ctx[layer].moveTo(x1, y1);
        ctx[layer].lineTo(x2, y2);
        ctx[layer].lineTo(x3, y3);
        ctx[layer].lineTo(x4, y4);
        if (fill) ctx[layer].fill();
        ctx[layer].closePath();
        if (stroke) ctx[layer].stroke();
    }

    drawRingSegment(r1, r2, a1, a2, layer) {
        ctx[layer].lineWidth = r2 - r1;
        ctx[layer].lineCap = 'butt';
        ctx[layer].beginPath();
        ctx[layer].arc(w * 0.5, h * 0.5, (r1 + r2) * 0.5, a1, a2);
        ctx[layer].stroke();
    }

    drawLine(x1, y1, x2, y2, width, cap, layer) {
        ctx[layer].lineWidth = width;
        ctx[layer].lineCap = cap;
        ctx[layer].beginPath();
        ctx[layer].moveTo(x1, y1);
        ctx[layer].lineTo(x2, y2);
        ctx[layer].stroke();
    }
}


