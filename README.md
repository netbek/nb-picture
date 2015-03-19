# nb-picture

AngularJS directive for responsive images and image maps

## Usage

One-time bindings. Note that `sources` should be defined from small to large, unlike in [Picturefill](https://github.com/scottjehl/picturefill) v2.

```
	<span nb-picture-once
		  ng-attr-default-source="{{::(image.styles.small + ', ' + image.styles.medium + ' 2x')}}"
		  ng-attr-sources="{{::('[[\'' + image.styles.medium + ', ' + image.styles.large + ' 2x\', \'medium\'], [\'' + image.styles.large + ', ' + image.styles.xlarge + ' 2x\', \'large\']]')}}"></span>
```

## To do

* Throttle canvas redraw on window resize
* Support `circle` and `poly` shapes