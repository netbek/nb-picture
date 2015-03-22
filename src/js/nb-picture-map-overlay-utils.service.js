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
		 * @see nbPictureService.resizeMap()
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