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