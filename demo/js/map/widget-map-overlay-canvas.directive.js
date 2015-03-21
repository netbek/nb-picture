/**
 * AngularJS responsive image map with custom overlays
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.picture')
		.directive('widgetMapOverlayCanvas', widgetMapOverlayCanvasDirective);

	function widgetMapOverlayCanvasDirective () {
		return {
			restrict: 'EA',
			replace: true,
			scope: true,
			controller: 'widgetMapOverlayCanvasController',
			templateUrl: '../demo/templates/map/widget-map-overlay-canvas.html?_=' + Date.now(),
			link: function (scope, element, attrs, controller) {
				controller.init();

				scope.$on('$destroy', function () {
					controller.destroy();
				});
			}
		};
	}
})(window, window.angular);