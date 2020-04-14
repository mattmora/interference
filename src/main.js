"use strict";

import path from 'path';
import express from 'express';
import sslRedirect from 'heroku-ssl-redirect';
import socketIO from 'socket.io';
import { Lib } from 'lance-gg';
import InterferenceServerEngine from './server/InterferenceServerEngine';
import InterferenceGameEngine from './common/InterferenceGameEngine';

const PORT = process.env.PORT || 8080;
const INDEX = path.join(__dirname, '../dist/index.html');

// define routes and socket
const server = express();
// server.use(sslRedirect(['production', 'development']));
server.get('/', function(req, res) { res.sendFile(INDEX); });
server.use('/', express.static(path.join(__dirname, '../dist/')));
let requestHandler = server.listen(PORT, () => console.log(`Listening on ${ PORT }`));
const io = socketIO(requestHandler);

// Game Instances
const gameEngine = new InterferenceGameEngine({ traceLevel: Lib.Trace.TRACE_NONE });
const serverEngine = new InterferenceServerEngine(io, gameEngine, { traceLevel: Lib.Trace.TRACE_NONE, updateRate: 5, timeoutInterval: 1800 });

// start the game
serverEngine.start();
