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

	var uniqid = 0;

	nbPictureMapController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill', '_', 'PICTURE_SHAPE'];
	function nbPictureMapController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill, _, PICTURE_SHAPE) {
		/*jshint validthis: true */
		var flags = {
			init: false, // {Boolean} Whether init() has been fired.
			touch: false // {Boolean} Whether the device supports touch events.
		};
		var timeouts = [];
		var defaultMap = {
			$show: false, // {Boolean} Internal. Whether to show the map.
			name: undefined, // {String} `name` attribute of map DOM element.
			areas: [], // {Array} Array of map areas. See `defaultArea`.
			resize: false, // {Boolean} Whether to resize the map areas according to the image size.
			relCoords: false, // {Boolean} Whether the map has relative (percentage) coordinates.
			overlays: {} // {Object} Overlay configs keyed by ID.
		};
		var defaultArea = {
			$id: undefined, // {String} Internal. Unique ID.
			$coords: [], // {Array} Internal. Array of absolute coordinates.
			shape: undefined, // {String} circle, rect, poly
			coords: [], // {Array} Array of relative (percentage) or absolute coordinates.
			href: '#', // {String}
			alt: '', // {String}
			title: '', // {String}
			data: undefined // {Object} Custom data object.
		};
		var defaultOverlay = {
			alwaysOn: false, // {Boolean} Whether to always show the highlighted map areas.
			click: false, // {Boolean} Whether to show or hide highlights on click.
			focus: false, // {Boolean} Whether to show or hide highlights on keyboard focus or blur.
			hover: false, // {Boolean} Whether to show or hide highlights on mouse enter or leave.
			single: false // {Boolean} Whether to highlight only one map area at the same time.
		};
		var $img, img;

		$scope.complete = false; // {Boolean} Whether the image has loaded or failed to load.
		$scope.map = _.cloneDeep(defaultMap); // {Object}

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

			if (aHref === defaultArea.href) {
				event.preventDefault();
			}

			$scope.$broadcast('nbPicture:clickArea', event);
		};

		/**
		 *
		 * @param {Event} event
		 * @param {Boolean} blur
		 */
		$scope.focusArea = function (event, blur) {
			$scope.$broadcast('nbPicture:focusArea', event, blur);
		};

		/**
		 *
		 * @param {Event} event
		 * @param {Boolean} blur
		 */
		$scope.hoverArea = function (event, blur) {
			$scope.$broadcast('nbPicture:hoverArea', event, blur);
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

			// Cancel timeouts and remove event handlers.
			this.destroy();

			// Reset state.
			$scope.complete = false;

			// Add image event handlers.
			addImgEventListeners();

			// Ensure `alt` attribute is always present.
			if (_.isUndefined(options.alt)) {
				options.alt = '';
			}

			var map = $scope.$eval(options.map);
			if (!_.isObject(map)) {
				throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'map', '!type': 'Object'}));
			}

			// Add default values.
			map = _.extend({}, defaultMap, map);

			// Assign a unique name to the map if none given.
			map.name = map.name || 'nb-picture-map-' + (++uniqid);

			_.forEach(map.areas, function (area, index) {
				map.areas[index] = _.extend({}, defaultArea, area, {
					$id: 'nb-picture-map-area-' + (++uniqid), // Unique ID for the map area.
					$coords: area.coords
				});
			});

			// Build overlay configs.
			var overlays = {};
			_.forEach(map.overlays, function (overlay, index) {
				overlay = _.extend({}, defaultOverlay, overlay);

				if (flags.touch) {
					overlay.click = true;
					overlay.focus = false;
					overlay.hover = false;
				}

				// Only add overlays that have events.
				if (overlay.alwaysOn || overlay.click || overlay.focus || overlay.hover) {
					overlay.$id = index;
					overlays[index] = overlay;
				}
			});
			map.overlays = overlays;

			var picture = {
				sources: [],
				img: {}
			};

			var sources = $scope.$eval(options.sources);
			if (!_.isArray(sources)) {
				throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'sources', '!type': 'Array'}));
			}

			// Add the sources from large to small.
			for (var il = sources.length, i = il - 1; i >= 0; i--) {
				var source = sources[i];
				var media;

				if (!_.isUndefined(source[1]) && source[1] in nbPictureConfig.mediaqueries) {
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
				usemap: !map.resize && map.name ? '#' + map.name : ''
			};

			// Assign data to scope.
			$scope.map = map;
			$scope.picture = picture;

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

				$scope.$broadcast('nbPicture:baseError');
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

				// Convert map coordinates to absolute values.
				calcMapCoords($scope.map);

				$scope.$broadcast('nbPicture:baseLoad');

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
			// Convert map coordinates to absolute values.
			calcMapCoords($scope.map);

			$scope.$broadcast('nbPicture:resize');

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

		/**
		 * Converts the given map coordinates to absolute values if relative.
		 *
		 * @param {Object} map
		 * @returns {Object}
		 */
		function calcMapCoords (map) {
			if (!map.relCoords) {
				return map;
			}

			var width = $scope.width();
			var height = $scope.height();

			if (!width || !height) {
				return map;
			}

			_.forEach(map.areas, function (area, index) {
				var shape = area.shape.toLowerCase();
				var coords = area.coords;
				var i;
				var len = coords.length;
				var arr = new Array(len);

				if (shape === PICTURE_SHAPE.CIRCLE) {
					for (i = 0; i < len && i < 3; i++) {
						if (i < 2) {
							arr[i] = Math.round(coords[i] * (i % 2 === 0 ? width : height));
						}
						else {
							arr[i] = Math.round(coords[i] * Math.min(width, height));
						}
					}
				}
				else if (shape === PICTURE_SHAPE.POLYGON) {
					for (i = 0; i < len; i++) {
						arr[i] = Math.round(coords[i] * (i % 2 === 0 ? width : height));
					}
				}
				else if (shape === PICTURE_SHAPE.RECTANGLE) {
					for (i = 0; i < len && i < 4; i++) {
						arr[i] = Math.round(coords[i] * (i % 2 === 0 ? width : height));
					}
				}

				map.areas[index].$coords = arr;
			});

			return map;
		}
	}
})(window, window.angular);