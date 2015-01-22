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
				var timeouts = [];
				var img = element.find('img');
				var sources = [];

				if (angular.isDefined(attrs.sources)) {
					sources = scope.$eval(attrs.sources);

					if (!angular.isArray(sources)) {
						throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'nb-picturefill-sources', '!type': 'Array'}));
					}
				}

				scope.sources = [];

				// Add sources, large to small.
				for (var il = sources.length, i = il - 1; i >= 0; i--) {
					var source = sources[i];
					var media;

					if (angular.isDefined(source[1]) && source[1] in nbPicturefillConfig.mediaqueries) {
						media = nbPicturefillConfig.mediaqueries[source[1]];
					}

					scope.sources.push({
						srcset: source[0],
						media: media
					});
				}

				// Add default source.
				scope.sources.push({
					srcset: attrs.default
				});

				// Set default image.
				scope.img = {
					srcset: attrs.default,
					alt: attrs.alt
				};

				scope.isLoaded = function () {
					var complete = img.prop('complete');
					var readyState = img.prop('readyState');
					return (complete || readyState == 'complete' || readyState == 'loaded');
				};

				timeouts.push($timeout(function () {
					Picturefill(element);
				}));

				scope.$on('$destroy', function () {
					angular.forEach(timeouts, function (fn) {
						$timeout.cancel(fn);
					});
				});
			}
		};
	}
})(window, window.angular);