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
		.controller('nbPictureController', nbPictureController);

	nbPictureController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill', '_', 'nbPictureService'];
	function nbPictureController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill, _, nbPictureService) {
		/*jshint validthis: true */
		var pictureId;
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var timeouts = [];
		var $img, img, complete = false;

		/**
		 * Returns width of image.
		 *
		 * @returns {Number}
		 */
		$scope.width = function () {
			return complete && img ? img.scrollWidth : 0;
		};

		/**
		 * Returns height of image.
		 *
		 * @returns {Number}
		 */
		$scope.height = function () {
			return complete && img ? img.scrollHeight : 0;
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
				alt: $attrs.alt
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

			if ($img) {
				removeImgEventListeners();
			}

			// Reset state.
			complete = false;
			nbPictureService.setPictureComplete(pictureId, complete);

			// Add image event handlers.
			addImgEventListeners();

			options.sources = $scope.$eval(options.sources);
			nbPictureService.setPicture(pictureId, options);

			// Assign data to scope.
			$scope.picture = nbPictureService.getPicture(pictureId);

			timeouts.push($timeout(function () {
				// Run picture polyfill.
				picturefill($element);
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
				complete = true;
				nbPictureService.setPictureComplete(pictureId, complete);

				removeImgEventListeners();
			}
		}

		/**
		 * Callback fired after `load` and `readystatechange` events.
		 *
		 * @param {Event} event
		 */
		function onImgLoad (event) {
			if (isImgComplete(img)) {
				complete = true;
				nbPictureService.setPictureComplete(pictureId, complete);

				removeImgEventListeners();
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
	}
})(window, window.angular);