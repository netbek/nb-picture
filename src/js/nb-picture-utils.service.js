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

	nbPictureUtils.$inject = ['PICTURE_POSITION'];
	function nbPictureUtils (PICTURE_POSITION) {
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
		 * Calculates the center of a polygon's bounds.
		 *
		 * @param {Array} coords
		 * @param {Boolean} round Whether to round the returned values.
		 * @returns {Array} [x, y]
		 */
		utils.getCenter = function (coords, round) {
			var xMin = 0, yMin = 0, xMax = 0, yMax = 0, coord;

			for (var i = 0, il = coords.length; i < il; i++) {
				coord = coords[i];

				if (i % 2 === 0) {
					if (i === 0) {
						xMin = coord;
					}
					else {
						if (coord < xMin) {
							xMin = coord;
						}
						if (coord > xMax) {
							xMax = coord;
						}
					}
				}
				else {
					if (i === 1) {
						yMin = coord;
					}
					else {
						if (coord < yMin) {
							yMin = coord;
						}
						if (coord > yMax) {
							yMax = coord;
						}
					}
				}
			}

			var x = (xMin + xMax) / 2;
			var y = (yMin + yMax) / 2;

			if (round) {
				x = Math.round(x);
				y = Math.round(y);
			}

			return [x, y];
		};

		return utils;
	}
})(window, window.angular);