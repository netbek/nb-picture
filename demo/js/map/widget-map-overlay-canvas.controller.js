/**
 * AngularJS responsive image map with custom overlays
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('widget')
		.controller('widgetMapOverlayCanvasController', widgetMapOverlayCanvasController);

	widgetMapOverlayCanvasController.$inject = ['$scope', '$element', '$attrs', '$timeout', '_', 'nbPictureMapOverlayUtils', 'PICTURE_SHAPE'];
	function widgetMapOverlayCanvasController ($scope, $element, $attrs, $timeout, _, utils, PICTURE_SHAPE) {
		/*jshint validthis: true */
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var deregister = [];
		var canvas, ctx;

		$scope.highlights = []; // {Array} Array of highlighted map areas (not necessarily all).

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

			/**
			 * Assigns new highlights and renders if highlights have been changed.
			 *
			 * @param {Object} result
			 */
			function fn (result) {
				if (result.dirty) {
					$scope.highlights = result.newValue;
					render();
				}
			}

			// If the base image has already been loaded, then set the initial highlights.
			if ($scope.complete) {
				fn(utils.onBaseLoad($scope.map.overlays.canvas, $scope.map.areas, $scope.highlights));
			}

			deregister.push($scope.$on('nbPicture:baseLoad', function () {
				fn(utils.onBaseLoad($scope.map.overlays.canvas, $scope.map.areas, $scope.highlights));
			}));
			deregister.push($scope.$on('nbPicture:baseError', function () {
				fn(utils.onBaseError($scope.map.overlays.canvas, $scope.map.areas, $scope.highlights));
			}));
			deregister.push($scope.$on('nbPicture:resize', function () {
				fn(utils.onResize($scope.map.overlays.canvas, $scope.map.areas, $scope.highlights));
			}));
			deregister.push($scope.$on('nbPicture:clickArea', function (e, event) {
				fn(utils.onClickArea($scope.map.overlays.canvas, $scope.map.areas, $scope.highlights, event));
			}));
			deregister.push($scope.$on('nbPicture:focusArea', function (e, event, blur) {
				fn(utils.onFocusArea($scope.map.overlays.canvas, $scope.map.areas, $scope.highlights, event, blur));
			}));
			deregister.push($scope.$on('nbPicture:hoverArea', function (e, event, blur) {
				fn(utils.onHoverArea($scope.map.overlays.canvas, $scope.map.areas, $scope.highlights, event, blur));
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
		function render () {
			if ($scope.highlights.length) {
				draw($scope.highlights);
			}
			else {
				clear();
			}
		}

		/**
		 *
		 */
		function clear () {
			// Clear canvas.
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}

		/**
		 *
		 * @param {Array} highlights
		 */
		function draw (highlights) {
			if (!highlights.length) {
				return;
			}

			// Set canvas size.
			canvas.width = canvas.scrollWidth;
			canvas.height = canvas.scrollHeight;

			var config = $scope.map.overlays.canvas;

			if (config.fill) {
				ctx.fillStyle = rgba(config.fillColor, config.fillOpacity);
			}

			// Draw areas.
			_.forEach(highlights, function (area) {
				var shape = area.shape;
				var coords = area.$coords;

				if (shape === PICTURE_SHAPE.CIRCLE) {
					ctx.beginPath();
					ctx.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, true);
					ctx.closePath();

					if (config.fill) {
						ctx.fill();
					}
				}
				else if (shape === PICTURE_SHAPE.POLYGON) {
					ctx.beginPath();

					for (var i = 0, il = coords.length; i < il; i += 2) {
						if (i === 0) {
							ctx.moveTo(coords[i], coords[i + 1]);
						}
						else {
							ctx.lineTo(coords[i], coords[i + 1]);
						}
					}

					ctx.closePath();

					if (config.fill) {
						ctx.fill();
					}
				}
				else if (shape === PICTURE_SHAPE.RECTANGLE) {
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