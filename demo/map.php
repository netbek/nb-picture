<!doctype html>
<html xmlns:ng="http://angularjs.org" lang="en" id="ng-app" ng-app="widget">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1.0" />
		<title>nb-picture-map demo</title>

		<link rel="stylesheet" href="../src/css/nb-picture.css" />
		<link rel="stylesheet" href="../bower_components/nb-icon/dist/css/nb-icon.css" />
		<link rel="stylesheet" href="../demo/css/map/widget.css" />

		<script src="../bower_components/angularjs/angular.js"></script>
		<script src="../bower_components/lodash/lodash.js"></script>
		<script src="../bower_components/picturefill/dist/picturefill.js"></script>
		<script src="../bower_components/ng-stats/dist/ng-stats.js"></script>
		<script src="../bower_components/nb-i18n/dist/js/nb-i18n.js"></script>
		<script src="../bower_components/nb-lodash/dist/js/nb-lodash.js"></script>
		<script src="../bower_components/nb-icon/dist/js/nb-icon.js"></script>

		<script src="../dist/js/nb-picture.js"></script>
<!--
		<script src="../src/js/nb-picture.module.js"></script>
		<script src="../src/js/nb-picture.filters.js"></script>
		<script src="../src/js/nb-picture-config.service.js"></script>
		<script src="../src/js/nb-picture.service.js"></script>
		<script src="../src/js/nb-picture-util.service.js"></script>
		<script src="../src/js/nb-picture.controller.js"></script>
		<script src="../src/js/nb-picture.directive.js"></script>
		<script src="../src/js/nb-picture-once.directive.js"></script>
		<script src="../src/js/nb-picture-map.controller.js"></script>
		<script src="../src/js/nb-picture-map.directive.js"></script>
		<script src="../src/js/nb-picture-map-once.directive.js"></script>
		<script src="../src/js/nb-picture-map-overlay-areas.directive.js"></script>
		<script src="../src/js/nb-picture-templates.js"></script>
		<script src="../src/js/picturefill.service.js"></script>
-->
		<script src="js/map/widget.module.js"></script>
		<script src="js/map/widget-main.controller.js"></script>
		<script src="js/map/widget-map-overlay-canvas.controller.js"></script>
		<script src="js/map/widget-map-overlay-canvas.directive.js"></script>
		<script src="js/map/widget-map-overlay-markers.controller.js"></script>
		<script src="js/map/widget-map-overlay-markers.directive.js"></script>
	</head>
	<body>
		<div class="visuallyhidden"><?php print(file_get_contents(dirname(__FILE__) . '/svg/icon.svg')); ?></div>

		<div ng-controller="widgetMainController">

			<div child-scope id="scope1">
				<div angular-stats
					 watch-count-root="#scope1"
					 watch-count=".watch-count"
					 on-watch-count-update="onWatchCountUpdate(watchCount)">
					Normal binding. Number of watches: <span class="watch-count"></span>
				</div>
				<span nb-picture-map
					  ng-attr-map="{{images[0].map}}"
					  ng-attr-default-source="{{images[0].styles.small + ', ' + images[0].styles.medium + ' 2x'}}"
					  ng-attr-sources="{{'[[\'' + images[0].styles.medium + ', ' + images[0].styles.large + ' 2x\', \'medium\'], [\'' + images[0].styles.large + ', ' + images[0].styles.xlarge + ' 2x\', \'large\']]'}}">
					<span widget-map-overlay-canvas></span>
					<span widget-map-overlay-markers></span>
					<span nb-picture-map-overlay-areas></span>
				</span>
			</div>

			<div child-scope id="scope2">
				<div angular-stats
					 watch-count-root="#scope2"
					 watch-count=".watch-count"
					 on-watch-count-update="onWatchCountUpdate(watchCount)">
					One-time binding. Number of watches: <span class="watch-count"></span>
				</div>
				<span nb-picture-map-once
					  ng-attr-map="{{::images[1].map}}"
					  ng-attr-default-source="{{::(images[1].styles.small + ', ' + images[1].styles.medium + ' 2x')}}"
					  ng-attr-sources="{{::('[[\'' + images[1].styles.medium + ', ' + images[1].styles.large + ' 2x\', \'medium\'], [\'' + images[1].styles.large + ', ' + images[1].styles.xlarge + ' 2x\', \'large\']]')}}">
					<span widget-map-overlay-canvas></span>
					<span widget-map-overlay-markers></span>
					<span nb-picture-map-overlay-areas></span>
				</span>
			</div>

		</div>
	</body>
</html>
