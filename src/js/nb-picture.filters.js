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
		.filter('join', function () {
			return function (input, delimiter) {
				if (angular.isArray(input)) {
					return input.join(angular.isDefined(delimiter) ? delimiter : ',');
				}
				return '';
			};
		});
})(window, window.angular);