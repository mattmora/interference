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

var transportSyncCount = 0;
var rooms = {};
var palettes = ['rain'];

var InterferenceServerEngine =
/*#__PURE__*/
function (_ServerEngine) {
  _inherits(InterferenceServerEngine, _ServerEngine);

  function InterferenceServerEngine(io, gameEngine, inputOptions) {
    var _this;

    _classCallCheck(this, InterferenceServerEngine);

    _this = _possibleConstructorReturn(this, _getPrototypeOf(InterferenceServerEngine).call(this, io, gameEngine, inputOptions)); // MJW: sync init

    _this.startTime = process.hrtime();
    _this.syncServer = new _server.default(function () {
      var now = process.hrtime(_this.startTime);
      return now[0] + now[1] * 1e-9;
    });

    _this.gameEngine.on('postStep', _this.stepLogic.bind(_assertThisInitialized(_this)));

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

      this.syncServer.start( // sync send function
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
      }); //let numPlayers = this.gameEngine.world.queryObjects({ instanceType: Performer }).length;

      var player = new _Performer.default(this.gameEngine, null, {});
      player.number = -1;
      player.palette = 'default';
      player.notestack = '';
      player.rhythmstack = '';
      console.log(player.number);
      player.playerId = socket.playerId;
      this.gameEngine.addObjectToWorld(player);
      socket.on('assignToRoom', function (roomName) {
        if (!Object.keys(rooms).includes(roomName)) {
          _this2.createRoom(roomName);

          rooms[roomName] = [];
        }

        player.number = rooms[roomName].length;
        player.palette = palettes[player.number % palettes.length];
        console.log(player.number);
        rooms[roomName].push(player);

        _this2.assignPlayerToRoom(player.playerId, roomName);

        _this2.assignObjectToRoom(player, roomName);

        socket.emit('assignedRoom', roomName);
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

        var _arr = Object.keys(rooms);

        for (var _i = 0; _i < _arr.length; _i++) {
          var k = _arr[_i];

          if (rooms[k].includes(player)) {
            rooms[k].splice(rooms[k].indexOf(player), 1);
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = rooms[k][Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var p = _step.value;
                if (p.number > removed) p.number--;
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
        }
      }
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
      var players = this.gameEngine.world.queryObjects({
        instanceType: _Performer.default
      });
      var eggs = this.gameEngine.world.queryObjects({
        instanceType: _Egg.default
      });
      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = players[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          /*
          // check for collision
          for (let w2 of wiggles) {
              if (w === w2)
                  continue;
               for (let i = 0; i < w2.bodyParts.length; i++) {
                  let distance = w2.bodyParts[i].clone().subtract(w.position);
                  if (distance.length() < this.gameEngine.collideDistance)
                      this.wiggleHitWiggle(w, w2);
              }
          }
           // check for food-eating
          for (let f of foodObjects) {
              let distance = w.position.clone().subtract(f.position);
              if (distance.length() < this.gameEngine.eatDistance) {
                  this.wiggleEatFood(w, f);
              }
          }
           // move AI wiggles
          if (w.AI) {
              if (Math.random() < 0.01) w.turnDirection *= -1;
              w.direction += w.turnDirection * (Math.random() - 0.9)/20;
              if (w.position.y >= this.gameEngine.spaceHeight / 2) w.direction = -Math.PI/2;
              if (w.position.y <= -this.gameEngine.spaceHeight / 2) w.direction = Math.PI/2;
              if (w.position.x >= this.gameEngine.spaceWidth / 2) w.direction = Math.PI;
              if (w.position.x <= -this.gameEngine.spaceWidth / 2) w.direction = 0;
              if (w.direction > Math.PI * 2) w.direction -= Math.PI * 2;
              if (w.direction < 0) w.direction += Math.PI * 2;
          }
          */

          var p = _step2.value;
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
  }]);

  return InterferenceServerEngine;
}(_lanceGg.ServerEngine);

exports.default = InterferenceServerEngine;
//# sourceMappingURL=InterferenceServerEngine.js.map