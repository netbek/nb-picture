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
		.module('nb.picture', [
			'nb.i18n',
			'nb.lodash',
			'nb.picture.templates'
		])
		.constant('PICTURE_POSITION', {
			'LEFT_TOP': 'left top',
			'LEFT_BOTTOM': 'left bottom',
			'RIGHT_TOP': 'right top',
			'RIGHT_BOTTOM': 'right bottom'
		})
		.constant('PICTURE_SHAPE', {
			'CIRCLE': 'circle',
			'POLYGON': 'poly',
			'RECTANGLE': 'rect'
		});
})(window, window.angular);
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
		.filter('join', function () {
			return function (input, delimiter) {
				if (angular.isArray(input)) {
					return input.join(angular.isDefined(delimiter) ? delimiter : ',');
				}
				return '';
			};
		});
})(window, window.angular);
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
		.provider('nbPictureConfig', nbPictureConfig);

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
})(window, window.angular);
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
		.factory('nbPictureUtils', nbPictureUtils);

	nbPictureUtils.$inject = ['PICTURE_POSITION', 'PICTURE_SHAPE'];
	function nbPictureUtils (PICTURE_POSITION, PICTURE_SHAPE) {
		var utils = {};

		/**
		 *
		 * @param {Number} x Value between 0 and 1.
		 * @param {Number} y Value between 0 and 1.
		 * @returns {String}
		 */
		utils.getPosition = function (x, y) {
			// Left
			if (x < 0.5) {
				// Top
				if (y < 0.5) {
					return PICTURE_POSITION.LEFT_TOP;
				}
				// Bottom
				else {
					return PICTURE_POSITION.LEFT_BOTTOM;
				}
			}
			// Right
			else {
				// Top
				if (y < 0.5) {
					return PICTURE_POSITION.RIGHT_TOP;
				}
				// Bottom
				else {
					return PICTURE_POSITION.RIGHT_BOTTOM;
				}
			}
		};

		/**
		 * Checks if a shape contains a point.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @param {Array} point
		 * @returns {Boolean}
		 */
		utils.contains = function (shape, coords, point) {
			var x = point[0];
			var y = point[1];

			if (shape === PICTURE_SHAPE.CIRCLE) {
				var cx = coords[0];
				var cy = coords[1];
				var radius = coords[2];
				var distanceSquared = (x - cx) * (x - cx) + (y - cy) * (y - cy);

				return distanceSquared <= radius * radius;
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var bounds = utils.getBounds(shape, coords);

				return x >= bounds[0] && x <= bounds[2] && y >= bounds[1] && y <= bounds[3];
			}

			return false;
		};

		/**
		 * Calculates the width and height of the bounds of a shape.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @returns {Object}
		 */
		utils.getSize = function (shape, coords) {
			var bounds = utils.getBounds(shape, coords);

			return {
				width: bounds[2] - bounds[0],
				height: bounds[3] - bounds[1]
			};
		};

		/**
		 * Calculates the bounds of a shape.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @returns {Array}
		 */
		utils.getBounds = function (shape, coords) {
			var x1 = 0, y1 = 0, x2 = 0, y2 = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x1 = coords[0] - coords[2];
				y1 = coords[1] - coords[2];
				x2 = coords[0] + coords[2];
				y2 = coords[1] + coords[2];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var coord, i, il;

				for (i = 0, il = coords.length; i < il; i++) {
					coord = coords[i];

					if (i % 2 === 0) {
						if (i === 0) {
							x1 = coord;
						}
						else {
							if (coord < x1) {
								x1 = coord;
							}
							if (coord > x2) {
								x2 = coord;
							}
						}
					}
					else {
						if (i === 1) {
							y1 = coord;
						}
						else {
							if (coord < y1) {
								y1 = coord;
							}
							if (coord > y2) {
								y2 = coord;
							}
						}
					}
				}
			}

			return [x1, y1, x2, y2];
		};

		/**
		 * Calculates the center of a shape's bounds.
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @param {Boolean} round Whether to round the returned values.
		 * @returns {Array}
		 */
		utils.getCenter = function (shape, coords, round) {
			var x = 0, y = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x = coords[0];
				y = coords[1];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var bounds = utils.getBounds(shape, coords);
				x = (bounds[0] + bounds[2]) / 2;
				y = (bounds[1] + bounds[3]) / 2;
			}

			if (round) {
				x = Math.round(x);
				y = Math.round(y);
			}

			return [x, y];
		};

		return utils;
	}
})(window, window.angular);
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

	nbPictureController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill', '_'];
	function nbPictureController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill, _) {
		/*jshint validthis: true */
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var timeouts = [];
		var $img, img;

		$scope.complete = false; // {Boolean} Whether the image has loaded or failed to load.

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
				alt: options.alt
			};

			// Assign data to scope.
			$scope.picture = picture;

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
			if (isImgComplete(img)) {
				$scope.complete = true;

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
		.directive('nbPicture', nbPictureDirective);

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
})(window, window.angular);
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
		.directive('nbPictureOnce', nbPictureOnceDirective);

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
		.directive('nbPictureMap', nbPictureMapDirective);

	function nbPictureMapDirective () {
		return {
			restrict: 'EA',
			replace: true,
			transclude: true,
			controller: 'nbPictureMapController',
			templateUrl: 'templates/nb-picture-map.html',
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
})(window, window.angular);
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
		.directive('nbPictureMapOnce', nbPictureMapOnceDirective);

	function nbPictureMapOnceDirective () {
		return {
			restrict: 'EA',
			replace: true,
			transclude: true,
			controller: 'nbPictureMapController',
			templateUrl: 'templates/nb-picture-map-once.html',
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
		.directive('nbPictureMapOverlayAreas', nbPictureMapOverlayAreasDirective);

	function nbPictureMapOverlayAreasDirective () {
		return {
			restrict: 'EA',
			replace: true,
			scope: true,
			templateUrl: 'templates/nb-picture-map-overlay-areas.html',
			link: function (scope, element, attrs) {
				var watch = scope.$watch(function () {
					return {
						alt: scope.picture & scope.picture.img ? scope.picture.img.alt : '',
						usemap: scope.map && scope.map.name ? '#' + scope.map.name : ''
					};
				}, function (newValue, oldValue, scope) {
					angular.forEach(newValue, function (value, key) {
						scope[key] = value;
					});
				}, true);

				scope.$on('$destroy', function () {
					watch();
				});
			}
		};
	}
})(window, window.angular);
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
		.factory('nbPictureMapOverlayUtils', nbPictureMapOverlayUtils);

	nbPictureMapOverlayUtils.$inject = ['_'];
	function nbPictureMapOverlayUtils (_) {
		var utils = {};

		/**
		 * Fired after base image has been loaded.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @returns {Object}
		 */
		utils.onBaseLoad = function (overlayConfig, areas, oldValue) {
			var dirty = false, newValue = oldValue;

			if (overlayConfig.alwaysOn) {
				return showAll(overlayConfig, areas, oldValue);
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: oldValue
			};
		};

		/**
		 * Fired after base image has failed to load.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @returns {Object}
		 */
		utils.onBaseError = function (overlayConfig, areas, oldValue) {
			var dirty = false, newValue = oldValue;

			if (oldValue.length) {
				dirty = true;
				newValue = [];
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: oldValue
			};
		};

		/**
		 * Fired after resize event.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @returns {Object}
		 * @see nbPictureMapController.calcMapCoords()
		 */
		utils.onResize = function (overlayConfig, areas, oldValue) {
			var dirty = false, newValue = oldValue;

			if (oldValue.length) {
				dirty = true;
				newValue = [];

				// Copy recalculated highlight coordinates from map areas.
				_.forEach(oldValue, function (old) {
					var area = _.find(areas, {$id: old.$id});
					if (area) {
						newValue.push(_.cloneDeep(area));
					}
				});
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: oldValue
			};
		};

		/**
		 * Fired after click event.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @param {Event} event
		 * @returns {Object}
		 */
		utils.onClickArea = function (overlayConfig, areas, oldValue, event) {
			if (!overlayConfig.alwaysOn && overlayConfig.click) {
				var id = event.target.id;

				// If only one highlight may be visible at the same time.
				if (overlayConfig.single) {
					var index = _.findIndex(oldValue, {$id: id});

					// If the highlight is currently visible, then hide it (and others).
					if (index > -1) {
						return hideAll(overlayConfig, areas, oldValue);
					}
					// If the highlight is not currently visible, then show it.
					else {
						// If one or more other highlights are currently visible.
						if (oldValue.length) {
							// Hide the other highlights.
							var a = hideAll(overlayConfig, areas, oldValue);

							// Show the given highlight.
							var b = show(overlayConfig, areas, a.newValue, [id]);
							b.dirty = true;

							return b;
						}
						else {
							// Show the given highlight.
							return show(overlayConfig, areas, oldValue, [id]);
						}
					}
				}

				// If multiple highlights may be visible at the same time.
				return toggle(overlayConfig, areas, oldValue, [id]);
			}

			return {
				dirty: false,
				newValue: oldValue,
				oldValue: oldValue
			};
		};

		/**
		 * Fired after keyboard event.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @param {Event} event
		 * @param {Boolean} blur
		 * @returns {Object}
		 */
		utils.onFocusArea = function (overlayConfig, areas, oldValue, event, blur) {
			if (!overlayConfig.alwaysOn && overlayConfig.focus) {
				var id = event.target.id;

				if (blur) {
					return hide(overlayConfig, areas, oldValue, [id]);
				}

				return show(overlayConfig, areas, oldValue, [id]);
			}

			return {
				dirty: false,
				newValue: oldValue,
				oldValue: oldValue
			};
		};

		/**
		 * Fired after mouse hover event.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @param {Event} event
		 * @param {Boolean} blur
		 * @returns {Object}
		 */
		utils.onHoverArea = function (overlayConfig, areas, oldValue, event, blur) {
			if (!overlayConfig.alwaysOn && overlayConfig.hover) {
				var id = event.target.id;

				if (blur) {
					return hide(overlayConfig, areas, oldValue, [id]);
				}

				return show(overlayConfig, areas, oldValue, [id]);
			}

			return false;
		};

		/**
		 * Toggles the given highlights.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @param {Array} ids Array of area `$id` values. If none given, then all highlights are toggled.
		 * @returns {Object}
		 */
		function toggle (overlayConfig, areas, oldValue, ids) {
			var dirty = false, newValue = oldValue;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(ids, function (id) {
					var index = _.findIndex(oldValue, {$id: id});

					// If the highlight is not currently visible, then show it.
					if (index < 0) {
						var area = _.find(areas, {$id: id});
						if (area) {
							newValue.push(_.cloneDeep(area));
						}
					}
				});
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: oldValue
			};
		}

		/**
		 * Shows the given highlights.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @param {Array} ids Array of area `$id` values.
		 * @returns {Object}
		 */
		function show (overlayConfig, areas, oldValue, ids) {
			var dirty = false, newValue = oldValue;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(ids, function (id) {
					var area = _.find(areas, {$id: id});
					if (area) {
						newValue.push(_.cloneDeep(area));
					}
				});
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: oldValue
			};
		}

		/**
		 * Shows all highlights.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @returns {Object}
		 */
		function showAll (overlayConfig, areas, oldValue) {
			return show(overlayConfig, areas, oldValue, _.pluck(areas, '$id'));
		}

		/**
		 * Hides the given highlights.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @param {Array} ids Array of area `$id` values.
		 * @returns {Object}
		 */
		function hide (overlayConfig, areas, oldValue, ids) {
			var dirty = false, newValue = oldValue;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(oldValue, function (old) {
					// If the highlight should not be hidden, then save it.
					if (_.indexOf(ids, old.$id) < 0) {
						newValue.push(old);
					}
				});
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: oldValue
			};
		}

		/**
		 * Hides all highlights.
		 *
		 * @param {Object} overlayConfig
		 * @param {Array} areas
		 * @param {Array} oldValue
		 * @returns {Object}
		 */
		function hideAll (overlayConfig, areas, oldValue) {
			return hide(overlayConfig, areas, oldValue, _.pluck(oldValue, '$id'));
		}

		return utils;
	}
})(window, window.angular);
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
		.factory('picturefill', Picturefill);

	Picturefill.$inject = ['$window'];
	function Picturefill ($window) {
		return $window.picturefill;
	}
})(window, window.angular);
angular.module('nb.picture.templates', ['templates/nb-picture-map-once.html', 'templates/nb-picture-map-overlay-areas.html', 'templates/nb-picture-map.html', 'templates/nb-picture-once.html', 'templates/nb-picture.html']);

