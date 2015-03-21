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
		.controller('widgetMapOverlayMarkersController', widgetMapOverlayMarkersController);

	widgetMapOverlayMarkersController.$inject = ['$scope', '$element', '$attrs', '$timeout', '_', 'nbPictureUtils', 'nbPictureMapOverlayUtils'];
	function widgetMapOverlayMarkersController ($scope, $element, $attrs, $timeout, _, nbPictureUtils, utils) {
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
							var center = nbPictureUtils.getCenter(area.$coords, true);
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
	}
})(window, window.angular);