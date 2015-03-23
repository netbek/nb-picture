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

	widgetMapOverlayCanvasController.$inject = ['$scope', '$element', '$attrs', '$timeout', '_', 'nbPictureService', 'PICTURE_SHAPE'];
	function widgetMapOverlayCanvasController ($scope, $element, $attrs, $timeout, _, nbPictureService, PICTURE_SHAPE) {
		/*jshint validthis: true */
		var overlayId = 'canvas'; // {String} Overlay ID as defined in config.
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var deregister = [];
		var canvas, ctx, pictureId;

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

			deregister.push($scope.$watch('$parent.$parent.picture.$$id', function (newValue, oldValue) {
				if (newValue) {
					pictureId = newValue;
				}
			}));

			var onBaseLoad = function () {
				completeWatch();

				if (nbPictureService.onBaseLoad(pictureId, overlayId)) {
					render();
				}
			};
			var completeWatch = angular.noop;

			// Create a one-time watcher for `picture.$$complete`. This is needed
			// because the directive might fire its controller's `init()` after
			// the image has been loaded. If this happened, then the controller
			// would not see the `nbPicture:baseLoad` event.
			(function () {
				completeWatch = $scope.$watch('$parent.$parent.picture.$$complete', function (newValue, oldValue) {
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
				draw(areas);
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
		 * @param {Array} areas
		 */
		function draw (areas) {
			if (!areas.length) {
				return;
			}

			// Set canvas size.
			canvas.width = canvas.scrollWidth;
			canvas.height = canvas.scrollHeight;

			var overlay = nbPictureService.getMapOverlay(pictureId, overlayId);

			if (overlay.fill) {
				ctx.fillStyle = rgba(overlay.fillColor, overlay.fillOpacity);
			}

			// Draw areas.
			_.forEach(areas, function (area) {
				var shape = area.shape;
				var coords = area.$$coords;

				if (shape === PICTURE_SHAPE.CIRCLE) {
					ctx.beginPath();
					ctx.arc(coords[0], coords[1], coords[2], 0, Math.PI * 2, true);
					ctx.closePath();

					if (overlay.fill) {
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

					if (overlay.fill) {
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