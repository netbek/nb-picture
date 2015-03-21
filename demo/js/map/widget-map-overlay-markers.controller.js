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
		.module('nb.picture')
		.controller('widgetMapOverlayMarkersController', widgetMapOverlayMarkersController);

	widgetMapOverlayMarkersController.$inject = ['$scope', '$element', '$attrs', '$timeout', '_', 'nbPictureMapOverlayUtils'];
	function widgetMapOverlayMarkersController ($scope, $element, $attrs, $timeout, _, utils) {
		/*jshint validthis: true */
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var deregister = [];

		$scope.highlights = []; // {Array} Array of highlighted map areas (not necessarily all).

		/**
		 *
		 */
		this.init = function () {
			if (flags.init) {
				return;
			}

			flags.init = true;

			/**
			 * Assigns new highlights and renders if highlights have been changed.
			 *
			 * @param {Object} result
			 */
			function fn (result) {
				if (result.dirty) {
					// Calc marker position.
					_.forEach(result.newValue, function (area, index) {
						var x = 0, y = 0;

						if (area.shape === 'circle') {
							x = area.$coords[0];
							y = area.$coords[1];
						}
						else if (area.shape === 'poly' || area.shape === 'rect') {
							var center = getPolyCenter(area.$coords, true);
							x = center[0];
							y = center[1];
						}

						result.newValue[index].style = {
							top: y + 'px',
							left: x + 'px'
						};
					});

					$scope.highlights = result.newValue;
				}
			}

			// If the base image has already been loaded, then set the initial highlights.
			if ($scope.complete) {
				fn(utils.onBaseLoad($scope.map.overlays.markers, $scope.map.areas, $scope.highlights));
			}

			deregister.push($scope.$on('nbPicture:baseLoad', function () {
				fn(utils.onBaseLoad($scope.map.overlays.markers, $scope.map.areas, $scope.highlights));
			}));
			deregister.push($scope.$on('nbPicture:baseError', function () {
				fn(utils.onBaseError($scope.map.overlays.markers, $scope.map.areas, $scope.highlights));
			}));
			deregister.push($scope.$on('nbPicture:resize', function () {
				fn(utils.onResize($scope.map.overlays.markers, $scope.map.areas, $scope.highlights));
			}));
			deregister.push($scope.$on('nbPicture:clickArea', function (e, event) {
				fn(utils.onClickArea($scope.map.overlays.markers, $scope.map.areas, $scope.highlights, event));
			}));
			deregister.push($scope.$on('nbPicture:focusArea', function (e, event, blur) {
				fn(utils.onFocusArea($scope.map.overlays.markers, $scope.map.areas, $scope.highlights, event, blur));
			}));
			deregister.push($scope.$on('nbPicture:hoverArea', function (e, event, blur) {
				fn(utils.onHoverArea($scope.map.overlays.markers, $scope.map.areas, $scope.highlights, event, blur));
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
		 * Calculates the center of a polygon's bounds.
		 *
		 * @param {Array} coords
		 * @param {Boolean} round
		 * @returns {Array}
		 */
		function getPolyCenter (coords, round) {
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
		}
	}
})(window, window.angular);