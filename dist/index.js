'use strict';

var _app = require('./app');

var _app2 = _interopRequireDefault(_app);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_app2.default.listen(process.env.PORT || 5001, function () {
  return console.log('All is ok, sit back and relax!');
});
//# sourceMappingURL=index.js.map