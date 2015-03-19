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
		.controller('MainController', MainController)
		.run(runBlock);

	function childScopeDirective () {
		return {
			scope: true
		};
	}

	MainController.$inject = ['$scope', '$timeout'];
	function MainController ($scope, $timeout) {
		var ngStats = showAngularStats({
			position: 'topright'
		});
		ngStats.listeners.digestLength.log = function (digestLength) {
			console.log('Digest: ' + digestLength);
		};
//		ngStats.listeners.watchCount.log = function (watchCount) {
//			console.log('Watches: ' + watchCount);
//		};

		var relMap = {
			areas: [
				{
					shape: 'rect',
					coords: [0, 0, 0.1, 0.1],
					href: 'http://example.com/',
					alt: 'Example'
				},
				{
					shape: 'rect',
					coords: [0.5, 0.5, 0.8, 0.8],
					href: 'https://developer.mozilla.org/',
					alt: 'MDN'
				}
			],
			resize: true,
			relCoords: true,
			highlight: {
				enable: true,
				fill: true,
				fillColor: 'FF0000',
				fillOpacity: 0.5,
				alwaysOn: false
			}
		};

		var absMap = {
			areas: [
				{
					shape: 'rect',
					coords: [0, 0, 10, 10],
					href: 'http://example.com/',
					alt: 'Example'
				},
				{
					shape: 'rect',
					coords: [50, 80, 100, 180],
					href: 'https://developer.mozilla.org/',
					alt: 'MDN'
				}
			],
			resize: true,
			relCoords: false,
			highlight: {
				enable: true,
				fill: true,
				fillColor: 'FF0000',
				fillOpacity: 0.5,
				alwaysOn: true
			}
		};

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

		$scope.demoMap = {
			map: relMap,
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