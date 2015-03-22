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

	nbPictureService.$inject = ['PICTURE_POSITION', 'PICTURE_SHAPE', '_', 'nbI18N', 'nbPictureConfig', 'nbPictureUtils'];
	function nbPictureService (PICTURE_POSITION, PICTURE_SHAPE, _, nbI18N, nbPictureConfig, nbPictureUtils) {
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
				map.areas[index].$coords = nbPictureUtils.relToAbsCoords(area.shape, area.coords, width, height, round);
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
				return _.find(map.areas, {$id: areaId});
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
				if (area.$id) {
					var index = _.findIndex(map.areas, {$id: area.$id});

					if (index > -1) {
						dirty = true;
						map.areas[index] = area;
					}
				}
				// Create a new map area.
				else {
					var newArea = buildMapArea(area);
					map.areas.push(newArea);

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
				var index = _.findIndex(map.areas, {$id: areaId});

				if (index > -1) {
					dirty = true;
					map.areas.splice(index, 1);
				}

				_.forEach(map.overlays, function (overlay, overlayId) {
					var areas = map.overlays[overlayId].$areas;
					var index = _.findIndex(areas, {$id: areaId});

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
				return overlay.$areas;
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
					overlay.$areas = areas;
				}
				else {
					overlay.$areas = [];
				}
			}

			return dirty;
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
				if (area.$id) {
					dirty = true;

					var areas = overlay.$areas;
					var index = _.findIndex(areas, {$id: area.$id});

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
		 * Fired after resize event.
		 *
		 * @param {String} pictureId
		 * @param {String} overlayId
		 * @returns {Boolean} Whether the overlay areas have been changed.
		 */
		this.onResize = function (pictureId, overlayId) {
			var dirty = false;
			var overlay = self.getMapOverlay(pictureId, overlayId);

			if (overlay) {
				var highs = self.getMapOverlayAreas(pictureId, overlayId);

				if (highs.length) {
					dirty = true;

					var areas = self.getMapAreas(pictureId);
					var newHighs = [];

					// Copy recalculated highlight coordinates from map areas.
					_.forEach(highs, function (high) {
						var area = _.find(areas, {$id: high.$id});
						if (area) {
							newHighs.push(_.cloneDeep(area));
						}
					});

					self.setMapOverlayAreas(pictureId, overlayId, newHighs);
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
					index = _.findIndex(highs, {$id: areaId});

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
				$id: 'nb-picture-map-area-' + (++uniqid), // Unique ID for the map area.
				$coords: area.$coords || area.coords
			});
		}

		/**
		 * Toggles the given highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @param {Array} ids Array of area `$id` values. If none given, then all highlights are toggled.
		 * @returns {Object}
		 */
		function toggleOverlayArea (overlay, areas, highs, ids) {
			var dirty = false, newValue = highs;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(ids, function (id) {
					var index = _.findIndex(highs, {$id: id});

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
				oldValue: highs
			};
		}

		/**
		 * Shows the given highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @param {Array} ids Array of area `$id` values.
		 * @returns {Object}
		 */
		function showOverlayArea (overlay, areas, highs, ids) {
			var dirty = false, newValue = highs;

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
			return showOverlayArea(overlay, areas, highs, _.pluck(areas, '$id'));
		}

		/**
		 * Hides the given highlights.
		 *
		 * @param {Object} overlay
		 * @param {Array} areas
		 * @param {Array} highs
		 * @param {Array} ids Array of area `$id` values.
		 * @returns {Object}
		 */
		function hideOverlayArea (overlay, areas, highs, ids) {
			var dirty = false, newValue = highs;

			if (ids.length) {
				dirty = true;
				newValue = [];

				_.forEach(highs, function (old) {
					// If the highlight should not be hidden, then save it.
					if (_.indexOf(ids, old.$id) < 0) {
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
			return hideOverlayArea(overlay, areas, highs, _.pluck(highs, '$id'));
		}
	}
})(window, window.angular);