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

	nbPictureService.$inject = ['PICTURE_POSITION', 'PICTURE_SHAPE', '_', 'nbI18N', 'nbPictureConfig'];
	function nbPictureService (PICTURE_POSITION, PICTURE_SHAPE, _, nbI18N, nbPictureConfig) {
		/* jshint validthis: true */
		var self = this;
		var flags = {};
		var defaultMap = {
			$show: false, // {Boolean} Internal. Whether to show the map.
			name: undefined, // {String} `name` attribute of map DOM element.
			areas: [], // {Array} Array of map areas. See `defaultArea`.
			resize: false, // {Boolean} Whether to resize the map areas according to the image size.
			relCoords: false, // {Boolean} Whether the map has relative (percentage) coordinates.
			overlays: {} // {Object} Overlay configs keyed by ID.
		};
		var defaultMapArea = {
			$id: undefined, // {String} Internal. Unique ID.
			$coords: [], // {Array} Internal. Array of absolute coordinates.
			shape: undefined, // {String} circle, rect, poly
			coords: [], // {Array} Array of relative (percentage) or absolute coordinates.
			href: '#', // {String}
			alt: '', // {String}
			title: '', // {String}
			data: undefined // {Object} Custom data object.
		};
		var defaultMapOverlay = {
			$areas: [], // {Array} Internal. Highlighted map areas.
			alwaysOn: false, // {Boolean} Whether to always show the highlighted map areas.
			click: false, // {Boolean} Whether to show or hide highlights on click.
			focus: false, // {Boolean} Whether to show or hide highlights on keyboard focus or blur.
			hover: false, // {Boolean} Whether to show or hide highlights on mouse enter or leave.
			single: false // {Boolean} Whether to highlight only one map area at the same time.
		};
		var pictures = {};

		/**
		 *
		 * @returns {String}
		 */
		this.initPicture = function () {
			var id = 'nb-picture-' + (++uniqid);

			pictures[id] = {
				$id: id
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
					map.areas[index] = _.extend({}, defaultMapArea, area, {
						$id: 'nb-picture-map-area-' + (++uniqid), // Unique ID for the map area.
						$coords: area.coords
					});
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
						overlay.$id = index;
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

			if (!map || !map.relCoords || !width || !height) {
				return;
			}

			_.forEach(map.areas, function (area, index) {
				var shape = area.shape;
				var coords = area.coords;
				var i;
				var len = coords.length;
				var arr = new Array(len);
				var val;

				if (shape === PICTURE_SHAPE.CIRCLE) {
					for (i = 0; i < len && i < 3; i++) {
						if (i < 2) {
							val = coords[i] * (i % 2 === 0 ? width : height);
							if (round) {
								val = Math.round(val);
							}
							arr[i] = val;
						}
						else {
							val = coords[i] * Math.min(width, height);
							if (round) {
								val = Math.round(val);
							}
							arr[i] = val;
						}
					}
				}
				else if (shape === PICTURE_SHAPE.POLYGON) {
					for (i = 0; i < len; i++) {
						val = coords[i] * (i % 2 === 0 ? width : height);
						if (round) {
							val = Math.round(val);
						}
						arr[i] = val;
					}
				}
				else if (shape === PICTURE_SHAPE.RECTANGLE) {
					for (i = 0; i < len && i < 4; i++) {
						val = coords[i] * (i % 2 === 0 ? width : height);
						if (round) {
							val = Math.round(val);
						}
						arr[i] = val;
					}
				}

				map.areas[index].$coords = arr;
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

		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {Object} area
		 */
		this.setMapArea = function (pictureId, area) {

		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} areaId
		 * @returns {Boolean}
		 */
		this.deleteMapArea = function (pictureId, areaId) {
			var map = self.getMap(pictureId);

			if (map) {
				var index = _.findIndex(map.areas, {$id: areaId});

				if (index > -1) {
					map.areas.splice(index, 1);
				}

				_.forEach(map.overlays, function (overlay, overlayId) {
					var areas = map.overlays[overlayId].$areas;
					var index = _.findIndex(areas, {$id: areaId});

					if (index > -1) {
						areas.splice(index, 1);
					}
				});
			}
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
				return overlay.$areas;
			}
		};

		/**
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @param {Array} areas
		 */
		this.setMapOverlayAreas = function (pictureId, overlayId, areas) {
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				if (areas && areas.length) {
					overlay.$areas = areas;
				}
				else {
					overlay.$areas = [];
				}
			}
		};
	}
})(window, window.angular);