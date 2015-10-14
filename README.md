# nb-picture

AngularJS directive for responsive images and image maps

## Usage

### Configuration

In testing, IE9 with Picturefill 3 only loads the default image if the media query includes the media type, e.g. `screen and (min-width: 640px)`. Works if omitting the media type, e.g. `(min-width: 640px)`. Picturefill 2.3.1 works with and without the media type.

Example:
```
angular
	.module('app', [])
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
		}]);
```

### Images

One-time bindings. Note that `sources` should be defined from small to large, unlike in [Picturefill](https://github.com/scottjehl/picturefill) v2.

```
<span nb-picture-once
      ng-attr-default-source="{{::(widget.styles.small + ', ' + widget.styles.medium + ' 2x')}}"
      ng-attr-sources="{{::('[[\'' + widget.styles.medium + ', ' + widget.styles.large + ' 2x\', \'medium\'], [\'' + widget.styles.large + ', ' + widget.styles.xlarge + ' 2x\', \'large\']]')}}"></span>
```

### Image maps

One-time bindings with default areas overlay.

```
<span nb-picture-map-once
      ng-attrs-map="{{::widget.map}}"
      ng-attr-default-source="{{::(widget.styles.small + ', ' + widget.styles.medium + ' 2x')}}"
      ng-attr-sources="{{::('[[\'' + widget.styles.medium + ', ' + widget.styles.large + ' 2x\', \'medium\'], [\'' + widget.styles.large + ', ' + widget.styles.xlarge + ' 2x\', \'large\']]')}}">
  <span nb-picture-map-overlay-areas></span>
</span>
```

### Custom overlays for image maps

See `/demo/map.php` for an example with highlighted areas and SVG markers.


## Development

### Usage

Watch for changes to source files and build production files:

```
guard
```

### Install

```
gem install bundler
bundle install
```


## Credits

* Image of [Diphyllodes chrysoptera](http://commons.wikimedia.org/wiki/File:!Diphyllodes_chrysoptera!.jpg) by [Daniel Giraud Elliot](https://en.wikipedia.org/wiki/Daniel_Giraud_Elliot) (public domain)
* Image of [Diphyllodes speciosa](http://commons.wikimedia.org/wiki/File:!Diphyllodes_speciosa!.jpg) by [Daniel Giraud Elliot](https://en.wikipedia.org/wiki/Daniel_Giraud_Elliot) (public domain)
* Icons by [IcoMoon](https://icomoon.io) (CC BY 4.0 or GPL)