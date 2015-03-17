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
			'nb.lodash',
			'nb.picture.templates'
		])
		.filter('join', function () {
			return function (input, delimiter) {
				if (angular.isArray(input)) {
					return input.join(angular.isDefined(delimiter) ? delimiter : ',');
				}
				return '';
			};
		})
		.factory('picturefill', Picturefill)
		.provider('nbPictureConfig', nbPictureConfig)
		.directive('nbPicture', nbPictureDirective)
		.directive('nbPictureOnce', nbPictureOnceDirective)
		.controller('nbPictureController', nbPictureController)
		.directive('nbPictureResize', nbPictureResizeDirective)
		.directive('nbPictureResizeCanvas', nbPictureResizeCanvasDirective)
		.controller('nbPictureResizeCanvasController', nbPictureResizeCanvasController);

	var uniqid = 0;

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
		var defaultMap = {
			name: undefined, // {String} DOM element name.
			areas: [], // {Array} [{shape: String, coords: Array, href: String, alt: String}, ...]
			resize: false, // {Boolean} Whether to resize the map according to the image.
			relCoords: false, // {Boolean} Whether the map has relative (percentage) coordinates.
			highlight: {
				fill: true, // {Boolean} Whether to fill the shape.
				fillColor: 'FF0000', // {String} The color to fill the shape with.
				fillOpacity: 0.5, // {Number} The opacity of the fill (0 = fully transparent, 1 = fully opaque).
				alwaysOn: false // {Boolean} Whether to always show the highlighted areas.
			},
			show: false // {Boolean} Internal.
		};
		var $img, img;

		$scope.complete = false; // {Boolean} Whether image has loaded or failed to load.
		$scope.map = angular.extend({}, defaultMap);
		$scope.highlights = []; // {Array} [{shape: String, coords: Array}, ...] Highlighted map areas.

		/**
		 * Converts the given map coordinates to absolute values if relative.
		 *
		 * @param {Object} map
		 * @returns {Object}
		 */
		function calcMapCoords (map) {
			// If the map has relative (percentage) coordinates, then convert
			// them to absolute values.
			if (map.relCoords) {
				var width = $scope.width();
				var height = $scope.height();

				angular.forEach(map.areas, function (area) {
					var shape = area.shape.toLowerCase();
					var coords = area._coords;
					var i;
					var len = coords.length;
					var arr = new Array(len);

					if (shape === 'circle') {
						for (i = 0; i < len && i < 3; i++) {
							if (i < 2) {
								arr[i] = Math.round(coords[i] * (i % 2 === 0 ? width : height));
							}
							else {
								// @todo Calc radius
							}
						}
					}
					else if (shape === 'poly') {
						for (i = 0; i < len; i++) {
							arr[i] = Math.round(coords[i] * (i % 2 === 0 ? width : height));
						}
					}
					else if (shape === 'rect') {
						for (i = 0; i < len && i < 4; i++) {
							arr[i] = Math.round(coords[i] * (i % 2 === 0 ? width : height));
						}
					}

					area.coords = arr;
				});
			}

			return map;
		}

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

				// Hide the map.
				$timeout(function () {
					$scope.map.show = false;

					$scope.$apply();
				});
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

				// Convert map coordinates to absolute values and show the map.
				$timeout(function () {
					calcMapCoords($scope.map);

					$scope.map.show = true;

					// @todo Add to $scope.highlights

					$scope.$apply();
				});
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
			//
			calcMapCoords($scope.map);
			// @todo Redraw highlight
			showHighlight();

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
			// @todo
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
				map: $attrs.map
			};
		};

		/**
		 *
		 */
		this.init = function () {
			if (flags.initialized) {
				return;
			}

			flags.initialized = true;

			$img = $element.find('img');
			img = $img[0];
		};

		/**
		 *
		 */
		this.destroy = function () {
			angular.forEach(timeouts, function (fn) {
				$timeout.cancel(fn);
			});

			removeWindowEventListeners();

			if ($img) {
				removeImgEventListeners();
			}
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

			// Cancel timeouts and remove event handlers.
			this.destroy();
			// Reset state.
			$scope.complete = false;
			// Add image event handlers.
			addImgEventListeners();

			var map;
			if (angular.isDefined(options.map) && options.map.length) {
				var _map = $scope.$eval(options.map);
				if (!angular.isObject(_map)) {
					throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'map', '!type': 'Object'}));
				}
				map = angular.extend({}, defaultMap, _map);
				map.name = map.name || 'nb-picture-map-' + (++uniqid);
			}
			else {
				map = angular.extend({}, defaultMap);
			}
			map.show = false;

			// Copy the original map area coords so that they can be converted
			// to absolute values later.
			angular.forEach(map.areas, function (area) {
				area._coords = area.coords;
			});

			var picture = {
				sources: [],
				img: {}
			};

			var sources = $scope.$eval(options.sources);
			if (!angular.isArray(sources)) {
				throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'sources', '!type': 'Array'}));
			}

			// Add the sources from large to small.
			for (var il = sources.length, i = il - 1; i >= 0; i--) {
				var source = sources[i];
				var media;

				if (angular.isDefined(source[1]) && source[1] in nbPictureConfig.mediaqueries) {
					media = nbPictureConfig.mediaqueries[source[1]];
				}

				picture.sources.push({
					srcset: source[0],
					media: media
				});
			}

			// Add the default image.
			picture.sources.push({
				srcset: options.defaultSource
			});

			picture.img = {
				srcset: options.defaultSource,
				alt: options.alt,
				usemap: !map.resize && map.name ? '#' + map.name : undefined
			};

			map.img = {
				src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // Transparent 1x1 GIF.
				alt: options.alt,
				usemap: map.name ? '#' + map.name : undefined
			};

			$scope.map = map;
			$scope.picture = picture;

			timeouts.push($timeout(function () {
				picturefill($element);
				// Add window event handlers.
				addWindowEventListeners();
			}));
		};

		/**
		 * Builds a highlight from a given DOM element (area).
		 *
		 * @param {DOM element} elm
		 * @returns {Object}
		 */
		function buildHighlight (elm) {
			return {
				shape: elm.shape,
				coords: elm.coords.split(',')
			};
		}

		/**
		 *
		 * @param {Object} highlight
		 * @returns {Number}
		 */
		function getHighlightIndex (highlight) {
			var index = -1;

			if (!$scope.highlights.length) {
				return index;
			}

			_.forEach($scope.highlights, function (value, key) {
				if (_.isEqual(value, highlight)) {
					index = key;
					return false;
				}
			});

			return index;
		}

		/**
		 *
		 * @param {Event} event
		 */
		$scope.showHighlight = function (event) {
			var highlight = buildHighlight(event.target);
			var index = getHighlightIndex(highlight);

			if (index < 0) {
				$scope.highlights.push(highlight);
			}
		};

		/**
		 *
		 * @param {Event} event
		 */
		$scope.hideHighlight = function (event) {
			var highlight = buildHighlight(event.target);
			var index = getHighlightIndex(highlight);

			if (index > -1) {
				$scope.highlights.splice(index, 1);
			}

//			if (!$scope.map.highlight.alwaysOn) {
//				$scope.highlights = [];
//			}
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
			templateUrl: '../src/templates/nb-picture.html?_=' + Date.now(),
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
			templateUrl: '../src/templates/nb-picture-once.html?_=' + Date.now(),
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

	function nbPictureResizeDirective () {
		return {
			restrict: 'EA',
			replace: true,
			templateUrl: '../src/templates/nb-picture-resize.html?_=' + Date.now(),
			link: function (scope, element, attrs, controller) {
			}
		};
	}

	nbPictureResizeCanvasController.$inject = ['$scope', '$element', '$attrs', '$timeout'];
	function nbPictureResizeCanvasController ($scope, $element, $attrs, $timeout) {
		var flags = {
			initialized: false // {Boolean} Whether init() has been fired.
		};

		var watchers = [];
		var canvas;
		var ctx;
		var cache = {shape: undefined, coords: []};

		/**
		 *
		 */
		function clear () {
			if (!flags.initialized) {
				return;
			}

			// Clear cache.
			cache = {shape: undefined, coords: []};

			// Clear canvas.
			ctx.clearRect(0, 0, canvas.width, canvas.height);
		}

		/**
		 *
		 * @param {String} shape circle, poly, rect
		 * @param {Array} coords
		 */
		function draw (shape, coords) {
			if (!flags.initialized || !coords.length) {
				return;
			}

			cache.shape = shape;
			cache.coords = coords;

			ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';

			if (shape === 'circle') {
				// @todo
			}
			else if (shape === 'poly') {
				// @todo
			}
			else if (shape === 'rect') {
				var x = coords[0];
				var y = coords[1];
				var width = coords[2] - coords[0];
				var height = coords[3] - coords[1];

				ctx.fillRect(x, y, width, height);
			}
		}

		/**
		 *
		 * @param {Number} width
		 * @param {Number} height
		 */
		function resize (width, height) {
			if (!flags.initialized) {
				return;
			}

			// Set canvas size.
			canvas.width = width;
			canvas.height = height;

			// Redraw canvas.
			draw(cache.shape, cache.coords);
		}

		/**
		 *
		 */
		this.init = function () {
			if (flags.initialized) {
				return;
			}

			flags.initialized = true;

			canvas = $element[0];
			ctx = canvas.getContext('2d');

			watchers.push($scope.$watch(function () {
				return {
					width: canvas.scrollWidth,
					height: canvas.scrollHeight
				};
			}, function (newValue, oldValue, scope) {
				if (newValue !== oldValue) {
					resize(newValue.width, newValue.height);
				}
			}, true));

			watchers.push($scope.$watch('highlights', function (newValue, oldValue, scope) {
				if (newValue) {
					if (newValue !== oldValue) {
						console.log(newValue);

//						newValue = angular.extend({}, newValue);
//						draw(newValue.shape, newValue.coords);
					}
				}
				else {
					clear();
				}
			}, true));
		};

		/**
		 *
		 */
		this.destroy = function () {
			angular.forEach(watchers, function (fn) {
				fn();
			});
		};
	}

	function nbPictureResizeCanvasDirective () {
		return {
			restrict: 'EA',
			replace: true,
			controller: 'nbPictureResizeCanvasController',
			templateUrl: '../src/templates/nb-picture-resize-canvas.html?_=' + Date.now(),
			link: function (scope, element, attrs, controller) {
				controller.init();

				scope.$on('$destroy', function () {
					controller.destroy();
				});
			}
		};
	}
})(window, window.angular);