"use strict";

import { Renderer } from 'lance-gg';
// import Note from '../common/Note';
import invert from 'invert-color';

export default class InterferenceRenderer extends Renderer {

    constructor(gameEngine, clientEngine) {
        super(gameEngine, clientEngine);

        this.game = null;
        this.client = this.clientEngine;

        this.canvas = []
        this.ctx = [];
        this.canvas[0] = document.createElement('canvas');
        this.ctx[0] = this.canvas[0].getContext('2d');

        this.canvas[1] = document.createElement('canvas');
        this.ctx[1] = this.canvas[1].getContext('2d');

        this.leftViewBound = 0; // bounds of area to be rendered in game coordinates
        this.rightViewBound = 0;
        this.time = 0;
        this.players = []; 
        this.thisPlayer = null;
        this.sequences = null;
        this.eggs = [];
        this.paletteTable = [];
        this.bg = 'black';
        this.c1 = 'black';
        this.c2 = 'black';
        this.c3 = 'black';
        this.c4 = 'black';

        this.animLengths = {
            eggSpawn: 20,
            eggBreak: 30,
            eggNote: 10
        }

        this.mainCanvas = document.getElementById('mainCanvas');
        this.mainCtx = this.mainCanvas.getContext('2d');

        
        this.mainCanvas.width = window.innerWidth;
        this.mainCanvas.height = window.innerHeight;
        // could scaling this down improve performance?
        this.w = this.canvas[0].width = this.canvas[1].width = this.mainCanvas.width;
        this.h = this.canvas[0].height = this.canvas[1].height = this.mainCanvas.height;

        window.addEventListener('resize', ()=>{ this.setRendererSize(); });
    }

    draw(t, dt) {
        super.draw(t, dt);

        if (this.client.room == null) return;

        if (this.game == null) {
            this.game = this.gameEngine.paramsByRoom[this.client.room];

            this.paletteTable = this.game.paletteAttributes;
            this.bg = this.paletteTable[0].colors.bg;
            this.c1 = this.paletteTable[0].colors.c1;
            this.c2 = this.paletteTable[0].colors.c2;
            this.c3 = this.paletteTable[0].colors.c3;
            this.c4 = this.paletteTable[0].colors.c4;
        }

        this.time = this.client.syncClient.getSyncTime();
        this.thisPlayer = this.client.player;
        if (this.thisPlayer == null) return;
        this.players = this.client.players;
    
        if (this.client.performanceView) {
            // console.log(`${thisPlayer.xPos}`);
            this.leftViewBound = this.thisPlayer.xPos;
            // console.log(`${leftViewBound}`);
            this.rightViewBound = (this.leftViewBound + Number(this.game.playerWidth)) % (this.players.length * Number(this.game.playerWidth));
            // console.log(`${(leftViewBound + game.playerWidth)}`);
            // console.log(`${(players.length * game.playerWidth)}`);
        }
        else {
            this.leftViewBound = 0;
            this.rightViewBound = this.players.length * this.game.playerWidth;
        }
        this.sequences = this.client.sequences;
        this.eggs = this.client.eggs;
        
        // Clear the canvas
        this.mainCtx.clearRect(0, 0, this.mainCanvas.width, this.mainCanvas.height);
        this.ctx[0].clearRect(0, 0, this.w, this.h);
        this.ctx[1].clearRect(0, 0, this.w, this.h);

        // Transform the canvas
        this.ctx[0].save();
        this.ctx[1].save();
        //ctx.scale(this.clientEngine.zoom, this.clientEngine.zoom);  // Zoom in and flip y axis
        // Draw all the things
        this.drawPlayers();
        if (this.client.limiter != null)
        {
            this.drawSequences();
            this.drawEggs();
        }

        if (!this.client.isSpectator && this.client.showControlText) {

            // this.fillColor(this.thisPlayer.palette, 'c2', 1);
            // this.strokeWeight(1, 1);
            // this.ctx[1].font = "bold 20px sans serif";
            //ctx[1].fillText(playerId, 50, 25);

            // this.time = Number(this.time).toFixed(3);
            // this.ctx[1].fillText(this.time, this.w * 0.05, this.h * 0.95);
            // this.ctx[1].fillText("Player " + this.thisPlayer.number, this.w * 0.05, this.h * 0.85);
            //ctx[1].fillText(client.transport.position, 50, 75);
        }

        this.mainCtx.drawImage(this.canvas[0], 0, 0);
        this.mainCtx.drawImage(this.canvas[1], 0, 0);

        this.ctx[0].restore(); 
        this.ctx[1].restore();
    }

