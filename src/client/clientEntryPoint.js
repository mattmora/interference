"use strict";

import querystring from 'query-string';
import { Lib } from 'lance-gg';
import InterferenceClientEngine from '../client/InterferenceClientEngine';
import InterferenceGameEngine from '../common/InterferenceGameEngine';
const qsOptions = querystring.parse(location.search);

if(process.env.NODE_ENV === 'development'){
    if(!window.console) window.console = {};
    var methods = ["log", "debug", "warn", "info"];
    for(var i=0;i<methods.length;i++){
        console[methods[i]] = function(){};
    }
}
console.log(process.env.NODE_ENV);

// default options, overwritten by query-string options
// is sent to both game engine and client engine
const defaults = {
    traceLevel: Lib.Trace.TRACE_NONE,
    delayInputCount: 3,
    scheduler: 'render-schedule',
    syncOptions: {
        sync: qsOptions.sync || 'extrapolate',
        localObjBending: 1.0,
        remoteObjBending: 1.0,
        bendingIncrements: 1
    }
};
let options = Object.assign(defaults, qsOptions);

// create a client engine and a game engine
const gameEngine = new InterferenceGameEngine(options);
const clientEngine = new InterferenceClientEngine(gameEngine, options);

document.addEventListener('DOMContentLoaded', function(e) { clientEngine.start(); });