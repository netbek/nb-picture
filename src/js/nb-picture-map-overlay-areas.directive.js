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
				var watch = scope.$watch('$parent.$parent.picture.$id', function (newValue, oldValue) {
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