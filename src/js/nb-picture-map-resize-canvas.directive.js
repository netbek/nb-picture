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
		.directive('nbPictureMapResizeCanvas', nbPictureMapResizeCanvasDirective);

	function nbPictureMapResizeCanvasDirective () {
		return {
			restrict: 'EA',
			replace: true,
			controller: 'nbPictureMapResizeCanvasController',
			templateUrl: 'templates/nb-picture-map-resize-canvas.html',
			link: function (scope, element, attrs, controller) {
				controller.init();

				scope.$on('$destroy', function () {
					controller.destroy();
				});
			}
		};
	}
})(window, window.angular);