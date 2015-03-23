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
		var pictureId;

		$scope.areas = []; // {Array} Array of highlighted map areas (not necessarily all).

		/**
		 *
		 */
		this.init = function () {
			if (flags.init) {
				return;
			}

			flags.init = true;

			deregister.push($scope.$watch('$parent.$parent.picture.$id', function (newValue, oldValue) {
				if (newValue) {
					pictureId = newValue;
				}
			}));

			var onBaseLoad = function () {
				completeWatch();

				$scope.overlay = nbPictureService.getMapOverlay(pictureId, overlayId);

				if (nbPictureService.onBaseLoad(pictureId, overlayId)) {
					render();
				}
			};
			var completeWatch = angular.noop;

			// Create a one-time watcher for `picture.$complete`. This is needed
			// because the directive might fire its controller's `init()` after
			// the image has been loaded. If this happened, then the controller
			// would not see the `nbPicture:baseLoad` event.
			(function () {
				completeWatch = $scope.$watch('$parent.$parent.picture.$complete', function (newValue, oldValue) {
					if (newValue) {
						onBaseLoad();
					}
				});
				deregister.push(completeWatch);
			})();

			deregister.push($scope.$on('nbPicture:baseLoad', function (e) {
				onBaseLoad();
			}));

			deregister.push($scope.$on('nbPicture:baseError', function (e) {
				completeWatch();

				if (nbPictureService.onBaseError(pictureId, overlayId)) {
					render();
				}
			}));

			deregister.push($scope.$on('nbPicture:resize', function (e) {
				if (nbPictureService.onResize(pictureId, overlayId)) {
					render();
				}
			}));

			deregister.push($scope.$on('nbPicture:clickArea', function (e, event) {
				if (nbPictureService.onClickArea(pictureId, overlayId, event)) {
					render();
				}
			}));

			deregister.push($scope.$on('nbPicture:focusArea', function (e, event, blur) {
				if (nbPictureService.onFocusArea(pictureId, overlayId, event, blur)) {
					render();
				}
			}));

			deregister.push($scope.$on('nbPicture:hoverArea', function (e, event, blur) {
				if (nbPictureService.onHoverArea(pictureId, overlayId, event, blur)) {
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