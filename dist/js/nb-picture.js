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
			'debounce',
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
				_.merge(config, values);
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
		.service('nbPictureService', nbPictureService);

	var uniqid = 0;

	nbPictureService.$inject = ['PICTURE_POSITION', 'PICTURE_SHAPE', '_', 'nbI18N', 'nbPictureConfig', 'nbPictureUtilService'];
	function nbPictureService (PICTURE_POSITION, PICTURE_SHAPE, _, nbI18N, nbPictureConfig, nbPictureUtilService) {
		/* jshint validthis: true */
		var self = this;
		var flags = {};
		var defaultMap = {
			name: undefined, // {String} `name` attribute of map DOM element.
			areas: [], // {Array} Array of map areas. See `defaultArea`.
			resize: false, // {Boolean} Whether to resize the map areas according to the image size.
			relCoords: false, // {Boolean} Whether the map has relative (percentage) coordinates.
			overlays: {} // {Object} Overlay configs keyed by ID.
		};
		var defaultMapArea = {
			$$id: undefined, // {String} Internal. Unique ID.
			$$coords: [], // {Array} Internal. Array of absolute coordinates.
			shape: undefined, // {String} circle, rect, poly
			coords: [], // {Array} Array of relative (percentage) or absolute coordinates.
			href: '#', // {String}
			alt: '', // {String}
			title: '', // {String}
			data: undefined // {Object} Custom data object.
		};
		var defaultMapOverlay = {
			$$areas: [], // {Array} Internal. Highlighted map areas.
			show: true, // {Boolean} Whether the overlay is visible (ngShow).
			alwaysOn: false, // {Boolean} Whether to always show the highlighted map areas.
			click: false, // {Boolean} Whether to show or hide highlights on click.
			focus: false, // {Boolean} Whether to show or hide highlights on keyboard focus or blur.
			hover: false, // {Boolean} Whether to show or hide highlights on mouse enter or leave.
			single: false, // {Boolean} Whether to highlight only one map area at the same time.
			debounceResize: 0 // {Number}
		};
		var pictures = {};

		/**
		 *
		 * @returns {String}
		 */
		this.initPicture = function () {
			var id = 'nb-picture-' + (++uniqid);

			pictures[id] = {
				$$id: id,
				$$complete: false // {Boolean} Whether the image load has ended (can be load success or fail).
			};

			return id;
		};

		/**
		 *
		 * @param {String} pictureId
		 */
		this.destroyPicture = function (pictureId) {
			pictures = _.omit(pictures, pictureId);
		};

		/**
		 *
		 * @param {String} pictureId
		 * @returns {Object}
		 */
		this.getPicture = function (pictureId) {
			return pictures[pictureId];
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {Object} args
		 */
		this.setPicture = function (pictureId, args) {
			if (!_.isArray(args.sources)) {
				throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'sources', '!type': 'Array'}));
			}

			// Ensure `alt` attribute is always present.
			if (_.isUndefined(args.alt)) {
				args.alt = '';
			}

			var sources = [];

			// Add the sources from large to small.
			for (var il = args.sources.length, i = il - 1; i >= 0; i--) {
				var source = args.sources[i];
				var media;

				if (!_.isUndefined(source[1]) && source[1] in nbPictureConfig.mediaqueries) {
					media = nbPictureConfig.mediaqueries[source[1]];
				}

				sources.push({
					srcset: source[0],
					media: media
				});
			}

			// Add the default image.
			sources.push({
				srcset: args.defaultSource
			});

			var map = self.getMap(pictureId);

			pictures[pictureId].sources = sources;
			pictures[pictureId].img = {
				srcset: args.defaultSource,
				alt: args.alt,
				usemap: map && !map.resize && map.name ? '#' + map.name : ''
			};
		};

		/**
		 *
		 * @param {String} pictureId
		 * @returns {Boolean}
		 */
		this.getPictureComplete = function (pictureId) {
			var picture = pictures[pictureId];

			if (picture) {
				return picture.$$complete;
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {Boolean} complete Whether the image load has ended (can be load success or fail).
		 */
		this.setPictureComplete = function (pictureId, complete) {
			var picture = pictures[pictureId];

			if (picture) {
				picture.$$complete = complete;
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @returns {Object}
		 */
		this.getMap = function (pictureId) {
			var picture = pictures[pictureId];

			if (picture) {
				return picture.map;
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {Object} args
		 */
		this.setMap = function (pictureId, args) {
			if (!_.isObject(args.map)) {
				throw new Error(nbI18N.t('Excepted attribute "!attribute" to evaluate to !type', {'!attribute': 'map', '!type': 'Object'}));
			}

			var picture = self.getPicture(pictureId);

			if (picture) {
				// Add default values.
				var map = _.extend({}, defaultMap, args.map);

				// Assign a unique name to the map if none given.
				map.name = map.name || 'nb-picture-map-' + (++uniqid);

				_.forEach(map.areas, function (area, index) {
					map.areas[index] = buildMapArea(area);
				});

				// Build overlay configs.
				var overlays = {};
				_.forEach(map.overlays, function (overlay, index) {
					overlay = _.extend({}, defaultMapOverlay, overlay);

					if (flags.touch) {
						overlay.click = true;
						overlay.focus = false;
						overlay.hover = false;
					}

					// Only add overlays that have events.
					if (overlay.alwaysOn || overlay.click || overlay.focus || overlay.hover) {
						overlay.$$id = index;
						overlays[index] = overlay;
					}
				});
				map.overlays = overlays;

				picture.map = map;
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {Number} width
		 * @param {Number} height
		 * @param {Boolean} round
		 */
		this.resizeMap = function (pictureId, width, height, round) {
			var map = self.getMap(pictureId);

			if (!map || !width || !height) {
				return;
			}

			_.forEach(map.areas, function (area, index) {
				var coords;

				if (map.relCoords) {
					coords = nbPictureUtilService.relToAbsCoords(area.shape, area.coords, width, height, round);
				}
				else {
					coords = _.cloneDeep(area.coords);
				}

				map.areas[index].$$coords = coords;

				// Update map overlays that have the area.
				_.forEach(map.overlays, function (overlay, overlayId) {
					var overlayArea = _.find(overlay.$$areas, {$$id: area.$$id});

					if (overlayArea) {
						overlayArea.$$coords = coords;
						self.setMapOverlayArea(pictureId, overlayId, overlayArea);
					}
				});
			});
		};

		/**
		 *
		 * @param {String} pictureId
		 * @returns {Array}
		 */
		this.getMapAreas = function (pictureId) {
			var map = self.getMap(pictureId);

			if (map) {
				return map.areas;
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} areaId
		 * @returns {Object|undefined}
		 */
		this.getMapArea = function (pictureId, areaId) {
			var map = self.getMap(pictureId);

			if (map) {
				return _.find(map.areas, {$$id: areaId});
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {Object} area
		 * @returns {Boolean|Object} Returns the new map area, or if the area exists, then whether the map areas have been changed.
		 */
		this.setMapArea = function (pictureId, area) {
			var dirty = false;
			var map = self.getMap(pictureId);

			if (map) {
				// Update an existing map area.
				if (area.$$id) {
					var index = _.findIndex(map.areas, {$$id: area.$$id});

					if (index > -1) {
						dirty = true;
						map.areas[index] = area;

						// Update map overlays that have the given area.
						_.forEach(map.overlays, function (overlay, overlayId) {
							var index = _.findIndex(overlay.$$areas, {$$id: area.$$id});

							if (index > -1) {
								self.setMapOverlayArea(pictureId, overlayId, _.cloneDeep(area));
							}
						});
					}
				}
				// Create a new map area.
				else {
					var newArea = buildMapArea(area);
					map.areas.push(newArea);

					// Add the new area to overlays that are always on.
					_.forEach(map.overlays, function (overlay, overlayId) {
						if (overlay.alwaysOn) {
							self.setMapOverlayArea(pictureId, overlayId, newArea);
						}
					});

					return newArea;
				}
			}

			return dirty;
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} areaId
		 * @returns {Boolean} Whether the map or overlay areas have been changed.
		 */
		this.deleteMapArea = function (pictureId, areaId) {
			var dirty = false;
			var map = self.getMap(pictureId);

			if (map) {
				var index = _.findIndex(map.areas, {$$id: areaId});

				if (index > -1) {
					dirty = true;
					map.areas.splice(index, 1);
				}

				_.forEach(map.overlays, function (overlay, overlayId) {
					var areas = map.overlays[overlayId].$$areas;
					var index = _.findIndex(areas, {$$id: areaId});

					if (index > -1) {
						dirty = true;
						areas.splice(index, 1);
					}
				});
			}

			return dirty;
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @returns {Array}
		 */
		this.getMapOverlay = function (pictureId, overlayId) {
			var map = self.getMap(pictureId);

			if (map) {
				return map.overlays[overlayId];
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @returns {Array}
		 */
		this.getMapOverlayAreas = function (pictureId, overlayId) {
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				return overlay.$$areas;
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @param {Array} areas
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.setMapOverlayAreas = function (pictureId, overlayId, areas) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				dirty = true;

				if (areas && areas.length) {
					overlay.$$areas = areas;
				}
				else {
					overlay.$$areas = [];
				}
			}

			return dirty;
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @param {String} areaId
		 * @returns {Object|undefined}
		 */
		this.getMapOverlayArea = function (pictureId, overlayId, areaId) {
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				return _.find(overlay.$$areas, {$$id: areaId});
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @param {Object} area
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.setMapOverlayArea = function (pictureId, overlayId, area) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				if (area.$$id) {
					dirty = true;

					var areas = overlay.$$areas;
					var index = _.findIndex(areas, {$$id: area.$$id});

					if (index > -1) {
						areas[index] = area;
					}
					else {
						areas.push(area);
					}
				}
			}

			return dirty;
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @returns {Boolean} Whether the overlay state has been changed.
		 */
		this.showMapOverlay = function (pictureId, overlayId) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay && !overlay.show) {
				dirty = true;
				overlay.show = true;
			}

			return dirty;
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @returns {Boolean} Whether the overlay state has been changed.
		 */
		this.hideMapOverlay = function (pictureId, overlayId) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay && overlay.show) {
				dirty = true;
				overlay.show = false;
			}

			return dirty;
		};

		/**
		 * Fired after the base image has been loaded.
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.onBaseLoad = function (pictureId, overlayId) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				var areas = self.getMapAreas(pictureId);
				var highs = self.getMapOverlayAreas(pictureId, overlayId);

				if (overlay.alwaysOn) {
					var result = showAllOverlayAreas(overlay, areas, highs);

					if (result.dirty) {
						self.setMapOverlayAreas(pictureId, overlayId, result.newValue);
					}

					return result.dirty;
				}
			}

			return dirty;
		};

		/**
		 * Fired after the base image has failed to load.
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.onBaseError = function (pictureId, overlayId) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				var highs = self.getMapOverlayAreas(pictureId, overlayId);

				if (highs.length) {
					dirty = true;
					self.setMapOverlayAreas(pictureId, overlayId, []);
				}
			}

			return dirty;
		};

		/**
		 * Fired after click event.
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @param {Events} event
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.onClickArea = function (pictureId, overlayId, event) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay && !overlay.alwaysOn && overlay.click) {
				var areaId = event.target.id;
				var areas = self.getMapAreas(pictureId);
				var highs = self.getMapOverlayAreas(pictureId, overlayId);
				var result, index, hideAllResult;

				// If only one highlight may be visible at the same time.
				if (overlay.single) {
					index = _.findIndex(highs, {$$id: areaId});

					// If the highlight is currently visible, then hide it (and others).
					if (index > -1) {
						result = hideAllOverlayAreas(overlay, areas, highs);

						if (result.dirty) {
							self.setMapOverlayAreas(pictureId, overlayId, result.newValue);
						}

						return result.dirty;
					}
					// If the highlight is not currently visible, then show it.
					else {
						// If one or more other highlights are currently visible.
						if (highs.length) {
							// Hide the other highlights.
							hideAllResult = hideAllOverlayAreas(overlay, areas, highs);

							// Show the given highlight.
							result = showOverlayArea(overlay, areas, hideAllResult.newValue, [areaId]);
							result.dirty = true;

							if (result.dirty) {
								self.setMapOverlayAreas(pictureId, overlayId, result.newValue);
							}

							return result.dirty;
						}
						else {
							// Show the given highlight.
							result = showOverlayArea(overlay, areas, highs, [areaId]);

							if (result.dirty) {
								self.setMapOverlayAreas(pictureId, overlayId, result.newValue);
							}

							return result.dirty;
						}
					}
				}
				// If multiple highlights may be visible at the same time.
				else {
					result = toggleOverlayArea(overlay, areas, highs, [areaId]);

					if (result.dirty) {
						self.setMapOverlayAreas(pictureId, overlayId, result.newValue);
					}

					return result.dirty;
				}
			}

			return dirty;
		};

		/**
		 * Fired after keyboard event.
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @param {Event} event
		 * @param {Boolean} blur
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.onFocusArea = function (pictureId, overlayId, event, blur) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay && !overlay.alwaysOn && overlay.focus) {
				var areaId = event.target.id;
				var areas = self.getMapAreas(pictureId);
				var highs = self.getMapOverlayAreas(pictureId, overlayId);
				var result;

				if (blur) {
					result = hideOverlayArea(overlay, areas, highs, [areaId]);
				}
				else {
					result = showOverlayArea(overlay, areas, highs, [areaId]);
				}

				if (result.dirty) {
					self.setMapOverlayAreas(pictureId, overlayId, result.newValue);
				}

				return result.dirty;
			}

			return dirty;
		};

		/**
		 * Fired after mouse hover event.
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @param {Event} event
		 * @param {Boolean} blur
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.onHoverArea = function (pictureId, overlayId, event, blur) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay && !overlay.alwaysOn && overlay.hover) {
				var areaId = event.target.id;
				var areas = self.getMapAreas(pictureId);
				var highs = self.getMapOverlayAreas(pictureId, overlayId);
				var result;

				if (blur) {
					result = hideOverlayArea(overlay, areas, highs, [areaId]);
				}
				else {
					result = showOverlayArea(overlay, areas, highs, [areaId]);
				}

				if (result.dirty) {
					self.setMapOverlayAreas(pictureId, overlayId, result.newValue);
				}

				return result.dirty;
			}

			return dirty;
		};

		/**
		 *
		 * @param {Object} area
		 * @returns {Object}
		 */
		function buildMapArea (area) {
			return _.extend({}, defaultMapArea, area, {
				$$id: 'nb-picture-map-area-' + (++uniqid), // Unique ID for the map area.
				$$coords: area.$$coords || area.coords
			});
		}

		/**
		 * Toggles the given highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @param {Array} ids Array of area `$$id` values. If none given, then all highlights are toggled.
		 * @returns {Object}
		 */
		function toggleOverlayArea (overlay, areas, highs, ids) {
			var dirty = false, newValue = highs;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(ids, function (id) {
					var index = _.findIndex(highs, {$$id: id});

					// If the highlight is not currently visible, then show it.
					if (index < 0) {
						var area = _.find(areas, {$$id: id});
						if (area) {
							newValue.push(_.cloneDeep(area));
						}
					}
				});
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: highs
			};
		}

		/**
		 * Shows the given highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @param {Array} ids Array of area `$$id` values.
		 * @returns {Object}
		 */
		function showOverlayArea (overlay, areas, highs, ids) {
			var dirty = false, newValue = highs;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(ids, function (id) {
					var area = _.find(areas, {$$id: id});
					if (area) {
						newValue.push(_.cloneDeep(area));
					}
				});
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: highs
			};
		}

		/**
		 * Shows all highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @returns {Object}
		 */
		function showAllOverlayAreas (overlay, areas, highs) {
			return showOverlayArea(overlay, areas, highs, _.pluck(areas, '$$id'));
		}

		/**
		 * Hides the given highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @param {Array} ids Array of area `$$id` values.
		 * @returns {Object}
		 */
		function hideOverlayArea (overlay, areas, highs, ids) {
			var dirty = false, newValue = highs;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(highs, function (old) {
					// If the highlight should not be hidden, then save it.
					if (_.indexOf(ids, old.$$id) < 0) {
						newValue.push(old);
					}
				});
			}

			return {
				dirty: dirty,
				newValue: newValue,
				oldValue: highs
			};
		}

		/**
		 * Hides all highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @returns {Object}
		 */
		function hideAllOverlayAreas (overlay, areas, highs) {
			return hideOverlayArea(overlay, areas, highs, _.pluck(highs, '$$id'));
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
		.service('nbPictureUtilService', nbPictureUtilService);

	nbPictureUtilService.$inject = ['PICTURE_POSITION', 'PICTURE_SHAPE', '_'];
	function nbPictureUtilService (PICTURE_POSITION, PICTURE_SHAPE, _) {
		/* jshint validthis: true */

		/**
		 *
		 * @param {Number} x Value between 0 and 1.
		 * @param {Number} y Value between 0 and 1.
		 * @returns {String}
		 */
		this.getPosition = function (x, y) {
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
		this.contains = function (shape, coords, point) {
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
				var bounds = this.getBounds(shape, coords);

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
		this.getSize = function (shape, coords) {
			var bounds = this.getBounds(shape, coords);

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
		this.getBounds = function (shape, coords) {
			var x1 = 0, y1 = 0, x2 = 0, y2 = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x1 = coords[0] - coords[2];
				y1 = coords[1] - coords[2];
				x2 = coords[0] + coords[2];
				y2 = coords[1] + coords[2];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var x = [], y = [];

				_.forEach(coords, function (value, i) {
					if (i % 2 === 0) {
						x.push(value);
					}
					else {
						y.push(value);
					}
				});

				x1 = _.min(x);
				y1 = _.min(y);
				x2 = _.max(x);
				y2 = _.max(y);
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
		this.getCenter = function (shape, coords, round) {
			var x = 0, y = 0;

			if (shape === PICTURE_SHAPE.CIRCLE) {
				x = coords[0];
				y = coords[1];
			}
			else if (shape === PICTURE_SHAPE.POLYGON || shape === PICTURE_SHAPE.RECTANGLE) {
				var bounds = this.getBounds(shape, coords);
				x = (bounds[0] + bounds[2]) / 2;
				y = (bounds[1] + bounds[3]) / 2;
			}

			if (round) {
				x = Math.round(x);
				y = Math.round(y);
			}

			return [x, y];
		};

		/**
		 *
		 * @param {String} shape
		 * @param {Array} coords
		 * @param {Number} width
		 * @param {Number} height
		 * @param {Boolean} round Whether to round the returned values.
		 * @returns {Array}
		 */
		this.relToAbsCoords = function (shape, coords, width, height, round) {
			var i, val;
			var len = coords.length;
			var newCoords = new Array(len);

			if (shape === PICTURE_SHAPE.CIRCLE) {
				for (i = 0; i < len && i < 3; i++) {
					if (i < 2) {
						val = coords[i] * (i % 2 === 0 ? width : height);
						if (round) {
							val = Math.round(val);
						}
						newCoords[i] = val;
					}
					else {
						val = coords[i] * Math.min(width, height);
						if (round) {
							val = Math.round(val);
						}
						newCoords[i] = val;
					}
				}
			}
			else if (shape === PICTURE_SHAPE.POLYGON) {
				for (i = 0; i < len; i++) {
					val = coords[i] * (i % 2 === 0 ? width : height);
					if (round) {
						val = Math.round(val);
					}
					newCoords[i] = val;
				}
			}
			else if (shape === PICTURE_SHAPE.RECTANGLE) {
				for (i = 0; i < len && i < 4; i++) {
					val = coords[i] * (i % 2 === 0 ? width : height);
					if (round) {
						val = Math.round(val);
					}
					newCoords[i] = val;
				}
			}

			return newCoords;
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
		.controller('nbPictureController', nbPictureController);

	nbPictureController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill', '_', 'nbPictureService'];
	function nbPictureController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill, _, nbPictureService) {
		/*jshint validthis: true */
		var pictureId;
		var flags = {
			init: false // {Boolean} Whether init() has been fired.
		};
		var timeouts = [];
		var $img, img, complete = false;

		/**
		 * Returns width of image.
		 *
		 * @returns {Number}
		 */
		$scope.width = function () {
			return complete && img ? img.scrollWidth : 0;
		};

		/**
		 * Returns height of image.
		 *
		 * @returns {Number}
		 */
		$scope.height = function () {
			return complete && img ? img.scrollHeight : 0;
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

			pictureId = nbPictureService.initPicture();

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

			nbPictureService.destroyPicture(pictureId);
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

			_.forEach(timeouts, function (fn) {
				$timeout.cancel(fn);
			});

			if ($img) {
				removeImgEventListeners();
			}

			// Reset state.
			complete = false;
			nbPictureService.setPictureComplete(pictureId, complete);

			// Add image event handlers.
			addImgEventListeners();

			options.sources = $scope.$eval(options.sources);
			nbPictureService.setPicture(pictureId, options);

			// Assign data to scope.
			$scope.picture = nbPictureService.getPicture(pictureId);

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
				complete = true;
				nbPictureService.setPictureComplete(pictureId, complete);

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
				complete = true;
				nbPictureService.setPictureComplete(pictureId, complete);

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
			scope: true,
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
			scope: true,
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

	nbPictureMapController.$inject = ['$scope', '$element', '$attrs', '$timeout', 'nbI18N', 'nbPictureConfig', 'picturefill', '_', 'nbPictureService', 'PICTURE_SHAPE'];
	function nbPictureMapController ($scope, $element, $attrs, $timeout, nbI18N, nbPictureConfig, picturefill, _, nbPictureService, PICTURE_SHAPE) {
		/*jshint validthis: true */
		var pictureId;
		var flags = {
			init: false, // {Boolean} Whether init() has been fired.
			touch: false // {Boolean} Whether the device supports touch events.
		};
		var timeouts = [], deregister = [];
		var $img, img, complete = false;

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

			// If default href, then stop event.
			if (aHref === '#') {
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
			return complete && img ? img.scrollWidth : 0;
		};

		/**
		 * Returns height of image.
		 *
		 * @returns {Number}
		 */
		$scope.height = function () {
			return complete && img ? img.scrollHeight : 0;
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

			pictureId = nbPictureService.initPicture();

			$img = $element.find('img');
			img = $img[0];

			deregister.push($scope.$on('nbPicture:mapAreasChanged', function (e) {
				$scope.$broadcast('nbPicture:render');
			}));
		};

		/**
		 *
		 */
		this.destroy = function () {
			_.forEach(timeouts, function (fn) {
				$timeout.cancel(fn);
			});

			_.forEach(deregister, function (fn) {
				fn();
			});

			removeWindowEventListeners();

			if ($img) {
				removeImgEventListeners();
			}

			nbPictureService.destroyPicture(pictureId);
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

			_.forEach(timeouts, function (fn) {
				$timeout.cancel(fn);
			});

			removeWindowEventListeners();

			if ($img) {
				removeImgEventListeners();
			}

			// Reset state.
			complete = false;
			nbPictureService.setPictureComplete(pictureId, complete);

			// Add image event handlers.
			addImgEventListeners();

			options.map = $scope.$eval(options.map);
			nbPictureService.setMap(pictureId, options);

			options.sources = $scope.$eval(options.sources);
			nbPictureService.setPicture(pictureId, options);

			// Assign data to scope.
			$scope.map = nbPictureService.getMap(pictureId);
			$scope.picture = nbPictureService.getPicture(pictureId);

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
				complete = true;
				nbPictureService.setPictureComplete(pictureId, complete);

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
				complete = true;
				nbPictureService.setPictureComplete(pictureId, complete);

				removeImgEventListeners();

				nbPictureService.resizeMap(pictureId, $scope.width(), $scope.height(), true);

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
			nbPictureService.resizeMap(pictureId, $scope.width(), $scope.height(), true);

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
			scope: true,
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
			scope: true,
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

	nbPictureMapOverlayAreasDirective.$inject = ['nbPictureService'];
	function nbPictureMapOverlayAreasDirective (nbPictureService) {
		return {
			restrict: 'EA',
			replace: true,
			scope: true,
			templateUrl: 'templates/nb-picture-map-overlay-areas.html',
			link: function (scope, element, attrs) {
				var watch = scope.$watch('$parent.$parent.picture.$$id', function (newValue, oldValue) {
					var model = {
						alt: '',
						usemap: ''
					};

					if (newValue) {
						var picture = nbPictureService.getPicture(newValue);
						var map = nbPictureService.getMap(newValue);

						if (picture) {
							model.alt = picture.img.alt || '';
						}
						if (map && map.name) {
							model.usemap = '#' + map.name;
						}
					}

					scope.model = model;
				});

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
    "		<area ng-repeat=\"area in ::map.areas track by area.$$id\"\n" +
    "			  ng-attr-id=\"{{::area.$$id}}\"\n" +
    "			  ng-attr-shape=\"{{::area.shape}}\"\n" +
    "			  ng-attr-coords=\"{{area.$$coords | join:','}}\"\n" +
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
    "		 ng-attr-alt=\"{{model.alt}}\"\n" +
    "		 ng-attr-usemap=\"{{model.usemap}}\" />\n" +
    "</span>");
}]);

angular.module("templates/nb-picture-map.html", []).run(["$templateCache", function($templateCache) {
  $templateCache.put("templates/nb-picture-map.html",
    "<span class=\"picture picture-map\">\n" +
    "	<map ng-if=\"map.areas\"\n" +
    "		 ng-attr-name=\"{{map.name}}\">\n" +
    "		<area ng-repeat=\"area in map.areas track by area.$$id\"\n" +
    "			  ng-attr-id=\"{{area.$$id}}\"\n" +
    "			  ng-attr-shape=\"{{area.shape}}\"\n" +
    "			  ng-attr-coords=\"{{area.$$coords| join:','}}\"\n" +
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
