var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

import io from 'socket.io-client';
import Utils from './lib/Utils';
import Scheduler from './lib/Scheduler';
import Synchronizer from './Synchronizer';
import Serializer from './serialize/Serializer';
import NetworkMonitor from './network/NetworkMonitor';
import NetworkTransmitter from './network/NetworkTransmitter';

// MJW ADDITIONS
import SyncClient from '@ircam/sync/client';

// TODO: the GAME_UPS below should be common to the value implemented in the server engine,
// or better yet, it should be configurable in the GameEngine instead of ServerEngine+ClientEngine
var GAME_UPS = 60; // default number of game steps per second
var STEP_DELAY_MSEC = 12; // if forward drift detected, delay next execution by this amount
var STEP_HURRY_MSEC = 8; // if backward drift detected, hurry next execution by this amount

/**
 * The client engine is the singleton which manages the client-side
 * process, starting the game engine, listening to network messages,
 * starting client steps, and handling world updates which arrive from
 * the server.
 */

var ClientEngine = function () {

    /**
      * Create a client engine instance.
      *
      * @param {GameEngine} gameEngine - a game engine
      * @param {Object} inputOptions - options object
      * @param {Boolean} inputOptions.verbose - print logs to console
      * @param {Boolean} inputOptions.autoConnect - if true, the client will automatically attempt connect to server.
      * @param {Boolean} inputOptions.standaloneMode - if true, the client will never try to connect to a server
      * @param {Number} inputOptions.delayInputCount - if set, inputs will be delayed by this many steps before they are actually applied on the client.
      * @param {Number} inputOptions.healthCheckInterval - health check message interval (millisec). Default is 1000.
      * @param {Number} inputOptions.healthCheckRTTSample - health check RTT calculation sample size. Default is 10.
      * @param {Object} inputOptions.syncOptions - an object describing the synchronization method. If not set, will be set to extrapolate, with local object bending set to 0.0 and remote object bending set to 0.6. If the query-string parameter "sync" is defined, then that value is passed to this object's sync attribute.
      * @param {String} inputOptions.scheduler - When set to "render-schedule" the game step scheduling is controlled by the renderer and step time is variable.  When set to "fixed" the game step is run independently with a fixed step time. Default is "render-schedule".
      * @param {String} inputOptions.syncOptions.sync - chosen sync option, can be interpolate, extrapolate, or frameSync
      * @param {Number} inputOptions.syncOptions.localObjBending - amount (0 to 1.0) of bending towards original client position, after each sync, for local objects
      * @param {Number} inputOptions.syncOptions.remoteObjBending - amount (0 to 1.0) of bending towards original client position, after each sync, for remote objects
      * @param {String} inputOptions.serverURL - Socket server url
      * @param {Renderer} Renderer - the Renderer class constructor
      */
    function ClientEngine(gameEngine, inputOptions, Renderer) {
        _classCallCheck(this, ClientEngine);

        this.options = Object.assign({
            autoConnect: true,
            healthCheckInterval: 1000,
            healthCheckRTTSample: 10,
            stepPeriod: 1000 / GAME_UPS,
            scheduler: 'render-schedule',
            serverURL: null
        }, inputOptions);

        /**
         * reference to serializer
         * @member {Serializer}
         */
        this.serializer = new Serializer();

        /**
         * reference to game engine
         * @member {GameEngine}
         */
        this.gameEngine = gameEngine;
        this.gameEngine.registerClasses(this.serializer);
        this.networkTransmitter = new NetworkTransmitter(this.serializer);
        this.networkMonitor = new NetworkMonitor();

        this.inboundMessages = [];
        this.outboundMessages = [];

        // create the renderer
        this.renderer = this.gameEngine.renderer = new Renderer(gameEngine, this);

        // step scheduler
        this.scheduler = null;
        this.lastStepTime = 0;
        this.correction = 0;

        if (this.options.standaloneMode !== true) {
            this.configureSynchronization();
        }

        // create a buffer of delayed inputs (fifo)
        if (inputOptions && inputOptions.delayInputCount) {
            this.delayedInputs = [];
            for (var i = 0; i < inputOptions.delayInputCount; i++) {
                this.delayedInputs[i] = [];
            }
        }

        this.syncClient = new SyncClient(function () {
            return performance.now() / 1000;
        });

        this.gameEngine.emit('client__init');
    }

    // configure the Synchronizer singleton


    _createClass(ClientEngine, [{
        key: 'configureSynchronization',
        value: function configureSynchronization() {

            // the reflect syncronizer is just interpolate strategy,
            // configured to show server syncs
            var syncOptions = this.options.syncOptions;
            if (syncOptions.sync === 'reflect') {
                syncOptions.sync = 'interpolate';
                syncOptions.reflect = true;
            }

            this.synchronizer = new Synchronizer(this, syncOptions);
        }

        /**
         * Makes a connection to the game server.  Extend this method if you want to add additional
         * logic on every connection. Call the super-class connect first, and return a promise which
         * executes when the super-class promise completes.
         *
         * @param {Object} [options] additional socket.io options
         * @return {Promise} Resolved when the connection is made to the server
         */

    }, {
        key: 'connect',
        value: function connect() {
            var _this = this;

            var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};


            var connectSocket = function connectSocket(matchMakerAnswer) {
                return new Promise(function (resolve, reject) {

                    if (matchMakerAnswer.status !== 'ok') reject('matchMaker failed status: ' + matchMakerAnswer.status);

                    if (_this.options.verbose) console.log('connecting to game server ' + matchMakerAnswer.serverURL);
                    _this.socket = io(matchMakerAnswer.serverURL, options);

                    _this.networkMonitor.registerClient(_this);

                    _this.socket.once('connect', function () {
                        if (_this.options.verbose) console.log('connection made');
                        resolve();
                    });

                    _this.socket.once('error', function (error) {
                        reject(error);
                    });

                    _this.socket.on('playerJoined', function (playerData) {
                        _this.gameEngine.playerId = playerData.playerId;
                        _this.messageIndex = Number(_this.gameEngine.playerId) * 10000;
                    });

                    _this.socket.on('worldUpdate', function (worldData) {
                        _this.inboundMessages.push(worldData);
                    });

                    _this.socket.on('roomUpdate', function (roomData) {
                        _this.gameEngine.emit('client__roomUpdate', roomData);
                    });

                    _this.socket.on('sync');
                });
            };

            var matchmaker = Promise.resolve({ serverURL: this.options.serverURL, status: 'ok' });
            if (this.options.matchmaker) matchmaker = Utils.httpGetPromise(this.options.matchmaker);

            return matchmaker.then(connectSocket);
        }

        /**
         * Start the client engine, setting up the game loop, rendering loop and renderer.
         *
         * @return {Promise} Resolves once the Renderer has been initialized, and the game is
         * ready to connect
         */

    }, {
        key: 'start',
        value: function start() {
            var _this2 = this;

            this.stopped = false;
            this.resolved = false;

            // initialize the renderer
            // the render loop waits for next animation frame
            if (!this.renderer) alert('ERROR: game has not defined a renderer');
            var renderLoop = function renderLoop() {
                if (_this2.stopped) {
                    _this2.renderer.stop();
                    return;
                }
                var timestamp = _this2.syncClient.getSyncTime() * 1000;
                _this2.lastTimestamp = _this2.lastTimestamp || timestamp;
                _this2.renderer.draw(timestamp, timestamp - _this2.lastTimestamp);
                _this2.lastTimestamp = timestamp;
                window.requestAnimationFrame(renderLoop);
            };

            return this.renderer.init().then(function () {
                _this2.gameEngine.start();

                // MJW: added getTime argument to scheduler
                if (_this2.options.scheduler === 'fixed') {
                    // schedule and start the game loop
                    _this2.scheduler = new Scheduler({
                        period: _this2.options.stepPeriod,
                        tick: _this2.step.bind(_this2),
                        delay: STEP_DELAY_MSEC
                    }, function () {
                        _this2.syncClient.getSyncTime() * 1000;
                    });
                    _this2.scheduler.start();
                }

                if (typeof window !== 'undefined') window.requestAnimationFrame(renderLoop);
                if (_this2.options.autoConnect && _this2.options.standaloneMode !== true) {
                    return _this2.connect().catch(function (error) {
                        _this2.stopped = true;
                        throw error;
                    });
                }
            }).then(function () {
                return new Promise(function (resolve, reject) {
                    _this2.resolveGame = resolve;
                    if (_this2.socket) {
                        // MJW: incorporating sync
                        _this2.syncClient.start(
                        // send function
                        function (pingId, clientPingTime) {
                            var request = [];
                            request[0] = 0; // we send a ping
                            request[1] = pingId;
                            request[2] = clientPingTime;

                            //console.log('[ping] - id: %s, pingTime: %s', request[1], request[2]);

                            _this2.socket.emit('syncClientData', request);
                        },
                        // receive function  
                        function (callback) {
                            // unpack args before executing the callback
                            _this2.socket.on('syncServerData', function (data) {
                                var response = data;

                                if (response[0] === 1) {
                                    // this is a pong
                                    var pingId = response[1];
                                    var clientPingTime = response[2];
                                    var serverPingTime = response[3];
                                    var serverPongTime = response[4];

                                    //console.log('[pong] - id: %s, clientPingTime: %s, serverPingTime: %s, serverPongTime: %s',
                                    //pingId, clientPingTime, serverPingTime, serverPongTime);

                                    callback(pingId, clientPingTime, serverPingTime, serverPongTime);
                                }
                            });
                        },
                        // status report function
                        function (status) {} //console.log(status); }
                        );
                        // end MJW
                        _this2.socket.on('disconnect', function () {
                            if (!_this2.resolved && !_this2.stopped) {
                                if (_this2.options.verbose) console.log('disconnected by server...');
                                _this2.stopped = true;
                                reject();
                            }
                        });
                    }
                });
            });
        }

        /**
         * Disconnect from game server
         */

    }, {
        key: 'disconnect',
        value: function disconnect() {
            if (!this.stopped) {
                this.socket.disconnect();
                this.stopped = true;
            }
        }

        // check if client step is too far ahead (leading) or too far
        // behing (lagging) the server step

    }, {
        key: 'checkDrift',
        value: function checkDrift(checkType) {

            if (!this.gameEngine.highestServerStep) return;

            var thresholds = this.synchronizer.syncStrategy.STEP_DRIFT_THRESHOLDS;
            var maxLead = thresholds[checkType].MAX_LEAD;
            var maxLag = thresholds[checkType].MAX_LAG;
            var clientStep = this.gameEngine.world.stepCount;
            var serverStep = this.gameEngine.highestServerStep;
            if (clientStep > serverStep + maxLead) {
                this.gameEngine.trace.warn(function () {
                    return 'step drift ' + checkType + '. [' + clientStep + ' > ' + serverStep + ' + ' + maxLead + '] Client is ahead of server.  Delaying next step.';
                });
                if (this.scheduler) this.scheduler.delayTick();
                this.lastStepTime += STEP_DELAY_MSEC;
                this.correction += STEP_DELAY_MSEC;
            } else if (serverStep > clientStep + maxLag) {
                this.gameEngine.trace.warn(function () {
                    return 'step drift ' + checkType + '. [' + serverStep + ' > ' + clientStep + ' + ' + maxLag + '] Client is behind server.  Hurrying next step.';
                });
                if (this.scheduler) this.scheduler.hurryTick();
                this.lastStepTime -= STEP_HURRY_MSEC;
                this.correction -= STEP_HURRY_MSEC;
            }
        }

        // execute a single game step.  This is normally called by the Renderer
        // at each draw event.

    }, {
        key: 'step',
        value: function step(t, dt, physicsOnly) {

            if (!this.resolved) {
                var result = this.gameEngine.getPlayerGameOverResult();
                if (result) {
                    this.resolved = true;
                    this.resolveGame(result);
                    // simulation can continue...
                    // call disconnect to quit
                }
            }

            // physics only case
            if (physicsOnly) {
                this.gameEngine.step(false, t, dt, physicsOnly);
                return;
            }

            // first update the trace state
            this.gameEngine.trace.setStep(this.gameEngine.world.stepCount + 1);

            // skip one step if requested
            if (this.skipOneStep === true) {
                this.skipOneStep = false;
                return;
            }

            this.gameEngine.emit('client__preStep');
            while (this.inboundMessages.length > 0) {
                this.handleInboundMessage(this.inboundMessages.pop());
                this.checkDrift('onServerSync');
            }

            // check for server/client step drift without update
            this.checkDrift('onEveryStep');

            // perform game engine step
            if (this.options.standaloneMode !== true) {
                this.handleOutboundInput();
            }
            this.applyDelayedInputs();
            this.gameEngine.step(false, t, dt);
            this.gameEngine.emit('client__postStep', { dt: dt });

            if (this.options.standaloneMode !== true && this.gameEngine.trace.length && this.socket) {
                // socket might not have been initialized at this point
                this.socket.emit('trace', JSON.stringify(this.gameEngine.trace.rotate()));
            }
        }

        // apply a user input on the client side

    }, {
        key: 'doInputLocal',
        value: function doInputLocal(message) {

            // some synchronization strategies (interpolate) ignore inputs on client side
            if (this.gameEngine.ignoreInputs) {
                return;
            }

            var inputEvent = { input: message.data, playerId: this.gameEngine.playerId };
            this.gameEngine.emit('client__processInput', inputEvent);
            this.gameEngine.emit('processInput', inputEvent);
            this.gameEngine.processInput(message.data, this.gameEngine.playerId, false);
        }

        // apply user inputs which have been queued in order to create
        // an artificial delay

    }, {
        key: 'applyDelayedInputs',
        value: function applyDelayedInputs() {
            if (!this.delayedInputs) {
                return;
            }
            var that = this;
            var delayed = this.delayedInputs.shift();
            if (delayed && delayed.length) {
                delayed.forEach(that.doInputLocal.bind(that));
            }
            this.delayedInputs.push([]);
        }

        /**
         * This function should be called by the client whenever a user input
         * occurs.  This function will emit the input event,
         * forward the input to the client's game engine (with a delay if
         * so configured) and will transmit the input to the server as well.
         *
         * This function can be called by the extended client engine class,
         * typically at the beginning of client-side step processing (see event client__preStep)
         *
         * @param {String} input - string representing the input
         * @param {Object} inputOptions - options for the input
         */

    }, {
        key: 'sendInput',
        value: function sendInput(input, inputOptions) {
            var _this3 = this;

            var inputEvent = {
                command: 'move',
                data: {
                    messageIndex: this.messageIndex,
                    step: this.gameEngine.world.stepCount,
                    input: input,
                    options: inputOptions
                }
            };

            this.gameEngine.trace.info(function () {
                return 'USER INPUT[' + _this3.messageIndex + ']: ' + input + ' ' + (inputOptions ? JSON.stringify(inputOptions) : '{}');
            });

            // if we delay input application on client, then queue it
            // otherwise apply it now
            if (this.delayedInputs) {
                this.delayedInputs[this.delayedInputs.length - 1].push(inputEvent);
            } else {
                this.doInputLocal(inputEvent);
            }

            if (this.options.standaloneMode !== true) {
                this.outboundMessages.push(inputEvent);
            }

            this.messageIndex++;
        }

        // handle a message that has been received from the server

    }, {
        key: 'handleInboundMessage',
        value: function handleInboundMessage(syncData) {
            var _this4 = this;

            var syncEvents = this.networkTransmitter.deserializePayload(syncData).events;
            var syncHeader = syncEvents.find(function (e) {
                return e.eventName === 'syncHeader';
            });

            // emit that a snapshot has been received
            if (!this.gameEngine.highestServerStep || syncHeader.stepCount > this.gameEngine.highestServerStep) this.gameEngine.highestServerStep = syncHeader.stepCount;
            this.gameEngine.emit('client__syncReceived', {
                syncEvents: syncEvents,
                stepCount: syncHeader.stepCount,
                fullUpdate: syncHeader.fullUpdate
            });

            this.gameEngine.trace.info(function () {
                return '========== inbound world update ' + syncHeader.stepCount + ' ==========';
            });

            // finally update the stepCount
            if (syncHeader.stepCount > this.gameEngine.world.stepCount + this.synchronizer.syncStrategy.STEP_DRIFT_THRESHOLDS.clientReset) {
                this.gameEngine.trace.info(function () {
                    return '========== world step count updated from ' + _this4.gameEngine.world.stepCount + ' to  ' + syncHeader.stepCount + ' ==========';
                });
                this.gameEngine.emit('client__stepReset', { oldStep: this.gameEngine.world.stepCount, newStep: syncHeader.stepCount });
                this.gameEngine.world.stepCount = syncHeader.stepCount;
                // MJW: not really where this should happen but whatever...
                this.gameEngine.world.playerCount = syncHeader.playerCount;
            }
        }

        // emit an input to the authoritative server

    }, {
        key: 'handleOutboundInput',
        value: function handleOutboundInput() {
            for (var x = 0; x < this.outboundMessages.length; x++) {
                this.socket.emit(this.outboundMessages[x].command, this.outboundMessages[x].data);
            }
            this.outboundMessages = [];
        }
    }]);

    return ClientEngine;
}();

export default ClientEngine;