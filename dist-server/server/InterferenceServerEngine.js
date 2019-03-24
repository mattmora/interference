"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _lanceGg = require("lance-gg");

var _server = _interopRequireDefault(require("@ircam/sync/server"));

var _Performer = _interopRequireDefault(require("../common/Performer"));

var _Egg = _interopRequireDefault(require("../common/Egg"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _get(target, property, receiver) { if (typeof Reflect !== "undefined" && Reflect.get) { _get = Reflect.get; } else { _get = function _get(target, property, receiver) { var base = _superPropBase(target, property); if (!base) return; var desc = Object.getOwnPropertyDescriptor(base, property); if (desc.get) { return desc.get.call(receiver); } return desc.value; }; } return _get(target, property, receiver || target); }

function _superPropBase(object, property) { while (!Object.prototype.hasOwnProperty.call(object, property)) { object = _getPrototypeOf(object); if (object === null) break; } return object; }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

var palettes = ['rain', 'celeste', 'pyre', 'journey', 'kirby'];

var InterferenceServerEngine =
/*#__PURE__*/
function (_ServerEngine) {
  _inherits(InterferenceServerEngine, _ServerEngine);

  function InterferenceServerEngine(io, gameEngine, inputOptions) {
    var _this;

    _classCallCheck(this, InterferenceServerEngine);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InterferenceServerEngine).call(this, io, gameEngine, inputOptions));
    _this.myRooms = {}; //roomName: [players in the room]

    _this.roomStages = {};
    _this.syncServers = {}; //roomName: syncServer

    _this.gameEngine.on('postStep', _this.stepLogic.bind(_assertThisInitialized(_this)));

    _this.gameEngine.on('beginPerformance', function (player) {
      _this.onBeginPerformance(player);
    });

    return _this;
  } // create food and AI robots


  _createClass(InterferenceServerEngine, [{
    key: "start",
    value: function start() {
      _get(_getPrototypeOf(InterferenceServerEngine.prototype), "start", this).call(this);
      /*
      for (let f = 0; f < this.gameEngine.foodCount; f++) {
          let newF = new Egg(this.gameEngine, null, { position: this.gameEngine.randPos() });
          this.gameEngine.addObjectToWorld(newF);
      }
      */

    }
  }, {
    key: "onPlayerConnected",
    value: function onPlayerConnected(socket) {
      var _this2 = this;

      _get(_getPrototypeOf(InterferenceServerEngine.prototype), "onPlayerConnected", this).call(this, socket);

      var player = new _Performer.default(this.gameEngine, null, {});
      player.number = -1;
      player.palette = 'default';
      player.notestack = '';
      player.rhythmstack = '';
      player.ammo = 0;
      player.stage = 'setup';
      console.log(player.number);
      player.playerId = socket.playerId;
      this.gameEngine.addObjectToWorld(player);
      socket.on('assignToRoom', function (roomName) {
        if (!Object.keys(_this2.myRooms).includes(roomName)) {
          _this2.createRoom(roomName);

          _this2.createSyncServer(roomName);

          _this2.myRooms[roomName] = [];
          _this2.roomStages[roomName] = 'setup';
        }

        player.number = _this2.myRooms[roomName].length;
        player.palette = palettes[player.number % palettes.length];
        player.stage = _this2.roomStages[roomName];

        if (player.stage === 'intro') {
          player.ammo += 8;
          var _iteratorNormalCompletion = true;
          var _didIteratorError = false;
          var _iteratorError = undefined;

          try {
            for (var _iterator = _this2.gameEngine.eggsByRoom[roomName][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
              var e = _step.value;
              e.hp += Math.floor(Math.random() * 3 + 5);
            }
          } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion && _iterator.return != null) {
                _iterator.return();
              }
            } finally {
              if (_didIteratorError) {
                throw _iteratorError;
              }
            }
          }
        }

        console.log(player.number);

        _this2.myRooms[roomName].push(player);

        _this2.assignPlayerToRoom(player.playerId, roomName);

        _this2.assignObjectToRoom(player, roomName);

        _this2.assignPlayerToSyncServer(socket, roomName);

        socket.emit('assignedRoom', roomName);
      });
    }
  }, {
    key: "createSyncServer",
    value: function createSyncServer(roomName) {
      var startTime = process.hrtime();
      this.syncServers[roomName] = new _server.default(function () {
        var now = process.hrtime(startTime);
        return now[0] + now[1] * 1e-9;
      });
    }
  }, {
    key: "assignPlayerToSyncServer",
    value: function assignPlayerToSyncServer(socket, roomName) {
      this.syncServers[roomName].start( // sync send function
      function (pingId, clientPingTime, serverPingTime, serverPongTime) {
        //console.log(`[pong] - id: %s, clientPingTime: %s, serverPingTime: %s, serverPongTime: %s`,
        //  pingId, clientPingTime, serverPingTime, serverPongTime);
        var response = [];
        response[0] = 1; // this is a pong

        response[1] = pingId;
        response[2] = clientPingTime;
        response[3] = serverPingTime;
        response[4] = serverPongTime;
        socket.emit('syncServerData', response);
      }, //sync receive function
      function (callback) {
        socket.on('syncClientData', function (data) {
          var request = data;

          if (request[0] === 0) {
            // this is a ping
            var pingId = request[1];
            var clientPingTime = request[2]; //console.log(`[ping] - pingId: %s, clientPingTime: %s`, clientPingTime);

            callback(pingId, clientPingTime);
          }
        });
      });
    }
  }, {
    key: "onPlayerDisconnected",
    value: function onPlayerDisconnected(socketId, playerId) {
      _get(_getPrototypeOf(InterferenceServerEngine.prototype), "onPlayerDisconnected", this).call(this, socketId, playerId);

      var player = this.gameEngine.world.queryObject({
        playerId: playerId
      });

      if (player) {
        var removed = player.number;
        this.gameEngine.removeObjectFromWorld(player.id);

        var _arr = Object.keys(this.myRooms);

        for (var _i = 0; _i < _arr.length; _i++) {
          var k = _arr[_i];

          if (this.myRooms[k].includes(player)) {
            this.myRooms[k].splice(this.myRooms[k].indexOf(player), 1);
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
              for (var _iterator2 = this.myRooms[k][Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                var p = _step2.value;
                if (p.number > removed) p.number--;
              }
            } catch (err) {
              _didIteratorError2 = true;
              _iteratorError2 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
                  _iterator2.return();
                }
              } finally {
                if (_didIteratorError2) {
                  throw _iteratorError2;
                }
              }
            }
          }

          if (this.myRooms[k].length === 0) {
            var _iteratorNormalCompletion3 = true;
            var _didIteratorError3 = false;
            var _iteratorError3 = undefined;

            try {
              for (var _iterator3 = this.gameEngine.world.queryObjects({
                instanceType: _Egg.default
              })[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
                var e = _step3.value;
                this.gameEngine.removeObjectFromWorld(e);
              }
            } catch (err) {
              _didIteratorError3 = true;
              _iteratorError3 = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
                  _iterator3.return();
                }
              } finally {
                if (_didIteratorError3) {
                  throw _iteratorError3;
                }
              }
            }

            delete this.myRooms[k];
            delete this.syncServers[k];
          }
        }
      }
    }
  }, {
    key: "onBeginPerformance",
    value: function onBeginPerformance(player) {
      console.log('beginning');
      var r = player._roomName;
      this.roomStages[r] = 'intro';
      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = this.myRooms[r][Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var p = _step4.value;
          p.stage = 'intro';
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
            _iterator4.return();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      this.addEgg(r);
    }
  }, {
    key: "addEgg",
    value: function addEgg(roomName) {
      var newEgg = new _Egg.default(this.gameEngine, null, {
        position: this.gameEngine.randPos(roomName),
        velocity: this.gameEngine.velRandY()
      });
      var numPlayers = this.myRooms[roomName].length;
      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = this.myRooms[roomName][Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var p = _step5.value;
          p.ammo += 8;
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
            _iterator5.return();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      newEgg.number = 0;
      newEgg.sound = 'melody';
      newEgg.hp = Math.floor(Math.random() * numPlayers * 3 + numPlayers * 5);
      this.assignObjectToRoom(newEgg, roomName);
      this.gameEngine.addObjectToWorld(newEgg);
    }
    /*
    // Eating Egg:
    // increase body length, and remove the food
    wiggleEatFood(w, f) {
        if (!(f.id in this.gameEngine.world.objects))
            return;
         w.bodyLength++;
        this.gameEngine.removeObjectFromWorld(f);
        let newF = new Egg(this.gameEngine, null, { position: this.gameEngine.randPos() });
        this.gameEngine.addObjectToWorld(newF);
    }
     wiggleHitWiggle(w1, w2) {
        if (!(w2.id in this.gameEngine.world.objects) || !(w1.id in this.gameEngine.world.objects))
            return;
         this.gameEngine.removeObjectFromWorld(w1);
        if (w1.AI) this.addAI();
    }
    */

  }, {
    key: "stepLogic",
    value: function stepLogic() {
      var _arr2 = Object.keys(this.myRooms);

      for (var _i2 = 0; _i2 < _arr2.length; _i2++) {
        var k = _arr2[_i2];
        var reload = true;
        var _iteratorNormalCompletion6 = true;
        var _didIteratorError6 = false;
        var _iteratorError6 = undefined;

        try {
          for (var _iterator6 = this.myRooms[k][Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
            var _p = _step6.value;
            if (_p.ammo > 0) reload = false;
          }
        } catch (err) {
          _didIteratorError6 = true;
          _iteratorError6 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion6 && _iterator6.return != null) {
              _iterator6.return();
            }
          } finally {
            if (_didIteratorError6) {
              throw _iteratorError6;
            }
          }
        }

        if (reload) {
          var _iteratorNormalCompletion7 = true;
          var _didIteratorError7 = false;
          var _iteratorError7 = undefined;

          try {
            for (var _iterator7 = this.myRooms[k][Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
              var p = _step7.value;
              p.ammo += 4;
            }
          } catch (err) {
            _didIteratorError7 = true;
            _iteratorError7 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion7 && _iterator7.return != null) {
                _iterator7.return();
              }
            } finally {
              if (_didIteratorError7) {
                throw _iteratorError7;
              }
            }
          }
        }
      }
    }
  }]);

  return InterferenceServerEngine;
}(_lanceGg.ServerEngine);

exports.default = InterferenceServerEngine;
//# sourceMappingURL=InterferenceServerEngine.js.map