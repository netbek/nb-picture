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
				scope.$on('nbPicture:baseLoad', function (e, pictureId) {
					var picture = nbPictureService.getPicture(pictureId);
					var map = nbPictureService.getMap(pictureId);

					scope.alt = picture && picture.img ? picture.img.alt : '';
					scope.usemap = map && map.name ? '#' + map.name : '';
				});
			}
		};
	}
})(window, window.angular);