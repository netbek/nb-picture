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

	widgetMapOverlayMarkersController.$inject = ['$scope', '$element', '$attrs', '$timeout', '_', 'nbPictureUtilService', 'nbPictureService', 'PICTURE_SHAPE'];
	function widgetMapOverlayMarkersController ($scope, $element, $attrs, $timeout, _, nbPictureUtilService, nbPictureService, PICTURE_SHAPE) {
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

			deregister.push($scope.$on('nbPicture:baseLoad', function (e, pictureId) {
				$scope.overlay = nbPictureService.getMapOverlay(pictureId, overlayId);

				if (nbPictureService.onBaseLoad(pictureId, overlayId)) {
					render(pictureId);
				}
			}));
			deregister.push($scope.$on('nbPicture:baseError', function (e, pictureId) {
				if (nbPictureService.onBaseError(pictureId, overlayId)) {
					render(pictureId);
				}
			}));
			deregister.push($scope.$on('nbPicture:resize', function (e, pictureId) {
				if (nbPictureService.onResize(pictureId, overlayId)) {
					render(pictureId);
				}
			}));
			deregister.push($scope.$on('nbPicture:clickArea', function (e, pictureId, event) {
				if (nbPictureService.onClickArea(pictureId, overlayId, event)) {
					render(pictureId);
				}
			}));
			deregister.push($scope.$on('nbPicture:focusArea', function (e, pictureId, event, blur) {
				if (nbPictureService.onFocusArea(pictureId, overlayId, event, blur)) {
					render(pictureId);
				}
			}));
			deregister.push($scope.$on('nbPicture:hoverArea', function (e, pictureId, event, blur) {
				if (nbPictureService.onHoverArea(pictureId, overlayId, event, blur)) {
					render(pictureId);
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
		 * @param {String} pictureId
		 */
		function render (pictureId) {
			var areas = nbPictureService.getMapOverlayAreas(pictureId, overlayId);

			if (areas.length) {
				_.forEach(areas, function (area, index) {
					var center = nbPictureUtilService.getCenter(area.shape, area.$coords, true);
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