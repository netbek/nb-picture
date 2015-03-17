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
		.controller('nbPictureResizeCanvasController', nbPictureResizeCanvasController);

	nbPictureResizeCanvasController.$inject = ['$scope', '$element', '$attrs', '$timeout'];
	function nbPictureResizeCanvasController ($scope, $element, $attrs, $timeout) {
		/*jshint validthis: true */
		var flags = {
			init: false, // {Boolean} Whether init() has been fired.
			resize: false // {Boolean} Whether resize() has been fired.
		};
		var deregister = [];
		var cache = {
			areas: []
		}; // {Object} draw() cache.
		var canvas, ctx;

		/**
		 *
		 */
		this.init = function () {
			if (flags.init) {
				return;
			}

			flags.init = true;

			canvas = $element[0];
			ctx = canvas.getContext('2d');

			draw($scope.highlights);

			deregister.push($scope.$on('nbPicture:draw', function () {
				if ($scope.highlights.length) {
					draw($scope.highlights);
				}
				else {
					clear();
				}
			}));
		};

		/**
		 *
		 */
		this.destroy = function () {
			_.forEach(deregister, function (fn) {
				fn();
			});
		};

		/**
		 *
		 */
		function clear () {
			if (!flags.init) {
				return;
			}

			// Clear cache.
			cache.areas = [];

			// Clear canvas.
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}

		/**
		 *
		 * @param {Array} areas
		 */
		function draw (areas) {
			if (!flags.init) {
				return;
			}

			// Store cache.
			cache.areas = areas;

			// Set canvas size.
			canvas.width = canvas.scrollWidth;
			canvas.height = canvas.scrollHeight;

			if (!areas.length) {
				return;
			}

			var config = $scope.map.highlight;

			if (config.fill) {
				ctx.fillStyle = rgba(config.fillColor, config.fillOpacity);
			}

			// Draw areas.
			_.forEach(areas, function (area) {
				var shape = area.shape;
				var coords = area.$coords;

				if (shape === 'circle') {
					// @todo
				}
				else if (shape === 'poly') {
					// @todo
				}
				else if (shape === 'rect') {
					var x = coords[0];
					var y = coords[1];
					var width = coords[2] - coords[0];
					var height = coords[3] - coords[1];

					ctx.fillRect(x, y, width, height);
				}
			});
		}

		/**
		 *
		 * @param {String} hex
		 * @returns {Number}
		 */
		function hexToDec (hex) {
			return Math.max(0, Math.min(parseInt(hex, 16), 255));
		}

		/**
		 *
		 * @param {String} color
		 * @param {mixed} opacity
		 * @returns {String}
		 */
		function rgba (color, opacity) {
			return 'rgba(' + hexToDec(color.slice(0, 2)) + ',' + hexToDec(color.slice(2, 4)) + ',' + hexToDec(color.slice(4, 6)) + ',' + opacity + ')';
		}
	}
})(window, window.angular);