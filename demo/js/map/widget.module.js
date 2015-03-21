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
		.module('widget', [
			'angularStats',
			'nb.picture',
			'nb.icon'
		])
		.config(['nbIconConfigProvider',
			function (nbIconConfigProvider) {
				nbIconConfigProvider.set({
					colors: {
						black: '#000',
						blue: '#0000FF'
					},
					prefix: 'icon',
					pngUrl: '../demo/img/',
					size: 256
				});
			}])
		.directive('childScope', childScopeDirective);

	function childScopeDirective () {
		return {
			scope: true
		};
	}
})(window, window.angular);