    drawPlayers() {
        let n = this.players.length / this.client.numRows;
        if (this.client.performanceView) n = 1;
        for (let p of this.players) {
            if (this.players.length === 1) {
                this.drawPlayer(p, false);
                this.drawPlayer(p, true);
                this.drawPlayheads(p, false);
                this.drawPlayheads(p, true);
            }
            else {
                let inView = true;
                let wrap = false;
                if (this.leftViewBound < this.rightViewBound) inView = (this.leftViewBound - this.game.playerWidth < p.number * this.game.playerWidth) && 
                                                             (p.number * this.game.playerWidth < this.rightViewBound);
                else {
                    wrap = (p.number * this.game.playerWidth < this.rightViewBound);
                    inView = (this.leftViewBound - this.game.playerWidth < p.number * this.game.playerWidth) || wrap;
                }
                if (inView) {
                    this.drawPlayer(p, wrap)
                    this.drawPlayheads(p, wrap);
                }
            }
        }

        if (!this.client.isSpectator && !this.client.ringView && !this.client.performanceView && this.thisPlayer.palette != 0) {
            let pos = this.gamePositionToCanvasPosition(this.thisPlayer.xPos, 0)
            let x = (this.w / n) * 0.5 + pos[0];
            this.ctx[0].fillStyle = 'white';
            this.drawTriangle(  x,                      ((0.95 * this.h) / n) + pos[1], 
                                x - ((0.15 * this.w) / n),   (this.h / n) + pos[1],
                                x + ((0.15 * this.w) / n),   (this.h / n) + pos[1], true, false, 0);   
        }
    }

    drawPlayer(p, wrap) {
        let n = this.players.length / this.client.numRows;
        if (this.client.performanceView) n = 1;
        if (this.client.ringView && !this.client.performanceView) {
            let rDim = (this.h * 0.5) / this.game.playerHeight;
            if (n > 2 && n < 7) rDim *= 0.5;
            else if (n >= 7) rDim *= 3 / n;
            else rDim *= 0.975;
            let aDim = (2*PI / n) / this.game.playerWidth;
            for (let aIdx = 0; aIdx < this.game.playerWidth; aIdx++) {
                let a = aIdx * aDim + (2*PI / n) * p.number;
                for (let rIdx = 0; rIdx < this.game.playerHeight; rIdx++) {
                    let r = rIdx * rDim;
                    if (n > 2 && n < 7) r += this.h * 0.25 - this.h * 0.025;
                    else if (n >= 7) r += this.h * 0.5 * ((n - 3) / n) - this.h * 0.025;
                    this.strokeColor(p.grid[aIdx + (rIdx * this.game.playerWidth)], 'bg', 0);
                    this.drawRingSegment(r, r+rDim, a, a+aDim, 0);
                }
            }
        }
        else {  
            let xPos = p.number*this.game.playerWidth;
            if (wrap) xPos += this.game.playerWidth*this.players.length;
            let pos = this.gamePositionToCanvasPosition(xPos, 0)
            // console.log(pos);
            let xDim = this.gameXDimToCanvasXDim(1);
            let yDim = this.gameYDimToCanvasYDim(1);
            for (let xIdx = 0; xIdx < this.game.playerWidth; xIdx++) {
                let x = (xIdx * xDim) + pos[0];
                for (let yIdx = 0; yIdx < this.game.playerHeight; yIdx++) {
                    let y = (yIdx * yDim) + pos[1];
                    this.fillColor(p.grid[xIdx + (yIdx * this.game.playerWidth)], 'bg', 0);
                    this.drawRect(x, y, xDim, yDim, true, false, 0);
                }
            }
            this.fillColor(0, 'bg', 1);
            this.drawRect(pos[0], pos[1]-4, xDim*this.game.playerWidth, 8, true, false, 1);
            this.drawRect(pos[0], pos[1]-4+(yDim*this.game.playerHeight), xDim*this.game.playerWidth, 8, true, false, 1);
            if (this.client.player.stage != 'outro' && this.client.limiter != null) {
                // this.fillColor(0, 'bg', 1);
                for (let a = 0; a < p.ammo; a++) {
                    let x1 = pos[0] + ((a + 1) * ((this.w / n) / (p.ammo + 1)));
                    let y1 = (this.h / n) * 0.92 + pos[1];
                    this.drawTriangle(  x1, y1, 
                                        x1 - ((0.02 * this.w) / n), y1 + ((0.04 * this.h) / n),
                                        x1 + ((0.02 * this.w) / n), y1 + ((0.04 * this.h) / n), true, false, 1);
                }  
            }   
        } 
    }

