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
		.factory('nbPictureUtils', nbPictureUtils);

	nbPictureUtils.$inject = ['PICTURE_POSITION', 'PICTURE_SHAPE'];
	function nbPictureUtils (PICTURE_POSITION, PICTURE_SHAPE) {
		var utils = {};

		/**
		 *
		 * @param {Number} x Value between 0 and 1.
		 * @param {Number} y Value between 0 and 1.
		 * @returns {String}
		 */
		utils.getPosition = function (x, y) {
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
		utils.contains = function (shape, coords, point) {
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
				var bounds = utils.getBounds(shape, coords);

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
		utils.getSize = function (shape, coords) {
			var bounds = utils.getBounds(shape, coords);

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
		utils.getBounds = function (shape, coords) {
			var x1 = 0, y1 = 0, x2 = 0, y2 = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x1 = coords[0] - coords[2];
				y1 = coords[1] - coords[2];
				x2 = coords[0] + coords[2];
				y2 = coords[1] + coords[2];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var coord, i, il;

				for (i = 0, il = coords.length; i < il; i++) {
					coord = coords[i];

					if (i % 2 === 0) {
						if (i === 0) {
							x1 = coord;
						}
						else {
							if (coord < x1) {
								x1 = coord;
							}
							if (coord > x2) {
								x2 = coord;
							}
						}
					}
					else {
						if (i === 1) {
							y1 = coord;
						}
						else {
							if (coord < y1) {
								y1 = coord;
							}
							if (coord > y2) {
								y2 = coord;
							}
						}
					}
				}
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
		utils.getCenter = function (shape, coords, round) {
			var x = 0, y = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x = coords[0];
				y = coords[1];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var bounds = utils.getBounds(shape, coords);
				x = (bounds[0] + bounds[2]) / 2;
				y = (bounds[1] + bounds[3]) / 2;
			}

			if (round) {
				x = Math.round(x);
				y = Math.round(y);
			}

			return [x, y];
		};

		return utils;
	}
})(window, window.angular);