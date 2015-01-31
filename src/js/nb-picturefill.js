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
			'pasvaz.bindonce'
		])
		.factory('Picturefill', Picturefill)
		.provider('nbPicturefillConfig', nbPicturefillConfig)
		.directive('nbPicturefill', nbPicturefillDirective)
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

	nbPicturefillDirective.$inject = ['$timeout', 'nbI18N', 'nbPicturefillConfig', 'Picturefill'];
	function nbPicturefillDirective ($timeout, nbI18N, nbPicturefillConfig, Picturefill) {
		return {
			restrict: 'A',
			replace: true,
			template: '<picture>\n\
				<!--[if IE 9]><video style="display: none;"><![endif]-->\n\
				<source ng-repeat="source in sources" bindonce="source" bo-attr bo-attr-srcset="source.srcset" bo-attr-media="source.media" />\n\
				<!--[if IE 9]></video><![endif]-->\n\
				<img bindonce="img" bo-attr bo-attr-srcset="img.srcset" bo-attr-alt="img.alt" />\n\
			</picture>',
			link: function (scope, element, attrs) {
				var isInitialized = false; // Whether init() has been fired.
				var defaultRaw, sourcesRaw, altRaw;
				var timeouts = [];
				var $img = element.find('img');
				var img = $img[0];

				scope.complete = false; // Whether image has loaded or failed to load.

				function init () {
					if (isInitialized || !defaultRaw || !sourcesRaw) {
						return;
					}

					isInitialized = true;

					var sources = scope.$eval(sourcesRaw);
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
						srcset: defaultRaw
					});

					scope.sources = arr;

					// Set default image.
					scope.img = {
						srcset: defaultRaw,
						alt: altRaw
					};

					timeouts.push($timeout(function () {
						Picturefill(element);
					}));
				}

				function onError (event) {
					if (img.src || img.srcset) {
						scope.complete = true;
					}
				}

				function onLoad (event) {
					var readyState = img.readyState;
					if ((img.src || img.srcset) && (img.complete || readyState == 'complete' || readyState == 'loaded' || readyState == 4)) {
						scope.complete = true;
					}
				}

				$img.on('error', onError);
				$img.on('load', onLoad);
				$img.on('readystatechange', onLoad);

				scope.width = function () {
					return scope.complete ? img.scrollWidth : 0;
				};

				scope.height = function () {
					return scope.complete ? img.scrollHeight : 0;
				};

				scope.$on('$destroy', function () {
					angular.forEach(timeouts, function (fn) {
						$timeout.cancel(fn);
					});

					$img.off('error', onError);
					$img.off('load', onLoad);
					$img.off('readystatechange', onLoad);
				});

				attrs.$observe('alt', function (value) {
					if (value) {
						altRaw = value;
						init();
					}
				});

				attrs.$observe('default', function (value) {
					if (value) {
						defaultRaw = value;
						init();
					}
				});

				attrs.$observe('sources', function (value) {
					if (value) {
						sourcesRaw = value;
						init();
					}
				});
			}
		};
	}
})(window, window.angular);