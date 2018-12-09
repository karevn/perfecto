# Perfecto

A tiny dead-simple declarative validation framework. Some people may call it a "specification framework". It helps you to
build your validators by composing simple error checkers aka predicates to build a final function, that's going
to receive your state or form data and return a promise resolving to the array of the errors found.

## Installation

Using [npm](https://www.npmjs.com/):

```bash
npm install perfecto --save
```

## Use cases

Perfecto was initially designed to work as an asynchronous validation framework used with [redux-form](https://redux-form.com/). It also works great with [Formik](https://github.com/jaredpalmer/formik) and was
used as the go-to server-side validation library.

## Features

- Asynchronous by nature, but usable with synchronous validators with no efforts.
- Parallel validation for asynchronous validation operations.
- Full access to the validated object (at will).
- Composable.
- Code reuse between front- and backend (if you know how to DI).
- Curried validator functions.

## Examples

[Formik validation - shamelessly stolen from Formik demo with some polish](https://codesandbox.io/s/ypyy4m05pv)

[Redux Form validation - stolen from Redux-Form async validatione example](https://codesandbox.io/s/24no1mpwy0)

### Asynchronous validation

### Express server-side validation

```js
const perfecto = require("perfecto");

const isPresent = value => !!value;
const isPresentValidator = perfecto.path(isPresent, "is required!");

// We only do some basic validation in this case
const orderValidator = perfecto.validate([
  isPresentValidator(["name"]),
  isPresentValidator(["address"]),
  isPresentValidator(["product"])
]);

module.exports = async (req, resp, next) => {
  const order = req.body;
  const errors = await orderValidator(order);
  // Errors array contains the list of the error paths and messages, if any
  if (errors.length) {
    res.send({ errors });
  } else {
    res.send({ ok: true });
  }
};
```

### Validator with direct access to the object

[Play with it at CodeSandbox](https://codesandbox.io/s/94zm4orvw4)

```js
import renderErrors from "./errors";

import { validate, check, array } from "perfecto";

const isTheOnlyJediPredicate = (value, validationContext) =>
  validationContext.object.length === 1 && value.isJedi;
// Build a validator with an error message used when the predicate returns falsy value.
const isTheOnlyValidator = check(
  isTheOnlyJediPredicate,
  "The only should he be"
);
const people = [
  {
    name: "Luke",
    isJedi: true
  },
  { name: "Obi Wan", isJedi: true }
];
validate([array([isTheOnlyValidator])], { object: people }).then(console.info);
```

### Nested objects

[Play with it at CodeSandbox](https://codesandbox.io/s/qvpzvk56q4)

```js
import { path, validate, nest } from "perfecto";

// Checks if the person name is Darth Vader
const isDarth = path(
  name => name === "Darth Vader",
  "His father is Darth Vader not!",
  ["name"]
);

// If father's name is Darth Vader
const fatherIsDarth = nest(["father"], [isDarth]);

/// Of course it is not!
validate([fatherIsDarth], {
  object: { name: "Carl", father: { name: "Tom" } }
}).then(console.info);

// Output: [{path: ["father", "name"], message: "His father is darth vader not!"}]
```

### Arrays

[Play with it at CodeSandbox](https://codesandbox.io/s/7k1r52vmox)

```js
import { validate, check, array } from "perfecto";

const isJediPredicate = person => !!person.isJedi;
// Checks if the person is Jedi
const isJedi = check(isJediPredicate, "Jedi is he not!");

const everyoneIsAJedi = array([isJedi]);

validate([everyoneIsAJedi], {
  object: [
    { name: "Han" },
    { name: "Luke", isJedi: true },
    { name: "Darth Vader", isJedi: true }
  ]
}).then(console.info);
```

### Conditional validation

[Play with it at CodeSandbox](https://codesandbox.io/s/8zz3nk8470)

```js
import { validate, check, path, predicate, array } from "perfecto";

const isJediPredicate = person => !!person.isJedi;
// Checks if the person is Jedi
const isJedi = check(isJediPredicate, "Jedi is he not!");
const isPresentPredicate = value => !!value;
const hasSword = path(isPresentPredicate, "Should be there", ["sword"]);

const isJediCheck = context => context.object[context.path[0]].isJedi;

// Luke is a Jedi so he has to have a sword... But he does not for some reason
// And Han is not a Jedi at all :)
validate([array([predicate(isJediCheck, [hasSword])])], {
  object: [{ name: "Luke", isJedi: true }, { name: "Han", isJedi: false }]
}).then(console.info);
```
