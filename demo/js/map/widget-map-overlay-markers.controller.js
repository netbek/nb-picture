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

	widgetMapOverlayMarkersController.$inject = ['$scope', '$element', '$attrs', '$timeout', '_', 'nbPictureUtils', 'nbPictureMapOverlayUtils', 'nbPictureService', 'PICTURE_SHAPE'];
	function widgetMapOverlayMarkersController ($scope, $element, $attrs, $timeout, _, nbPictureUtils, utils, nbPictureService, PICTURE_SHAPE) {
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

			/**
			 * Assigns new highlights and renders if highlights have been changed.
			 *
			 * @param {Object} result
			 */
			function fn (result) {
				if (result.dirty) {
					var pictureId = $scope.picture.$id;
					nbPictureService.setMapOverlayAreas(pictureId, overlayId, result.newValue);
					render();
				}
			}

			// If the base image has already been loaded, then set the initial highlights.
			if ($scope.complete) {
				var config = $scope.map.overlays[overlayId];
				var pictureId = $scope.picture.$id;
				var areas = nbPictureService.getMapAreas(pictureId);
				var highs = nbPictureService.getMapOverlayAreas(pictureId, overlayId);
				fn(utils.onBaseLoad(config, areas, highs));
			}

			deregister.push($scope.$on('nbPicture:baseLoad', function () {
				var config = $scope.map.overlays[overlayId];
				var pictureId = $scope.picture.$id;
				var areas = nbPictureService.getMapAreas(pictureId);
				var highs = nbPictureService.getMapOverlayAreas(pictureId, overlayId);
				fn(utils.onBaseLoad(config, areas, highs));
			}));
			deregister.push($scope.$on('nbPicture:baseError', function () {
				var config = $scope.map.overlays[overlayId];
				var pictureId = $scope.picture.$id;
				var areas = nbPictureService.getMapAreas(pictureId);
				var highs = nbPictureService.getMapOverlayAreas(pictureId, overlayId);
				fn(utils.onBaseError(config, areas, highs));
			}));
			deregister.push($scope.$on('nbPicture:resize', function () {
				var config = $scope.map.overlays[overlayId];
				var pictureId = $scope.picture.$id;
				var areas = nbPictureService.getMapAreas(pictureId);
				var highs = nbPictureService.getMapOverlayAreas(pictureId, overlayId);
				fn(utils.onResize(config, areas, highs));
			}));
			deregister.push($scope.$on('nbPicture:clickArea', function (e, event) {
				var config = $scope.map.overlays[overlayId];
				var pictureId = $scope.picture.$id;
				var areas = nbPictureService.getMapAreas(pictureId);
				var highs = nbPictureService.getMapOverlayAreas(pictureId, overlayId);
				fn(utils.onClickArea(config, areas, highs, event));
			}));
			deregister.push($scope.$on('nbPicture:focusArea', function (e, event, blur) {
				var config = $scope.map.overlays[overlayId];
				var pictureId = $scope.picture.$id;
				var areas = nbPictureService.getMapAreas(pictureId);
				var highs = nbPictureService.getMapOverlayAreas(pictureId, overlayId);
				fn(utils.onFocusArea(config, areas, highs, event, blur));
			}));
			deregister.push($scope.$on('nbPicture:hoverArea', function (e, event, blur) {
				var config = $scope.map.overlays[overlayId];
				var pictureId = $scope.picture.$id;
				var areas = nbPictureService.getMapAreas(pictureId);
				var highs = nbPictureService.getMapOverlayAreas(pictureId, overlayId);
				fn(utils.onHoverArea(config, areas, highs, event, blur));
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