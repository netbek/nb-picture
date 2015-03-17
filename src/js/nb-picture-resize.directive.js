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
		.directive('nbPictureResize', nbPictureResizeDirective);

	function nbPictureResizeDirective () {
		return {
			restrict: 'EA',
			replace: true,
			templateUrl: 'templates/nb-picture-resize.html',
			link: function (scope, element, attrs, controller) {
			}
		};
	}
})(window, window.angular);