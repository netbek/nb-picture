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
				config = extend(true, {}, config, values);
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

	/**
	 * Checks if value is an object created by the Object constructor.
	 *
	 * @param {mixed} value
	 * @returns {Boolean}
	 */
	function isPlainObject (value) {
		return (!!value && typeof value === 'object' && value.constructor === Object
			// Not DOM node
			&& !value.nodeType
			// Not window
			&& value !== value.window);
	}

	/**
	 * Merge the contents of two or more objects together into the first object.
	 *
	 * Shallow copy: extend({}, old)
	 * Deep copy: extend(true, {}, old)
	 *
	 * Based on jQuery (MIT License, (c) 2014 jQuery Foundation, Inc. and other contributors)
	 */
	function extend () {
		var options, key, src, copy, copyIsArray, clone,
			target = arguments[0] || {},
			i = 1,
			length = arguments.length,
			deep = false;

		// Handle a deep copy situation
		if (typeof target === 'boolean') {
			deep = target;

			// Skip the boolean and the target
			target = arguments[i] || {};
			i++;
		}

		// Handle case when target is a string or something (possible in deep copy)
		if (!isPlainObject(target) && !angular.isFunction(target)) {
			target = {};
		}

		// If only one argument is passed
		if (i === length) {
			i--;
		}

		for (; i < length; i++) {
			// Only deal with non-null/undefined values
			if ((options = arguments[i]) != null) {
				// Extend the base object
				for (key in options) {
					src = target[key];
					copy = options[key];

					// Prevent never-ending loop
					if (target === copy) {
						continue;
					}

					// Recurse if we're merging plain objects or arrays
					if (deep && copy && (isPlainObject(copy) || (copyIsArray = angular.isArray(copy)))) {
						if (copyIsArray) {
							copyIsArray = false;
							clone = src && angular.isArray(src) ? src : [];
						}
						else {
							clone = src && isPlainObject(src) ? src : {};
						}

						// Never move original objects, clone them
						target[key] = extend(deep, clone, copy);
					}
					// Don't bring in undefined values
					else if (copy !== undefined) {
						target[key] = copy;
					}
				}
			}
		}

		// Return the modified object
		return target;
	}
})(window, window.angular);