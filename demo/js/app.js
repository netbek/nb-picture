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

		$timeout(function () {
			$scope.demo.styles = {
				small: 'http://lorempixel.com/180/240/abstract/5',
				medium: 'http://lorempixel.com/360/480/abstract/5',
				large: 'http://lorempixel.com/720/960/abstract/5',
				xlarge: 'http://lorempixel.com/1440/1920/abstract/5'
			};
		}, 5000);
	}

	function runBlock () {
	}
})(window, window.angular);