angular.module("templates/nb-picture-map-once.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picture-map-once.html",
    "<span class=\"picture picture-map\">\n" +
    "	<map ng-if=\"::map.areas\"\n" +
    "		 ng-attr-name=\"{{::map.name}}\">\n" +
    "		<area ng-repeat=\"area in ::map.areas track by area.$id\"\n" +
    "			  ng-attr-id=\"{{::area.$id}}\"\n" +
    "			  ng-attr-shape=\"{{::area.shape}}\"\n" +
    "			  ng-attr-coords=\"{{area.$coords | join:','}}\"\n" +
    "			  ng-href=\"{{::area.href}}\"\n" +
    "			  ng-attr-alt=\"{{::area.alt}}\"\n" +
    "			  ng-attr-title=\"{{::area.title}}\"\n" +
    "			  ng-click=\"clickArea($event);\"\n" +
    "			  ng-focus=\"focusArea($event);\"\n" +
    "			  ng-blur=\"focusArea($event, true);\"\n" +
    "			  ng-mouseenter=\"hoverArea($event);\"\n" +
    "			  ng-mouseleave=\"hoverArea($event, true);\" />\n" +
    "	</map>\n" +
    "	<picture>\n" +
    "		<!--[if IE 9]><video style=\"display: none;\"><![endif]-->\n" +
    "		<source ng-repeat=\"source in ::picture.sources\"\n" +
    "				ng-srcset=\"{{::source.srcset}}\"\n" +
    "				ng-attr-media=\"{{::source.media}}\" />\n" +
    "		<!--[if IE 9]></video><![endif]-->\n" +
    "		<img ng-srcset=\"{{::picture.img.srcset}}\"\n" +
    "			 ng-attr-alt=\"{{::picture.img.alt}}\"\n" +
    "			 ng-attr-usemap=\"{{::picture.img.usemap}}\" />\n" +
    "	</picture>\n" +
    "	<span class=\"picture-map-overlays\" ng-transclude></span>\n" +
    "</span>");
}]);

