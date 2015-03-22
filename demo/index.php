<!doctype html>
<html xmlns:ng="http://angularjs.org" lang="en" id="ng-app" ng-app="nb.picture.demo">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>nb-picture demo</title>

		<link rel="stylesheet" href="../src/css/nb-picture.css" />
		<link rel="stylesheet" href="../demo/css/app.css" />

		<script src="../bower_components/angularjs/angular.js"></script>
		<script src="../bower_components/lodash/lodash.js"></script>
		<script src="../bower_components/picturefill/dist/picturefill.js"></script>
		<script src="../bower_components/ng-stats/dist/ng-stats.js"></script>
		<script src="../bower_components/nb-i18n/dist/js/nb-i18n.js"></script>
		<script src="../bower_components/nb-lodash/dist/js/nb-lodash.js"></script>
		<script src="../bower_components/nb-icon/dist/js/nb-icon.js"></script>
<!--
		<script src="../dist/js/nb-picture.js"></script>
-->
		<script src="../src/js/nb-picture.module.js"></script>
		<script src="../src/js/nb-picture.filters.js"></script>
		<script src="../src/js/nb-picture-config.service.js"></script>
		<script src="../src/js/nb-picture.service.js"></script>
		<script src="../src/js/nb-picture-utils.service.js"></script>
		<script src="../src/js/nb-picture.controller.js"></script>
		<script src="../src/js/nb-picture.directive.js"></script>
		<script src="../src/js/nb-picture-once.directive.js"></script>
		<script src="../src/js/nb-picture-map.controller.js"></script>
		<script src="../src/js/nb-picture-map.directive.js"></script>
		<script src="../src/js/nb-picture-map-once.directive.js"></script>
		<script src="../src/js/nb-picture-map-overlay-areas.directive.js"></script>
		<script src="../src/js/nb-picture-map-overlay-utils.service.js"></script>
		<script src="../src/js/nb-picture-templates.js"></script>
		<script src="../src/js/picturefill.service.js"></script>

		<script src="js/app.js"></script>
	</head>
	<body ng-controller="mainController">
		<div>Image src: <span ng-bind="demo.styles.medium"></span></div>

		<div child-scope id="scope1">
			<div angular-stats
				 watch-count-root="#scope1"
				 watch-count=".watch-count"
				 on-watch-count-update="onWatchCountUpdate(watchCount)">
				Normal binding. Number of watches: <span class="watch-count"></span>
			</div>
			<span nb-picture
				  ng-attr-default-source="{{demo.styles.small + ', ' + demo.styles.medium + ' 2x'}}"
				  ng-attr-sources="{{'[[\'' + demo.styles.medium + ', ' + demo.styles.large + ' 2x\', \'medium\'], [\'' + demo.styles.large + ', ' + demo.styles.xlarge + ' 2x\', \'large\']]'}}"></span>
		</div>

		<div child-scope id="scope2">
			<div angular-stats
				 watch-count-root="#scope2"
				 watch-count=".watch-count"
				 on-watch-count-update="onWatchCountUpdate(watchCount)">
				One-time binding. Number of watches: <span class="watch-count"></span>
			</div>
			<span nb-picture-once
				  ng-attr-default-source="{{::(demo.styles.small + ', ' + demo.styles.medium + ' 2x')}}"
				  ng-attr-sources="{{::('[[\'' + demo.styles.medium + ', ' + demo.styles.large + ' 2x\', \'medium\'], [\'' + demo.styles.large + ', ' + demo.styles.xlarge + ' 2x\', \'large\']]')}}"></span>
		</div>
	</body>
</html>
