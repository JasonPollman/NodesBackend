'use strict';Object.defineProperty(exports, "__esModule", { value: true });





var _lodash = require('lodash');var _lodash2 = _interopRequireDefault(_lodash);
var _uuidRegexp = require('uuid-regexp');var _uuidRegexp2 = _interopRequireDefault(_uuidRegexp);function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };} /**
                                                                                                                                                                                               * Application wide constants.
                                                                                                                                                                                               * @since 4/9/18
                                                                                                                                                                                               * @file
                                                                                                                                                                                               */var UUIDRegExp = (0, _uuidRegexp2.default)({ nil: true }); /**
                                                                                                                                                                                                                                                             * Maps node types to their respective validation function.
                                                                                                                                                                                                                                                             * @type {object<function>}
                                                                                                                                                                                                                                                             */
var NODE_TYPE_MAPPING = {
  factory: _lodash2.default.isString,
  default: _lodash2.default.isNumber };


/**
                                         * The prefix to append to all socket event names.
                                         * If this application we're expanded, this could serve
                                         * to avoid collisions with other functionality.
                                         * @type {string}
                                         */
var SOCKET_EVENT_NAME_PREFIX = '';exports.default =

Object.assign(exports, Object.freeze({
  NODE_ENV: _lodash2.default.get(process.env, 'NODE_ENV', 'production'),
  ROOT_NODE_ID: '00000000-0000-0000-0000-000000000000',
  DEFAULT_DB_URL: 'mongodb://localhost:27017',
  DEFAULT_DB_NAME: 'node-factory',
  DEFAULT_DB_COLLECTION: 'nodes',
  SOCKET_EVENTS: {
    ERROR: SOCKET_EVENT_NAME_PREFIX + 'err',
    HAS_NODE: SOCKET_EVENT_NAME_PREFIX + 'has',
    GET_NODE: SOCKET_EVENT_NAME_PREFIX + 'get',
    SET_NODE: SOCKET_EVENT_NAME_PREFIX + 'set',
    DEL_NODE: SOCKET_EVENT_NAME_PREFIX + 'del' },

  NODE_SCHEMA: {
    id: {
      check: function check(id) {return UUIDRegExp.test(id);},
      message: 'Node "id" property must be a valid v4 UUID.' },

    type: {
      check: _lodash2.default.isString,
      message: 'Node "type" property must be a string.' },

    parent: {
      check: _lodash2.default.isString,
      message: 'Node "parent" property must be a string.' },

    value: {
      check: function check(value, node) {return (NODE_TYPE_MAPPING[node.type] || NODE_TYPE_MAPPING.default)(value);},
      message: 'Node "value" property is invalid.' } } }));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uL3NyYy9jb25zdGFudHMuanMiXSwibmFtZXMiOlsiVVVJRFJlZ0V4cCIsIm5pbCIsIk5PREVfVFlQRV9NQVBQSU5HIiwiZmFjdG9yeSIsImlzU3RyaW5nIiwiZGVmYXVsdCIsImlzTnVtYmVyIiwiU09DS0VUX0VWRU5UX05BTUVfUFJFRklYIiwiT2JqZWN0IiwiYXNzaWduIiwiZXhwb3J0cyIsImZyZWV6ZSIsIk5PREVfRU5WIiwiZ2V0IiwicHJvY2VzcyIsImVudiIsIlJPT1RfTk9ERV9JRCIsIkRFRkFVTFRfREJfVVJMIiwiREVGQVVMVF9EQl9OQU1FIiwiREVGQVVMVF9EQl9DT0xMRUNUSU9OIiwiU09DS0VUX0VWRU5UUyIsIkVSUk9SIiwiSEFTX05PREUiLCJHRVRfTk9ERSIsIlNFVF9OT0RFIiwiREVMX05PREUiLCJOT0RFX1NDSEVNQSIsImlkIiwiY2hlY2siLCJ0ZXN0IiwibWVzc2FnZSIsInR5cGUiLCJwYXJlbnQiLCJ2YWx1ZSIsIm5vZGUiXSwibWFwcGluZ3MiOiI7Ozs7OztBQU1BLGdDO0FBQ0EseUMscUpBUEE7Ozs7aU1BU0EsSUFBTUEsYUFBYSwwQkFBbUIsRUFBRUMsS0FBSyxJQUFQLEVBQW5CLENBQW5CLEMsQ0FFQTs7OztBQUlBLElBQU1DLG9CQUFvQjtBQUN4QkMsV0FBUyxpQkFBRUMsUUFEYTtBQUV4QkMsV0FBUyxpQkFBRUMsUUFGYSxFQUExQjs7O0FBS0E7Ozs7OztBQU1BLElBQU1DLDJCQUEyQixFQUFqQyxDOztBQUVlQyxPQUFPQyxNQUFQLENBQWNDLE9BQWQsRUFBdUJGLE9BQU9HLE1BQVAsQ0FBYztBQUNsREMsWUFBVSxpQkFBRUMsR0FBRixDQUFNQyxRQUFRQyxHQUFkLEVBQW1CLFVBQW5CLEVBQStCLFlBQS9CLENBRHdDO0FBRWxEQyxnQkFBYyxzQ0FGb0M7QUFHbERDLGtCQUFnQiwyQkFIa0M7QUFJbERDLG1CQUFpQixjQUppQztBQUtsREMseUJBQXVCLE9BTDJCO0FBTWxEQyxpQkFBZTtBQUNiQyxXQUFVZCx3QkFBVixRQURhO0FBRWJlLGNBQWFmLHdCQUFiLFFBRmE7QUFHYmdCLGNBQWFoQix3QkFBYixRQUhhO0FBSWJpQixjQUFhakIsd0JBQWIsUUFKYTtBQUtia0IsY0FBYWxCLHdCQUFiLFFBTGEsRUFObUM7O0FBYWxEbUIsZUFBYTtBQUNYQyxRQUFJO0FBQ0ZDLGFBQU8sMkJBQU01QixXQUFXNkIsSUFBWCxDQUFnQkYsRUFBaEIsQ0FBTixFQURMO0FBRUZHLGVBQVMsNkNBRlAsRUFETzs7QUFLWEMsVUFBTTtBQUNKSCxhQUFPLGlCQUFFeEIsUUFETDtBQUVKMEIsZUFBUyx3Q0FGTCxFQUxLOztBQVNYRSxZQUFRO0FBQ05KLGFBQU8saUJBQUV4QixRQURIO0FBRU4wQixlQUFTLDBDQUZILEVBVEc7O0FBYVhHLFdBQU87QUFDTEwsYUFBTyxlQUFDSyxLQUFELEVBQVFDLElBQVIsVUFBaUIsQ0FBQ2hDLGtCQUFrQmdDLEtBQUtILElBQXZCLEtBQWdDN0Isa0JBQWtCRyxPQUFuRCxFQUE0RDRCLEtBQTVELENBQWpCLEVBREY7QUFFTEgsZUFBUyxtQ0FGSixFQWJJLEVBYnFDLEVBQWQsQ0FBdkIsQyIsImZpbGUiOiJjb25zdGFudHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEFwcGxpY2F0aW9uIHdpZGUgY29uc3RhbnRzLlxuICogQHNpbmNlIDQvOS8xOFxuICogQGZpbGVcbiAqL1xuXG5pbXBvcnQgXyBmcm9tICdsb2Rhc2gnO1xuaW1wb3J0IGdlbmVyYXRlVVVJRFJlZ0V4cCBmcm9tICd1dWlkLXJlZ2V4cCc7XG5cbmNvbnN0IFVVSURSZWdFeHAgPSBnZW5lcmF0ZVVVSURSZWdFeHAoeyBuaWw6IHRydWUgfSk7XG5cbi8qKlxuICogTWFwcyBub2RlIHR5cGVzIHRvIHRoZWlyIHJlc3BlY3RpdmUgdmFsaWRhdGlvbiBmdW5jdGlvbi5cbiAqIEB0eXBlIHtvYmplY3Q8ZnVuY3Rpb24+fVxuICovXG5jb25zdCBOT0RFX1RZUEVfTUFQUElORyA9IHtcbiAgZmFjdG9yeTogXy5pc1N0cmluZyxcbiAgZGVmYXVsdDogXy5pc051bWJlcixcbn07XG5cbi8qKlxuICogVGhlIHByZWZpeCB0byBhcHBlbmQgdG8gYWxsIHNvY2tldCBldmVudCBuYW1lcy5cbiAqIElmIHRoaXMgYXBwbGljYXRpb24gd2UncmUgZXhwYW5kZWQsIHRoaXMgY291bGQgc2VydmVcbiAqIHRvIGF2b2lkIGNvbGxpc2lvbnMgd2l0aCBvdGhlciBmdW5jdGlvbmFsaXR5LlxuICogQHR5cGUge3N0cmluZ31cbiAqL1xuY29uc3QgU09DS0VUX0VWRU5UX05BTUVfUFJFRklYID0gJyc7XG5cbmV4cG9ydCBkZWZhdWx0IE9iamVjdC5hc3NpZ24oZXhwb3J0cywgT2JqZWN0LmZyZWV6ZSh7XG4gIE5PREVfRU5WOiBfLmdldChwcm9jZXNzLmVudiwgJ05PREVfRU5WJywgJ3Byb2R1Y3Rpb24nKSxcbiAgUk9PVF9OT0RFX0lEOiAnMDAwMDAwMDAtMDAwMC0wMDAwLTAwMDAtMDAwMDAwMDAwMDAwJyxcbiAgREVGQVVMVF9EQl9VUkw6ICdtb25nb2RiOi8vbG9jYWxob3N0OjI3MDE3JyxcbiAgREVGQVVMVF9EQl9OQU1FOiAnbm9kZS1mYWN0b3J5JyxcbiAgREVGQVVMVF9EQl9DT0xMRUNUSU9OOiAnbm9kZXMnLFxuICBTT0NLRVRfRVZFTlRTOiB7XG4gICAgRVJST1I6IGAke1NPQ0tFVF9FVkVOVF9OQU1FX1BSRUZJWH1lcnJgLFxuICAgIEhBU19OT0RFOiBgJHtTT0NLRVRfRVZFTlRfTkFNRV9QUkVGSVh9aGFzYCxcbiAgICBHRVRfTk9ERTogYCR7U09DS0VUX0VWRU5UX05BTUVfUFJFRklYfWdldGAsXG4gICAgU0VUX05PREU6IGAke1NPQ0tFVF9FVkVOVF9OQU1FX1BSRUZJWH1zZXRgLFxuICAgIERFTF9OT0RFOiBgJHtTT0NLRVRfRVZFTlRfTkFNRV9QUkVGSVh9ZGVsYCxcbiAgfSxcbiAgTk9ERV9TQ0hFTUE6IHtcbiAgICBpZDoge1xuICAgICAgY2hlY2s6IGlkID0+IFVVSURSZWdFeHAudGVzdChpZCksXG4gICAgICBtZXNzYWdlOiAnTm9kZSBcImlkXCIgcHJvcGVydHkgbXVzdCBiZSBhIHZhbGlkIHY0IFVVSUQuJyxcbiAgICB9LFxuICAgIHR5cGU6IHtcbiAgICAgIGNoZWNrOiBfLmlzU3RyaW5nLFxuICAgICAgbWVzc2FnZTogJ05vZGUgXCJ0eXBlXCIgcHJvcGVydHkgbXVzdCBiZSBhIHN0cmluZy4nLFxuICAgIH0sXG4gICAgcGFyZW50OiB7XG4gICAgICBjaGVjazogXy5pc1N0cmluZyxcbiAgICAgIG1lc3NhZ2U6ICdOb2RlIFwicGFyZW50XCIgcHJvcGVydHkgbXVzdCBiZSBhIHN0cmluZy4nLFxuICAgIH0sXG4gICAgdmFsdWU6IHtcbiAgICAgIGNoZWNrOiAodmFsdWUsIG5vZGUpID0+IChOT0RFX1RZUEVfTUFQUElOR1tub2RlLnR5cGVdIHx8IE5PREVfVFlQRV9NQVBQSU5HLmRlZmF1bHQpKHZhbHVlKSxcbiAgICAgIG1lc3NhZ2U6ICdOb2RlIFwidmFsdWVcIiBwcm9wZXJ0eSBpcyBpbnZhbGlkLicsXG4gICAgfSxcbiAgfSxcbn0pKTtcbiJdfQ==