angular.module("templates/nb-picture-map-overlay-areas.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picture-map-overlay-areas.html",
    "<span class=\"picture-map-overlay-areas\">\n" +
    "	<img src=\"data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7\"\n" +
    "		 ng-attr-alt=\"{{alt}}\"\n" +
    "		 ng-attr-usemap=\"{{usemap}}\" />\n" +
    "</span>");
}]);

angular.module("templates/nb-picture-map.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picture-map.html",
    "<span class=\"picture picture-map\">\n" +
    "	<map ng-if=\"map.areas\"\n" +
    "		 ng-attr-name=\"{{map.name}}\">\n" +
    "		<area ng-repeat=\"area in map.areas track by area.$id\"\n" +
    "			  ng-attr-id=\"{{area.$id}}\"\n" +
    "			  ng-attr-shape=\"{{area.shape}}\"\n" +
    "			  ng-attr-coords=\"{{area.$coords| join:','}}\"\n" +
    "			  ng-href=\"{{area.href}}\"\n" +
    "			  ng-attr-alt=\"{{area.alt}}\"\n" +
    "			  ng-attr-title=\"{{area.title}}\"\n" +
    "			  ng-click=\"clickArea($event);\"\n" +
    "			  ng-focus=\"focusArea($event);\"\n" +
    "			  ng-blur=\"focusArea($event, true);\"\n" +
    "			  ng-mouseenter=\"hoverArea($event);\"\n" +
    "			  ng-mouseleave=\"hoverArea($event, true);\" />\n" +
    "	</map>\n" +
    "	<picture>\n" +
    "		<!--[if IE 9]><video style=\"display: none;\"><![endif]-->\n" +
    "		<source ng-repeat=\"source in picture.sources\"\n" +
    "				ng-srcset=\"{{source.srcset}}\"\n" +
    "				ng-attr-media=\"{{source.media}}\" />\n" +
    "		<!--[if IE 9]></video><![endif]-->\n" +
    "		<img ng-srcset=\"{{picture.img.srcset}}\"\n" +
    "			 ng-attr-alt=\"{{picture.img.alt}}\"\n" +
    "			 ng-attr-usemap=\"{{picture.img.usemap}}\" />\n" +
    "	</picture>\n" +
    "	<span class=\"picture-map-overlays\" ng-transclude></span>\n" +
    "</span>");
}]);

