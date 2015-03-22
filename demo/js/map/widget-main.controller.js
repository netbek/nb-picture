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

		$scope.images = [
			{
				map: {
					areas: [
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
						}
					],
					resize: true,
					relCoords: true,
					overlays: {
						canvas: {
//							alwaysOn: true,
							hover: true,
							fill: true,
							fillColor: 'FF0000',
							fillOpacity: 0.5
						},
						markers: {
							alwaysOn: true,
							icon: {
								id: 'marker'
							}
						}
					}
				},
				width: 960,
				height: 1236,
				styles: {
					small: 'img/diphyllodes-chrysoptera-120.jpg',
					medium: 'img/diphyllodes-chrysoptera-240.jpg',
					large: 'img/diphyllodes-chrysoptera-480.jpg',
					xlarge: 'img/diphyllodes-chrysoptera-960.jpg'
				}
			},
			{
				map: {
					areas: [
						{
							shape: 'rect',
							coords: [0, 0, 0.1, 0.1],
							title: 'Example',
							href: 'http://example.com'
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
//							alwaysOn: true,
							hover: true,
							fill: true,
							fillColor: 'FF0000',
							fillOpacity: 0.5
						},
						markers: {
							alwaysOn: true,
							icon: {
								id: 'marker'
							}
						}
					}
				},
				width: 960,
				height: 1236,
				styles: {
					small: 'img/diphyllodes-speciosa-120.jpg',
					medium: 'img/diphyllodes-speciosa-240.jpg',
					large: 'img/diphyllodes-speciosa-480.jpg',
					xlarge: 'img/diphyllodes-speciosa-960.jpg'
				}
			}
		];
	}
})(window, window.angular);