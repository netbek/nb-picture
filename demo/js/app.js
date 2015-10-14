/**
 * AngularJS responsive images demo
 *
 * @author Hein Bekker <hein@netbek.co.za>
 * @copyright (c) 2015 Hein Bekker
 * @license http://www.gnu.org/licenses/agpl-3.0.txt AGPLv3
 */

(function (window, angular, undefined) {
	'use strict';

	angular
		.module('nb.picture.demo', [
			'angularStats',
			'nb.picture'
		])
		.config(['nbPictureConfigProvider',
			function (nbPictureConfigProvider) {
				nbPictureConfigProvider.set({
					mediaqueries: {
						small: '(min-width: 0px)',
						medium: '(min-width: 640px)',
						large: '(min-width: 992px)',
						xlarge: '(min-width: 1440px)',
						xxlarge: '(min-width: 1920px)',
						landscape: '(orientation: landscape)',
						portrait: '(orientation: portrait)',
						// http://css-tricks.com/snippets/css/retina-display-media-query
						retina: '(-webkit-min-device-pixel-ratio: 2), ' +
							'(min--moz-device-pixel-ratio: 2), ' +
							'(-o-min-device-pixel-ratio: 2/1), ' +
							'(min-device-pixel-ratio: 2), ' +
							'(min-resolution: 192dpi), ' +
							'(min-resolution: 2dppx)'
					}
				});
			}])
		.directive('childScope', childScopeDirective)
		.controller('mainController', mainController)
		.run(runBlock);

	function childScopeDirective () {
		return {
			scope: true
		};
	}

	mainController.$inject = ['$scope', '$timeout'];
	function mainController ($scope, $timeout) {
		var ngStats = showAngularStats({
			position: 'topright'
		});
		ngStats.listeners.digestLength.log = function (digestLength) {
			console.log('Digest: ' + digestLength);
		};
//		ngStats.listeners.watchCount.log = function (watchCount) {
//			console.log('Watches: ' + watchCount);
//		};

		$scope.demo = {
			width: 720,
			height: 960,
			styles: {
				small: 'http://lorempixel.com/180/240/abstract/2',
				medium: 'http://lorempixel.com/360/480/abstract/2',
				large: 'http://lorempixel.com/720/960/abstract/2',
				xlarge: 'http://lorempixel.com/1440/1920/abstract/2'
			}
		};

//		$timeout(function () {
//			$scope.demo.styles = {
//				small: 'http://lorempixel.com/180/240/abstract/5',
//				medium: 'http://lorempixel.com/360/480/abstract/5',
//				large: 'http://lorempixel.com/720/960/abstract/5',
//				xlarge: 'http://lorempixel.com/1440/1920/abstract/5'
//			};
//		}, 5000);
	}

	function runBlock () {
	}
})(window, window.angular);