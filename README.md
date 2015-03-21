# nb-picture

AngularJS directive for responsive images and image maps

## Usage

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


## To do

* Demo image map: Throttle canvas redraw on window resize.


## Credits

* Demo icons by [IcoMoon](https://icomoon.io) (CC BY 4.0 or GPL)