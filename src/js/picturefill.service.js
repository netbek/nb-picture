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
		.factory('picturefill', Picturefill);

	Picturefill.$inject = ['$window'];
	function Picturefill ($window) {
		return $window.picturefill;
	}
})(window, window.angular);