angular.module("templates/nb-picture-once.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picture-once.html",
    "<span class=\"picture\">\n" +
    "	<picture>\n" +
    "		<!--[if IE 9]><video style=\"display: none;\"><![endif]-->\n" +
    "		<source ng-repeat=\"source in ::picture.sources\"\n" +
    "				ng-srcset=\"{{::source.srcset}}\"\n" +
    "				ng-attr-media=\"{{::source.media}}\" />\n" +
    "		<!--[if IE 9]></video><![endif]-->\n" +
    "		<img ng-srcset=\"{{::picture.img.srcset}}\"\n" +
    "			 ng-attr-alt=\"{{::picture.img.alt}}\" />\n" +
    "	</picture>\n" +
    "</span>");
}]);

angular.module("templates/nb-picture.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picture.html",
    "<span class=\"picture\">\n" +
    "	<picture>\n" +
    "		<!--[if IE 9]><video style=\"display: none;\"><![endif]-->\n" +
    "		<source ng-repeat=\"source in picture.sources\"\n" +
    "				ng-srcset=\"{{source.srcset}}\"\n" +
    "				ng-attr-media=\"{{source.media}}\" />\n" +
    "		<!--[if IE 9]></video><![endif]-->\n" +
    "		<img ng-srcset=\"{{picture.img.srcset}}\"\n" +
    "			 ng-attr-alt=\"{{picture.img.alt}}\" />\n" +
    "	</picture>\n" +
    "</span>");
}]);
