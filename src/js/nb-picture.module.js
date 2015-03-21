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
		.module('nb.picture', [
			'nb.i18n',
			'nb.lodash',
			'nb.picture.templates'
		])
		.constant('PICTURE_POSITION', {
			'LEFT_TOP': 'left top',
			'LEFT_BOTTOM': 'left bottom',
			'RIGHT_TOP': 'right top',
			'RIGHT_BOTTOM': 'right bottom'
		});
})(window, window.angular);