    drawSequences() {
        this.strokeWeight(2, 0);
        this.strokeWeight(2, 1);
        // draw notes
        for (let number of Object.keys(this.sequences)) {
            if (this.sequences[number].bass != null) for (let step of this.sequences[number].bass) if (step != null) this.drawStep(step);
            if (this.sequences[number].melody != null) for (let step of this.sequences[number].melody) if (step != null) this.drawStep(step); 
            if (this.sequences[number].perc != null) for (let step of this.sequences[number].perc) if (step != null) this.drawStep(step);                     
        }
    }

    drawEggs() {
        // TODO: Ring
        this.strokeWeight(10, 1);
        for (let e of this.eggs) {
            let scale = this.mapToRange(e.animFrames.spawn, 0, this.animLengths.eggSpawn, 0.0, 1.0);
            this.strokeColor(0, 'c1', 1);
            let pos = this.gamePositionToCanvasPosition(e.position.x, e.position.y);
            let rpos = this.gamePositionToCanvasPosition(e.position.x + this.game.eggRadius, e.position.y);
            let x = pos[0];
            let y = pos[1];
            let dimX = this.gameXDimToCanvasXDim(this.game.eggRadius) * scale;
            let dimY = this.gameYDimToCanvasYDim(this.game.eggRadius) * scale;
            if (this.client.ringView && !this.client.performanceView) {
                let r = Math.sqrt((pos[0] - rpos[0])*(pos[0] - rpos[0]) + (pos[1] - rpos[1])*(pos[1] - rpos[1]));
                let gr = this.game.eggRadius * scale;
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
                if (e.position.x < this.game.playerWidth && this.client.performanceView) {
                    pos = this.gamePositionToCanvasPosition(e.position.x + (this.players.length * this.game.playerWidth), e.position.y);
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
            if (e.animFrames.spawn < this.animLengths.eggSpawn) e.animFrames.spawn++;
        }
    }

    drawPlayheads(p, wrap) {
        // TODO: Ring
        if (this.client.ringView && !this.client.performanceView) {
            let width = this.gameYDimToCanvasYDim(1);  
            let shift = p.number * this.game.playerWidth; 
            let m1 = this.gamePositionToCanvasPosition(shift + this.client.melodyStep + 0.5, 0);
            let p1 = this.gamePositionToCanvasPosition(shift + this.client.percStep + 0.5, 0);
            let b1 = this.gamePositionToCanvasPosition(shift + this.client.bassStep + 0.5, 0);
            let m2 = this.gamePositionToCanvasPosition(shift + this.client.melodyStep + 0.5, this.game.playerHeight);
            let p2 = this.gamePositionToCanvasPosition(shift + this.client.percStep + 0.5, this.game.playerHeight);
            let b2 = this.gamePositionToCanvasPosition(shift + this.client.bassStep + 0.5, this.game.playerHeight);
            // console.log(m1);
            this.strokeColor(0, 'c1', 1);
            this.drawLine(m1[0], m1[1], m2[0], m2[1], width*0.1, 'round', 1);
            this.strokeColor(0, 'c2', 1);
            this.drawLine(p1[0], p1[1], p2[0], p2[1], width*0.2, 'round', 1);
            this.strokeColor(0, 'c3', 1);
            this.drawLine(b1[0], b1[1], b2[0], b2[1], width*0.3, 'round', 1);       
        }
        else {
            let dimX = this.gameXDimToCanvasXDim(1);   
            let dimY = this.gameYDimToCanvasYDim(this.game.playerHeight);
            let shift = p.number * this.game.playerWidth;
            if (wrap) shift += this.players.length * this.game.playerWidth;
            let melodyPos = this.gamePositionToCanvasPosition(shift + this.client.melodyStep + 0.45, 0);
            let percPos = this.gamePositionToCanvasPosition(shift + this.client.percStep + 0.4, 0);
            let bassPos = this.gamePositionToCanvasPosition(shift + this.client.bassStep + 0.35, 0);
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
            if (this.players.length === 1) {
                this.drawNote(n, false);
                this.drawNote(n, true);
            }
            else {
                let inView = true;
                let wrap = false;
                if (this.leftViewBound < this.rightViewBound) inView = (this.leftViewBound - this.game.playerWidth < n.xPos) && (n.xPos < this.rightViewBound);
                else {
                    inView = (this.leftViewBound - this.game.playerWidth < n.xPos) || (n.xPos < this.rightViewBound);
                    wrap = (n.xPos < this.rightViewBound);
                }
                if (inView) this.drawNote(n, wrap);
            }
            if (n.animFrame < this.animLengths.eggNote) n.animFrame++;
        }
    }

    drawNote(n, wrap) {
        // TODO: Ring
        let playerWidth = Number(this.game.playerWidth);
        let playerHeight = Number(this.game.playerHeight);

        if (this.client.ringView && !this.client.performanceView) {
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
                    r *= 1.5;
                    layer = 0; 
                }
                if (n.step === this.client.melodyStep) {
                    this.client.paintNote(n);
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
                if (n.step === this.client.bassStep) {
                    this.client.paintNote(n);
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
                if (n.step === this.client.percStep) {
                    this.client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawQuad(pos1[0], pos1[1], pos2[0], pos2[1], pos3[0], pos3[1], pos4[0], pos4[1], true, true, layer);
            }   

        }
        else {
            let shift = 0;
            if (wrap) shift = (playerWidth * this.players.length);
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
                dimX *= 0.8;
                dimY *= 0.8 * this.mapToRange(n.animFrame, 0, this.animLengths.eggNote, playerHeight, 1);
                c = 'c1';
                if (n.dur === '4n') { 
                    c = 'c2'; 
                    dimX *= 1.5;
                    dimY *= 1.5;
                    layer = 0; 
                }
                if (n.step === this.client.melodyStep) {
                    this.client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawEllipse(x, y, dimX / 2, dimY / 2, 0, 0, 2*Math.PI, true, true, layer);
            }
            else if (n.sound === 'bass') {
                y = this.mapToRange(n.animFrame, 0, this.animLengths.eggNote, 0, y);
                dimY *= this.mapToRange(n.animFrame, 0, this.animLengths.eggNote, playerHeight, 1);
                c = 'c2';
                let f = 0;
                if (n.dur === '4n') { 
                    c = 'c3'; 
                    f = 1;
                    layer = 0; 
                }
                if (n.step === this.client.bassStep) {
                    this.client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawRect(x + (0.1*dimX), y + (0.1*dimY), dimX*(0.8+f), dimY*0.8, true, true, layer);
            }
            else if (n.sound === 'perc') {
                x += dimX * 0.5;
                y += dimY * 0.5;
                dimY *= this.mapToRange(n.animFrame, 0, this.animLengths.eggNote, playerHeight / 2, 1);
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
                if (n.step === this.client.percStep) {
                    this.client.paintNote(n);
                    c = 'c4';
                }
                this.fillColor(n.palette, c, layer);
                this.strokeColor(n.palette, 'bg', layer);
                this.drawQuad(x1, y1, x2, y2, x3, y3, x4, y4, true, true, layer);
            }   
        }
        
    }

    setRendererSize() {
        this.w = this.canvas[0].width = this.canvas[1].width = this.mainCanvas.width = window.innerWidth;
        this.h = this.canvas[0].height = this.canvas[1].height = this.mainCanvas.height = window.innerHeight;
    }

    gamePositionToCanvasPosition(gameX, gameY) {
        let div = this.players.length / this.client.numRows;
        if (this.client.ringView && !this.client.performanceView) {
            let rDim = (this.h * 0.5) / this.game.playerHeight;
            if (div > 2 && div < 7) rDim *= 0.5;
            else if (div >= 7) rDim *= 3 / div;
            else rDim *= 0.975;
            let r = 0;
            if (div > 2 && div < 7) r += this.h * 0.25 - this.h * 0.025;
            else if (div >= 7) r += this.h * 0.5 * ((div - 3) / div) - this.h * 0.025;
            let x = gameX;
            let y = gameY;
            let canvasX = (y * rDim + r) * Math.cos(this.mapToRange(x, 0, this.game.playerWidth*div, 0, 2*Math.PI)) + this.w * 0.5;
            let canvasY = (y * rDim + r) * Math.sin(this.mapToRange(x, 0, this.game.playerWidth*div, 0, 2*Math.PI)) + this.h * 0.5;
            return [canvasX, canvasY];
        }
        else {
            if (this.client.performanceView) div = 1;
            let hi = this.rightViewBound;
            let playerCanvasHeight = this.h / div;
            if (this.leftViewBound >= this.rightViewBound) hi += this.players.length * this.game.playerWidth;
            let canvasX = this.mapToRange(gameX, this.leftViewBound, hi, 0, this.w);
            let canvasY = this.mapToRange(gameY, 0, this.game.playerHeight, 0, playerCanvasHeight); 
            if (!this.client.performanceView) {
                let yOffset = this.h * 0.5 - (playerCanvasHeight * this.client.numRows) * 0.5;
                let row = 0;
                canvasX *= this.client.numRows;
                while (canvasX >= this.w) {
                    canvasX -= this.w;
                    row += 1;
                }
                canvasY += (playerCanvasHeight * row) + yOffset;
            }
            return [Math.floor(canvasX), Math.floor(canvasY)];
        }
    }

    gameXDimToCanvasXDim(gameX) {
        let div = this.players.length / this.client.numRows;
        if (this.client.performanceView) div = 1;
        return this.mapToRange(gameX, 0, this.game.playerWidth, 0, this.w / div);
    }

    gameYDimToCanvasYDim(gameY) {
        let div = this.players.length / this.client.numRows;
        if (this.client.performanceView) div = 1;
        return this.mapToRange(gameY, 0, this.game.playerHeight, 0, this.h / div);
    }

    // cellToCanvasPosition(cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
    //     let gameX = (game.playerWidth / cellsXPerPlayer) * cellX;
    //     let gameY = (game.playerHeight / cellsYPerPlayer) * cellY;
    //     return this.gamePositionToCanvasPosition(gameX, gameY);
    // }

    playerCellToCanvasPosition(p, cellX, cellY, cellsXPerPlayer, cellsYPerPlayer) {
        let gameX = (this.game.playerWidth / cellsXPerPlayer) * (cellX + (p.number * cellsXPerPlayer));
        let gameY = (this.game.playerHeight / cellsYPerPlayer) * cellY;
        return this.gamePositionToCanvasPosition(gameX, gameY);
    }

    mapToRange(val, l1, h1, l2, h2) {
        return (l2 + (h2 - l2) * (val - l1) / (h1 - l1));
    }

    drawBrokenEgg(e, x, y, radiusX, radiusY, fill, stroke, layer) {
        let gapX = radiusX * (e.animFrames.break / this.animLengths.eggBreak);
        let gapY = radiusY * (e.animFrames.break / this.animLengths.eggBreak);
        this.drawEllipse(x+gapX, y-gapY, radiusX, radiusY, 0, 1.5*Math.PI, 2*Math.PI, fill, stroke, layer)
        this.drawEllipse(x-gapX, y-gapY, radiusX, radiusY, 0, Math.PI, 1.5*Math.PI, fill, stroke, layer)
        this.drawEllipse(x-gapX, y+gapY, radiusX, radiusY, 0, 0.5*Math.PI, Math.PI, fill, stroke, layer)
        this.drawEllipse(x+gapX, y+gapY, radiusX, radiusY, 0, 0, 0.5*Math.PI, fill, stroke, layer)
        if (e.animFrames.break < this.animLengths.eggBreak) e.animFrames.break++
    }
    
    strokeWeight(weight, layer) {
        this.ctx[layer].lineWidth = weight;
    }

    strokeColor(pal, which, layer) {    
        let color = this.paletteTable[0].colors[which];
        if (this.paletteTable[pal]) {
            if (this.paletteTable[pal].colors) {
                color = this.paletteTable[pal].colors[which];
            }  
        }
        if (this.client.player.stage == "fightEnd") this.ctx[layer].strokeStyle = invert(color);
        else this.ctx[layer].strokeStyle = color;
    }

    fillColor(pal, which, layer) {
        let color = this.paletteTable[0].colors[which];
        if (this.paletteTable[pal]) {
            if (this.paletteTable[pal].colors) {
                color = this.paletteTable[pal].colors[which];
            }  
        }
        if (this.client.player.stage == "fightEnd") this.ctx[layer].fillStyle = invert(color);
        else this.ctx[layer].fillStyle = color;
    }

    drawEllipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle, fill, stroke, layer) {
        this.ctx[layer].beginPath();
        this.ctx[layer].ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle);
        if (fill) this.ctx[layer].fill();
        if (stroke) this.ctx[layer].stroke();
    }

    drawTriangle(x1, y1, x2, y2, x3, y3, fill, stroke, layer) {
        this.ctx[layer].beginPath();
        this.ctx[layer].moveTo(x1, y1);
        this.ctx[layer].lineTo(x2, y2);
        this.ctx[layer].lineTo(x3, y3);
        if (fill) this.ctx[layer].fill();
        this.ctx[layer].closePath();
        if (stroke) this.ctx[layer].stroke();
    }

    drawRect(x, y, dimX, dimY, fill, stroke, layer) {
        if (fill) this.ctx[layer].fillRect(x, y, dimX, dimY);
        if (stroke) this.ctx[layer].strokeRect(x, y, dimX, dimY);
    }

    drawQuad(x1, y1, x2, y2, x3, y3, x4, y4, fill, stroke, layer) {
        this.ctx[layer].beginPath();
        this.ctx[layer].moveTo(x1, y1);
        this.ctx[layer].lineTo(x2, y2);
        this.ctx[layer].lineTo(x3, y3);
        this.ctx[layer].lineTo(x4, y4);
        if (fill) this.ctx[layer].fill();
        this.ctx[layer].closePath();
        if (stroke) this.ctx[layer].stroke();
    }

    drawRingSegment(r1, r2, a1, a2, layer) {
        this.ctx[layer].lineWidth = r2 - r1;
        this.ctx[layer].lineCap = 'butt';
        this.ctx[layer].beginPath();
        this.ctx[layer].arc(this.w * 0.5, this.h * 0.5, (r1 + r2) * 0.5, a1, a2);
        this.ctx[layer].stroke();
    }

    drawLine(x1, y1, x2, y2, width, cap, layer) {
        this.ctx[layer].lineWidth = width;
        this.ctx[layer].lineCap = cap;
        this.ctx[layer].beginPath();
        this.ctx[layer].moveTo(x1, y1);
        this.ctx[layer].lineTo(x2, y2);
        this.ctx[layer].stroke();
    }
}


