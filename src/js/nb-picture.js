/**
 * AngularJS directive for responsive images
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.picture', [
			'nb.i18n',
			'nb.picture.templates'
		])
		.factory('picturefill', Picturefill)
		.provider('nbPictureConfig', nbPictureConfig)
		.directive('nbPicture', nbPictureDirective)
		.directive('nbPictureOnce', nbPictureOnceDirective)
		.controller('nbPictureController', nbPictureController);

	Picturefill.$inject = ['$window'];
	function Picturefill ($window) {
		return $window.picturefill;
	}

	function nbPictureConfig () {
		var config = {
			mediaqueries: {
				small: 'only screen and (min-width: 0px)',
				medium: 'only screen and (min-width: 640px)',
				large: 'only screen and (min-width: 992px)',
				xlarge: 'only screen and (min-width: 1440px)',
				xxlarge: 'only screen and (min-width: 1920px)',
				landscape: 'only screen and (orientation: landscape)',
				portrait: 'only screen and (orientation: portrait)',
				// http://css-tricks.com/snippets/css/retina-display-media-query
				retina: 'only screen and (-webkit-min-device-pixel-ratio: 2), ' +
					'only screen and (min--moz-device-pixel-ratio: 2), ' +
					'only screen and (-o-min-device-pixel-ratio: 2/1), ' +
					'only screen and (min-device-pixel-ratio: 2), ' +
					'only screen and (min-resolution: 192dpi), ' +
					'only screen and (min-resolution: 2dppx)'
			}
		};
		return {
			set: function (values) {
				config = values;
			},
			$get: function () {
				return config;
			}
		};
	}

	nbPictureController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill'];
	function nbPictureController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill) {
		/*jshint validthis: true */
		var flags = {
			initialized: false // {Boolean} Whether init() has been fired.
		};
		var timeouts = [];
		var $img, img;

		$scope.complete = false; // {Boolean} Whether image has loaded or failed to load.

		/**
		 * Callback fired after `error` event.
		 *
		 * @param {Event} event
		 */
		function onImgError (event) {
			if (img.src || img.srcset) {
				$scope.complete = true;
				removeImgEventListeners();
			}
		}

		/**
		 * Callback fired after `load` and `readystatechange` events.
		 *
		 * @param {Event} event
		 */
		function onImgLoad (event) {
			var readyState = img.readyState;
			if ((img.src || img.srcset) && (img.complete || readyState == 'complete' || readyState == 'loaded' || readyState == 4)) {
				$scope.complete = true;
				removeImgEventListeners();
			}
		}

		function addImgEventListeners () {
			$img.on('error', onImgError);
			$img.on('load', onImgLoad);
			$img.on('readystatechange', onImgLoad);
		}

		function removeImgEventListeners () {
			$img.off('error', onImgError);
			$img.off('load', onImgLoad);
			$img.off('readystatechange', onImgLoad);
		}

		/**
		 *
		 *
		 * @param {Scope} scope
		 * @returns {Object}
		 */
		this.attrs = function watchAttrs (scope) {
			return {
				alt: $attrs.alt,
				defaultSource: $attrs.defaultSource,
				sources: $attrs.sources,
				usemap: $attrs.usemap
			};
		};

		this.init = function () {
			if (flags.initialized) {
				return;
			}

			flags.initialized = true;

			$img = $element.find('img');
			img = $img[0];
		};

		this.destroy = function () {
			angular.forEach(timeouts, function (fn) {
				$timeout.cancel(fn);
			});

			if ($img) {
				removeImgEventListeners();
			}
		};

		/**
		 * Cancels timeouts, resets state, and adds image event handlers.
		 */
		this.reset = function () {
			if (!flags.initialized) {
				return;
			}

			this.destroy();
			$scope.complete = false;
			addImgEventListeners();
		};

		/**
		 *
		 *
		 * @param {Object} options
		 */
		this.update = function (options) {
			if (!flags.initialized) {
				return;
			}

			this.reset();

			var sources = $scope.$eval(options.sources);
			var arr = [];

			if (!angular.isArray(sources)) {
				throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'sources', '!type': 'Array'}));
			}

			// Add sources, large to small.
			for (var il = sources.length, i = il - 1; i >= 0; i--) {
				var source = sources[i];
				var media;

				if (angular.isDefined(source[1]) && source[1] in nbPictureConfig.mediaqueries) {
					media = nbPictureConfig.mediaqueries[source[1]];
				}

				arr.push({
					srcset: source[0],
					media: media
				});
			}

			// Add default source.
			arr.push({
				srcset: options.defaultSource
			});

			$scope.sources = arr;

			// Set default image.
			$scope.img = {
				srcset: options.defaultSource,
				alt: options.alt,
				usemap: options.usemap
			};

			timeouts.push($timeout(function () {
				picturefill($element);
			}));
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
	}

	function nbPictureDirective () {
		return {
			restrict: 'EA',
			replace: true,
			controller: 'nbPictureController',
			templateUrl: 'templates/nb-picture.html',
			link: function (scope, element, attrs, controller) {
				controller.init();

				var watch = scope.$watch(controller.attrs, function (newValue, oldValue, scope) {
					controller.update(newValue);
				}, true);

				scope.$on('$destroy', function () {
					watch();
					controller.destroy();
				});
			}
		};
	}

	function nbPictureOnceDirective () {
		return {
			restrict: 'EA',
			replace: true,
			controller: 'nbPictureController',
			templateUrl: 'templates/nb-picture-once.html',
			link: function (scope, element, attrs, controller) {
				controller.init();

				var watch = scope.$watch(controller.attrs, function (newValue, oldValue, scope) {
					controller.update(newValue);
					watch();
				}, true);

				scope.$on('$destroy', function () {
					watch();
					controller.destroy();
				});
			}
		};
	}
})(window, window.angular);