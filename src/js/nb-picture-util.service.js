/**
 * AngularJS directive for responsive images and image maps
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.picture')
		.service('nbPictureUtilService', nbPictureUtilService);

	nbPictureUtilService.$inject = ['PICTURE_POSITION', 'PICTURE_SHAPE', '_'];
	function nbPictureUtilService (PICTURE_POSITION, PICTURE_SHAPE, _) {
		/* jshint validthis: true */

		/**
		 *
		 * @param {Number} x Value between 0 and 1.
		 * @param {Number} y Value between 0 and 1.
		 * @returns {String}
		 */
		this.getPosition = function (x, y) {
			// Left
			if (x < 0.5) {
				// Top
				if (y < 0.5) {
					return PICTURE_POSITION.LEFT_TOP;
				}
				// Bottom
				else {
					return PICTURE_POSITION.LEFT_BOTTOM;
				}
			}
			// Right
			else {
				// Top
				if (y < 0.5) {
					return PICTURE_POSITION.RIGHT_TOP;
				}
				// Bottom
				else {
					return PICTURE_POSITION.RIGHT_BOTTOM;
				}
			}
		};

		/**
		 * Checks if a shape contains a point.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @param {Array} point
		 * @returns {Boolean}
		 */
		this.contains = function (shape, coords, point) {
			var x = point[0];
			var y = point[1];

			if (shape === PICTURE_SHAPE.CIRCLE) {
				var cx = coords[0];
				var cy = coords[1];
				var radius = coords[2];
				var distanceSquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);

				return distanceSquared <= radius * radius;
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var bounds = this.getBounds(shape, coords);

				return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3];
			}

			return false;
		};

		/**
		 * Calculates the width and height of the bounds of a shape.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @returns {Object}
		 */
		this.getSize = function (shape, coords) {
			var bounds = this.getBounds(shape, coords);

			return {
				width: bounds[2] - bounds[0],
				height: bounds[3] - bounds[1]
			};
		};

		/**
		 * Calculates the bounds of a shape.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @returns {Array}
		 */
		this.getBounds = function (shape, coords) {
			var x1 = 0, y1 = 0, x2 = 0, y2 = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x1 = coords[0] - coords[2];
				y1 = coords[1] - coords[2];
				x2 = coords[0] + coords[2];
				y2 = coords[1] + coords[2];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var x = [], y = [];

				_.forEach(coords, function (value, i) {
					if (i % 2 === 0) {
						x.push(value);
					}
					else {
						y.push(value);
					}
				});

				x1 = _.min(x);
				y1 = _.min(y);
				x2 = _.max(x);
				y2 = _.max(y);
			}

			return [x1, y1, x2, y2];
		};

		/**
		 * Calculates the center of a shape's bounds.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @param {Boolean} round Whether to round the returned values.
		 * @returns {Array}
		 */
		this.getCenter = function (shape, coords, round) {
			var x = 0, y = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x = coords[0];
				y = coords[1];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var bounds = this.getBounds(shape, coords);
				x = (bounds[0] + bounds[2]) / 2;
				y = (bounds[1] + bounds[3]) / 2;
			}

			if (round) {
				x = Math.round(x);
				y = Math.round(y);
			}

			return [x, y];
		};

		/**
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @param {Number} width
		 * @param {Number} height
		 * @param {Boolean} round Whether to round the returned values.
		 * @returns {Array}
		 */
		this.relToAbsCoords = function (shape, coords, width, height, round) {
			var i, val;
			var len = coords.length;
			var newCoords = new Array(len);

			if (shape === PICTURE_SHAPE.CIRCLE) {
				for (i = 0; i < len && i < 3; i++) {
					if (i < 2) {
						val = coords[i] * (i % 2 === 0 ? width : height);
						if (round) {
							val = Math.round(val);
						}
						newCoords[i] = val;
					}
					else {
						val = coords[i] * Math.min(width, height);
						if (round) {
							val = Math.round(val);
						}
						newCoords[i] = val;
					}
				}
			}
			else if (shape === PICTURE_SHAPE.POLYGON) {
				for (i = 0; i < len; i++) {
					val = coords[i] * (i % 2 === 0 ? width : height);
					if (round) {
						val = Math.round(val);
					}
					newCoords[i] = val;
				}
			}
			else if (shape === PICTURE_SHAPE.RECTANGLE) {
				for (i = 0; i < len && i < 4; i++) {
					val = coords[i] * (i % 2 === 0 ? width : height);
					if (round) {
						val = Math.round(val);
					}
					newCoords[i] = val;
				}
			}

			return newCoords;
		};
	}
})(window, window.angular);