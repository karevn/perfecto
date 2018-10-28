## Usage

```js

import {path, validate, nest, array} from 'perfecto'

// Checks if the person name is Bob
const isBob = path(name => name === 'Bob', 'name', 'Name should be Bob!')

// If father's name is Bob
const fatherIsBob = nest('father', [isBob])

const allChildrenAreBobs = nest('children', [array(isBob)])

/// Will output errors
console.info(validate([isBob], {name: 'Carl'}))
```
