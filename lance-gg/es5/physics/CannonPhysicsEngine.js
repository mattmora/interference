var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

import PhysicsEngine from './PhysicsEngine';
import CANNON from 'cannon';

/**
 * CannonPhysicsEngine is a three-dimensional lightweight physics engine
 */

var CannonPhysicsEngine = function (_PhysicsEngine) {
    _inherits(CannonPhysicsEngine, _PhysicsEngine);

    function CannonPhysicsEngine(options) {
        _classCallCheck(this, CannonPhysicsEngine);

        var _this = _possibleConstructorReturn(this, (CannonPhysicsEngine.__proto__ || Object.getPrototypeOf(CannonPhysicsEngine)).call(this, options));

        _this.options.dt = _this.options.dt || 1 / 60;
        var world = _this.world = new CANNON.World();
        world.quatNormalizeSkip = 0;
        world.quatNormalizeFast = false;
        world.gravity.set(0, -10, 0);
        world.broadphase = new CANNON.NaiveBroadphase();
        _this.CANNON = CANNON;
        return _this;
    }

    // entry point for a single step of the Simple Physics


    _createClass(CannonPhysicsEngine, [{
        key: 'step',
        value: function step(dt, objectFilter) {
            this.world.step(dt || this.options.dt);
        }
    }, {
        key: 'addSphere',
        value: function addSphere(radius, mass) {
            var shape = new CANNON.Sphere(radius);
            var body = new CANNON.Body({ mass: mass, shape: shape });
            body.position.set(0, 0, 0);
            this.world.addBody(body);
            return body;
        }
    }, {
        key: 'addBox',
        value: function addBox(x, y, z, mass, friction) {
            var shape = new CANNON.Box(new CANNON.Vec3(x, y, z));
            var options = { mass: mass, shape: shape };
            if (friction !== undefined) options.material = new CANNON.Material({ friction: friction });

            var body = new CANNON.Body(options);
            body.position.set(0, 0, 0);
            this.world.addBody(body);
            return body;
        }
    }, {
        key: 'addCylinder',
        value: function addCylinder(radiusTop, radiusBottom, height, numSegments, mass) {
            var shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
            var body = new CANNON.Body({ mass: mass, shape: shape });
            this.world.addBody(body);
            return body;
        }
    }, {
        key: 'removeObject',
        value: function removeObject(obj) {
            this.world.removeBody(obj);
        }
    }]);

    return CannonPhysicsEngine;
}(PhysicsEngine);

export default CannonPhysicsEngine;