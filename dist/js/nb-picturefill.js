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
		.factory('picturefill', Picturefill)
		.provider('nbPicturefillConfig', nbPicturefillConfig)
		.directive('nbPicturefill', nbPicturefillDirective)
		.directive('nbPicturefillOnce', nbPicturefillOnceDirective)
		.controller('nbPicturefillController', nbPicturefillController);

	Picturefill.$inject = ['$window'];
	function Picturefill ($window) {
		return $window.picturefill;
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
				config = values;
			},
			$get: function () {
				return config;
			}
		};
	}

	nbPicturefillController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPicturefillConfig', 'picturefill'];
	function nbPicturefillController ($scope, $element, $attrs, $timeout, nbI18N, nbPicturefillConfig, picturefill) {
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
				sources: $attrs.sources
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
				srcset: options.defaultSource
			});

			$scope.sources = arr;

			// Set default image.
			$scope.img = {
				srcset: options.defaultSource,
				alt: options.alt
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
angular.module('nb.picturefill.templates', ['templates/nb-picturefill-bindonce.html', 'templates/nb-picturefill-once.html', 'templates/nb-picturefill.html']);

angular.module("templates/nb-picturefill-bindonce.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picturefill-bindonce.html",
    "<picture>\n" +
    "	<!--[if IE 9]><video style=\"display: none;\"><![endif]-->\n" +
    "	<source ng-repeat=\"source in sources\"\n" +
    "			bindonce=\"source\"\n" +
    "			bo-attr\n" +
    "			bo-attr-srcset=\"source.srcset\"\n" +
    "			bo-attr-media=\"source.media\" />\n" +
    "	<!--[if IE 9]></video><![endif]-->\n" +
    "	<img bindonce=\"img\"\n" +
    "		 bo-attr\n" +
    "		 bo-attr-srcset=\"img.srcset\"\n" +
    "		 bo-attr-alt=\"img.alt\" />\n" +
    "</picture>");
}]);

angular.module("templates/nb-picturefill-once.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picturefill-once.html",
    "<picture>\n" +
    "	<!--[if IE 9]><video style=\"display: none;\"><![endif]-->\n" +
    "	<source ng-repeat=\"source in ::sources\"\n" +
    "			ng-srcset=\"{{::source.srcset}}\"\n" +
    "			ng-attr-media=\"{{::source.media}}\" />\n" +
    "	<!--[if IE 9]></video><![endif]-->\n" +
    "	<img ng-srcset=\"{{::img.srcset}}\"\n" +
    "		 ng-attr-alt=\"{{::img.alt}}\" />\n" +
    "</picture>");
}]);

angular.module("templates/nb-picturefill.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picturefill.html",
    "<picture>\n" +
    "	<!--[if IE 9]><video style=\"display: none;\"><![endif]-->\n" +
    "	<source ng-repeat=\"source in sources\"\n" +
    "			ng-srcset=\"{{source.srcset}}\"\n" +
    "			ng-attr-media=\"{{source.media}}\" />\n" +
    "	<!--[if IE 9]></video><![endif]-->\n" +
    "	<img ng-srcset=\"{{img.srcset}}\"\n" +
    "		 ng-attr-alt=\"{{img.alt}}\" />\n" +
    "</picture>");
}]);
