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

	widgetMapOverlayMarkersController.$inject = ['$scope', '$element', '$attrs', '$timeout', '_', 'nbPictureUtils', 'nbPictureService', 'PICTURE_SHAPE'];
	function widgetMapOverlayMarkersController ($scope, $element, $attrs, $timeout, _, nbPictureUtils, nbPictureService, PICTURE_SHAPE) {
		/*jshint validthis: true */
		var overlayId = 'markers'; // {String} Overlay ID as defined in config.
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var deregister = [];

		$scope.areas = []; // {Array} Array of highlighted map areas (not necessarily all).

		/**
		 *
		 */
		this.init = function () {
			if (flags.init) {
				return;
			}

			flags.init = true;

			// If the base image has already been loaded, then set the initial highlights.
			if ($scope.complete) {
				if (nbPictureService.onBaseLoad($scope.picture.$id, overlayId)) {
					render();
				}
			}

			deregister.push($scope.$on('nbPicture:baseLoad', function () {
				if (nbPictureService.onBaseLoad($scope.picture.$id, overlayId)) {
					render();
				}
			}));
			deregister.push($scope.$on('nbPicture:baseError', function () {
				if (nbPictureService.onBaseError($scope.picture.$id, overlayId)) {
					render();
				}
			}));
			deregister.push($scope.$on('nbPicture:resize', function () {
				if (nbPictureService.onResize($scope.picture.$id, overlayId)) {
					render();
				}
			}));
			deregister.push($scope.$on('nbPicture:clickArea', function (e, event) {
				if (nbPictureService.onClickArea($scope.picture.$id, overlayId, event)) {
					render();
				}
			}));
			deregister.push($scope.$on('nbPicture:focusArea', function (e, event, blur) {
				if (nbPictureService.onFocusArea($scope.picture.$id, overlayId, event, blur)) {
					render();
				}
			}));
			deregister.push($scope.$on('nbPicture:hoverArea', function (e, event, blur) {
				if (nbPictureService.onHoverArea($scope.picture.$id, overlayId, event, blur)) {
					render();
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
		function render () {
			var pictureId = $scope.picture.$id;
			var areas = nbPictureService.getMapOverlayAreas(pictureId, overlayId);

			if (areas.length) {
				_.forEach(areas, function (area, index) {
					var center = nbPictureUtils.getCenter(area.shape, area.$coords, true);
					areas[index].style = {
						top: center[1] + 'px',
						left: center[0] + 'px'
					};
				});
			}

			$scope.areas = areas;
		}
	}
})(window, window.angular);