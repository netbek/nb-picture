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
		.controller('nbPictureMapController', nbPictureMapController);

	nbPictureMapController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill', '_', 'nbPictureService', 'PICTURE_SHAPE'];
	function nbPictureMapController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill, _, nbPictureService, PICTURE_SHAPE) {
		/*jshint validthis: true */
		var pictureId;
		var flags = {
			init: false, // {Boolean} Whether init() has been fired.
			touch: false // {Boolean} Whether the device supports touch events.
		};
		var timeouts = [];
		var $img, img;

		$scope.complete = false; // {Boolean} Whether the image has loaded or failed to load.

		/**
		 *
		 * @param {Event} event
		 */
		$scope.clickArea = function (event) {
			var locationHref = window.location.href;
			var aHref = event.target.href;

			if (aHref.indexOf(locationHref) === 0) {
				aHref = aHref.slice(locationHref.length);
			}

			// If default href, then stop event.
			if (aHref === '#') {
				event.preventDefault();
			}

			$scope.$broadcast('nbPicture:clickArea', pictureId, event);
		};

		/**
		 *
		 * @param {Event} event
		 * @param {Boolean} blur
		 */
		$scope.focusArea = function (event, blur) {
			$scope.$broadcast('nbPicture:focusArea', pictureId, event, blur);
		};

		/**
		 *
		 * @param {Event} event
		 * @param {Boolean} blur
		 */
		$scope.hoverArea = function (event, blur) {
			$scope.$broadcast('nbPicture:hoverArea', pictureId, event, blur);
		};

		/**
		 * Returns width of image.
		 *
		 * @returns {Number}
		 */
		$scope.width = function () {
			return $scope.complete && img ? img.scrollWidth : 0;
		};

		/**
		 * Returns height of image.
		 *
		 * @returns {Number}
		 */
		$scope.height = function () {
			return $scope.complete && img ? img.scrollHeight : 0;
		};

		/**
		 *
		 *
		 * @param {Scope} scope
		 * @returns {Object}
		 */
		this.attrs = function watchAttrs (scope) {
			return {
				defaultSource: $attrs.defaultSource,
				sources: $attrs.sources,
				alt: $attrs.alt,
				map: $attrs.map
			};
		};

		/**
		 *
		 */
		this.init = function () {
			if (flags.init) {
				return;
			}

			flags.init = true;

			pictureId = nbPictureService.initPicture();

			$img = $element.find('img');
			img = $img[0];
		};

		/**
		 *
		 */
		this.destroy = function () {
			_.forEach(timeouts, function (fn) {
				$timeout.cancel(fn);
			});

			removeWindowEventListeners();

			if ($img) {
				removeImgEventListeners();
			}

			nbPictureService.destroyPicture(pictureId);
		};

		/**
		 *
		 *
		 * @param {Object} options
		 */
		this.update = function (options) {
			if (!flags.init) {
				return;
			}

			_.forEach(timeouts, function (fn) {
				$timeout.cancel(fn);
			});

			removeWindowEventListeners();

			if ($img) {
				removeImgEventListeners();
			}

			// Reset state.
			$scope.complete = false;

			// Add image event handlers.
			addImgEventListeners();

			options.map = $scope.$eval(options.map);
			nbPictureService.setMap(pictureId, options);

			options.sources = $scope.$eval(options.sources);
			nbPictureService.setPicture(pictureId, options);

			// Assign data to scope.
			$scope.map = nbPictureService.getMap(pictureId);
			$scope.picture = nbPictureService.getPicture(pictureId);

			timeouts.push($timeout(function () {
				// Run picture polyfill.
				picturefill($element);

				// Add window event handlers.
				addWindowEventListeners();
			}));
		};

		/**
		 * Checks if a given image has loaded.
		 *
		 * @param {DOM element} img
		 * @returns {Boolean}
		 */
		function isImgComplete (img) {
			var readyState = img.readyState;
			if ((img.src || img.srcset) && (img.complete || readyState == 'complete' || readyState == 'loaded' || readyState == 4)) {
				return true;
			}
			return false;
		}

		/**
		 * Callback fired after `error` event.
		 *
		 * @param {Event} event
		 */
		function onImgError (event) {
			if (img.src || img.srcset) {
				$scope.complete = true;

				removeImgEventListeners();

				$scope.$broadcast('nbPicture:baseError', pictureId);
			}
		}

		/**
		 * Callback fired after `load` and `readystatechange` events.
		 *
		 * @param {Event} event
		 */
		function onImgLoad (event) {
			if (isImgComplete(img)) {
				$scope.complete = true;

				removeImgEventListeners();

				nbPictureService.resizeMap(pictureId, $scope.width(), $scope.height(), true);

				$scope.$broadcast('nbPicture:baseLoad', pictureId);

				$scope.$apply();
			}
		}

		/**
		 * Adds image event handlers.
		 */
		function addImgEventListeners () {
			$img.on('error', onImgError);
			$img.on('load', onImgLoad);
			$img.on('readystatechange', onImgLoad);
		}

		/**
		 * Removes image event handlers.
		 */
		function removeImgEventListeners () {
			$img.off('error', onImgError);
			$img.off('load', onImgLoad);
			$img.off('readystatechange', onImgLoad);
		}

		/**
		 * Callback fired after window `resize` event.
		 *
		 * @param {Event} event
		 */
		function onWindowResize (event) {
			nbPictureService.resizeMap(pictureId, $scope.width(), $scope.height(), true);

			$scope.$broadcast('nbPicture:resize', pictureId);

			$scope.$apply();
		}

		/**
		 * Adds window event handlers.
		 */
		function addWindowEventListeners () {
			if (window.addEventListener) {
				window.addEventListener('resize', onWindowResize, false);
			}
			else if (window.attachEvent) {
				window.attachEvent('onresize', onWindowResize);
			}
		}

		/**
		 * Removes window event handlers.
		 */
		function removeWindowEventListeners () {
			if (window.removeEventListener) {
				window.removeEventListener('resize', onWindowResize, false);
			}
			else if (window.detachEvent) {
				window.detachEvent('onresize', onWindowResize);
			}
		}
	}
})(window, window.angular);