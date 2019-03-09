import querystring from 'query-string';
import Trace from 'lance/lib/Trace';
import InterferenceClientEngine from '../client/InterferenceClientEngine';
import InterferenceGameEngine from '../common/InterferenceGameEngine';
const qsOptions = querystring.parse(location.search);

// default options, overwritten by query-string options
// is sent to both game engine and client engine
const defaults = {
    traceLevel: Trace.TRACE_NONE,
    delayInputCount: 5,
    scheduler: 'fixed',
    syncOptions: {
        sync: qsOptions.sync || 'extrapolate',
        localObjBending: 0.8,
        remoteObjBending: 0.8,
        bendingIncrements: 6
    }
};
let options = Object.assign(defaults, qsOptions);

// create a client engine and a game engine
const gameEngine = new InterferenceGameEngine(options);
const clientEngine = new InterferenceClientEngine(gameEngine, options);

document.addEventListener('DOMContentLoaded', function(e) { clientEngine.start(); });

console.log('init sound');
Tone.setTimeSource(() => { return clientEngine.syncClient.getSyncTime() });
var synth = new Tone.Synth({
    oscillator: {
        type: 'sine',
        modulationFrequency: 0.2
    },
    envelope: {
        attack: 0,
        decay: 0.1,
        sustain: 0,
        release: 0.1,
    }
}).toMaster();
var loop = new Tone.Loop(
    () => { synth.triggerAttackRelease(440, '8n') }, 
    '4n').start(0);
Tone.Transport.start(); 
