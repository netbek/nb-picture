/**
 * AngularJS directive for Picturefill (responsive image polyfill)
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.picturefill', [
			'nb.i18n',
			'nb.picturefill.templates'
		])
		.factory('Picturefill', Picturefill)
		.provider('nbPicturefillConfig', nbPicturefillConfig)
		.directive('nbPicturefill', nbPicturefillDirective)
		.directive('nbPicturefillOnce', nbPicturefillOnceDirective)
		.controller('nbPicturefillController', nbPicturefillController)
		.run(runBlock);

	// Invoke at runtime to allow factory to delete global reference.
	runBlock.$inject = ['Picturefill'];
	function runBlock (Picturefill) {
	}

	Picturefill.$inject = ['$window'];
	function Picturefill ($window) {
		var Picturefill = $window.picturefill;
		delete $window.picturefill;
		return Picturefill;
	}

	function nbPicturefillConfig () {
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
				config = window.merge(true, config, values);
			},
			$get: function () {
				return config;
			}
		};
	}

	nbPicturefillController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPicturefillConfig', 'Picturefill'];
	function nbPicturefillController ($scope, $element, $attrs, $timeout, nbI18N, nbPicturefillConfig, Picturefill) {
		var isInitialized = false; // Whether init() has been fired.
		var timeouts = [];
		var $img, img;

		$scope.complete = false; // Whether image has loaded or failed to load.

		function onImgError (event) {
			if (img.src || img.srcset) {
				$scope.complete = true;
				removeImgEventListeners();
			}
		}

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

		this.attrs = function watchAttrs (scope) {
			return {
				alt: $attrs.alt,
				default: $attrs.default,
				sources: $attrs.sources
			};
		};

		this.init = function () {
			if (isInitialized) {
				return;
			}

			isInitialized = true;

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
		 *
		 * @returns {undefined}
		 */
		this.reset = function () {
			if (!isInitialized) {
				return;
			}

			this.destroy();
			$scope.complete = false;
			addImgEventListeners();
		};

		this.update = function (options) {
			if (!isInitialized) {
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

				if (angular.isDefined(source[1]) && source[1] in nbPicturefillConfig.mediaqueries) {
					media = nbPicturefillConfig.mediaqueries[source[1]];
				}

				arr.push({
					srcset: source[0],
					media: media
				});
			}

			// Add default source.
			arr.push({
				srcset: options.default
			});

			$scope.sources = arr;

			// Set default image.
			$scope.img = {
				srcset: options.default,
				alt: options.alt
			};

			timeouts.push($timeout(function () {
				Picturefill($element);
			}));
		};

		$scope.width = function () {
			return $scope.complete && img ? img.scrollWidth : 0;
		};

		$scope.height = function () {
			return $scope.complete && img ? img.scrollHeight : 0;
		};
	}

	function nbPicturefillDirective () {
		return {
			restrict: 'EA',
			replace: true,
			controller: 'nbPicturefillController',
			templateUrl: 'templates/nb-picturefill.html',
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

	function nbPicturefillOnceDirective () {
		return {
			restrict: 'EA',
			replace: true,
			controller: 'nbPicturefillController',
			templateUrl: 'templates/nb-picturefill-once.html',
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