# Vanilla Kinetic

> Based on [Dave Taylor](http://davetayls.me)'s [jQuery Kinetic](https://github.com/davetayls/jquery.kinetic/) - kudos!

vanilla-kinetic is a simple library which adds smooth drag scrolling with gradual deceleration and zooming to containers.

> WARNING: This software is currently in beta state. No docs, missing features. Beware. Expect stable version soon.
> API will slightly change.

## Usage
### Basic
```javascript
import { VanillaKinetic } from "vanilla-kinetic";

const container = document.getElementById("container");
const instance = new VanillaKinetic(container);
```

> Note: Your container must have a single child element with a class `kinetic-middle`. Put the contents inside.
> This library requires it but avoids adding it to prevent surprising devs with unexpected wrapper element.

### React

> React wrapper will come soon.

### Options

> Docs coming soon.

## Demo

> Soon.

## Compatibility

This library should work with every browser released after ~2017.

## License

MIT
