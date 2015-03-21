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
		.module('widget')
		.controller('widgetMainController', widgetMainController);

	widgetMainController.$inject = ['$scope', '$timeout'];
	function widgetMainController ($scope, $timeout) {
		var ngStats = showAngularStats({
			position: 'topright'
		});
		ngStats.listeners.digestLength.log = function (digestLength) {
			console.log('Digest: ' + digestLength);
		};
//		ngStats.listeners.watchCount.log = function (watchCount) {
//			console.log('Watches: ' + watchCount);
//		};

		$scope.widget = {
			map: {
				areas: [
					{
						shape: 'rect',
						coords: [0, 0, 0.1, 0.1],
						title: 'Example',
						href: 'http://example.com'
					},
					{
						shape: 'rect',
						coords: [0.5, 0.5, 0.8, 0.8]
					},
					{
						shape: 'poly',
						coords: [
							0.4, 0.4,
							0.2, 0.4,
							0.2, 0.2,
							0.4, 0.2
						]
					},
					{
						shape: 'circle',
						coords: [0.8, 0.2, 0.1]
					}
				],
				resize: true,
				relCoords: true,
				overlays: {
					canvas: {
						alwaysOn: true,
						fill: true,
						fillColor: 'FF0000',
						fillOpacity: 0.5
					},
					markers: {
						alwaysOn: true,
						icon: {
							id: '0073-location2'
						}
					}
				}
			},
			width: 720,
			height: 960,
			styles: {
				small: 'img/128.jpg',
				medium: 'img/256.jpg',
				large: 'img/512.jpg',
				xlarge: 'img/1024.jpg'
			}
		};
	}
})(window, window.angular);