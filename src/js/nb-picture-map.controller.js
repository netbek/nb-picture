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

	nbPictureMapController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill'];
	function nbPictureMapController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill) {
		/*jshint validthis: true */
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var timeouts = [];
		var defaultMap = {
			$show: false, // {Boolean} Internal. Whether to show the map.
			name: undefined, // {String} DOM element `name` attribute.
			areas: [], // {Array} Array of map areas. See `defaultArea`.
			resize: false, // {Boolean} Whether to resize the map according to the image.
			relCoords: false, // {Boolean} Whether the map has relative (percentage) coordinates.
			highlight: {
				enable: false, // {Boolean} Whether to highlight map areas.
				fill: true, // {Boolean} Whether to fill the shape.
				fillColor: 'FF0000', // {String} The color to fill the shape with.
				fillOpacity: 0.5, // {Number} The opacity of the fill (0 = fully transparent, 1 = fully opaque).
				alwaysOn: false // {Boolean} Whether to always show the highlighted areas.
			}
		};
		var defaultArea = {
			$id: undefined, // {String} Internal. Unique ID.
			$coords: [], // {Array} Internal. Array of absolute coordinates.
			shape: undefined, // {String} circle, rect, poly
			coords: [], // {Array} Array of relative (percentage) or absolute coordinates.
			href: undefined, // {String}
			alt: '', // {String}
			title: '', // {String}
			data: undefined // {Object} Custom data object.
		};
		var $img, img;

		$scope.complete = false; // {Boolean} Whether the image has loaded or failed to load.
		$scope.map = _.cloneDeep(defaultMap); // {Object}
		$scope.highlights = []; // {Array} Array of highlighted map areas (not necessarily all). See `defaultArea`.

		/**
		 * Shows highlighted map area.
		 *
		 * @param {Event} event
		 */
		$scope.showHighlight = function (event) {
			var target = event.target;
			var index = _.findIndex($scope.highlights, {$id: target.id});

			if (index < 0) {
				var area = _.find($scope.map.areas, {$id: target.id});

				if (area) {
					$scope.highlights.push(_.cloneDeep(area));

					// Redraw canvas.
					$scope.$broadcast('nbPicture:draw');
				}
			}
		};

		/**
		 * Hides highlighted map area.
		 *
		 * @param {Event} event
		 */
		$scope.hideHighlight = function (event) {
			if ($scope.map.highlight.alwaysOn) {
				return;
			}

			var index = _.findIndex($scope.highlights, {$id: event.target.id});

			if (index >= 0) {
				$scope.highlights.splice(index, 1);

				// Redraw canvas.
				$scope.$broadcast('nbPicture:draw');
			}
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

			$scope.highlights = [];
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

			map.img = {
				src: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // Transparent 1x1 GIF.
				alt: options.alt,
				usemap: map.name ? '#' + map.name : ''
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

				timeouts.push($timeout(function () {
					// Hide the map.
					$scope.map.$show = false;

					$scope.$apply();
				}));
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

				if ($scope.map.highlight.enable || $scope.map.resize) {
					timeouts.push($timeout(function () {
						// Convert map coordinates to absolute values.
						calcMapCoords($scope.map);

						// If all map highlights should always be on.
						if ($scope.map.highlight.enable && $scope.map.highlight.alwaysOn) {
							// Add all the map areas.
							$scope.highlights = _.cloneDeep($scope.map.areas);

							// Redraw canvas.
							$scope.$broadcast('nbPicture:draw');
						}

						// Show the map.
						$scope.map.$show = true;

						$scope.$apply();
					}));
				}
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
			if ($scope.map.resize) {
				// Reconvert relative coordinates to absolute coordinates.
				calcMapCoords($scope.map);
			}

			if ($scope.map.highlight.enable && $scope.highlights.length) {
				// Fetch highlighted areas from newly converted map.
				var ids = _.pluck($scope.highlights, '$id');
				var arr = [];
				_.forEach(ids, function (id) {
					var area = _.find($scope.map.areas, {$id: id});
					if (area) {
						arr.push(_.cloneDeep(area));
					}
				});
				$scope.highlights = arr;

				// Redraw canvas.
				$scope.$broadcast('nbPicture:draw');
			}

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
			// If the map has relative (percentage) coordinates, then convert
			// the coordinates to absolute values.
			if (map.relCoords) {
				var width = $scope.width();
				var height = $scope.height();

				_.forEach(map.areas, function (area, index) {
					var shape = area.shape.toLowerCase();
					var coords = area.coords;
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

					map.areas[index].$coords = arr;
				});
			}

			return map;
		}
	}
})(window, window.angular);