function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import InterpolateStrategy from './syncStrategies/InterpolateStrategy';
import ExtrapolateStrategy from './syncStrategies/ExtrapolateStrategy';
import FrameSyncStrategy from './syncStrategies/FrameSyncStrategy';

var strategies = {
    extrapolate: ExtrapolateStrategy,
    interpolate: InterpolateStrategy,
    frameSync: FrameSyncStrategy
};

var Synchronizer =
// create a synchronizer instance
function Synchronizer(clientEngine, options) {
    _classCallCheck(this, Synchronizer);

    this.clientEngine = clientEngine;
    this.options = options || {};
    if (!strategies.hasOwnProperty(this.options.sync)) {
        throw new Error('ERROR: unknown synchronzation strategy ' + this.options.sync);
    }
    this.syncStrategy = new strategies[this.options.sync](this.clientEngine, this.options);
};

export default Synchronizer;