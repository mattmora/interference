import querystring from 'query-string';
import { Lib } from 'lance-gg';
import InterferenceClientEngine from '../client/InterferenceClientEngine';
import InterferenceGameEngine from '../common/InterferenceGameEngine';
const qsOptions = querystring.parse(location.search);

// default options, overwritten by query-string options
// is sent to both game engine and client engine
const defaults = {
    traceLevel: Lib.Trace.TRACE_NONE,
    delayInputCount: 5,
    scheduler: 'fixed',
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