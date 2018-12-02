# Perfecto

A tiny declarative validation framework. Some people may call it a "specification framework". It helps you to
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

### Simple validation with synchronous predicate

[Play with it at CodeSandbox](https://codesandbox.io/s/94zm4orvw4)

```js
import { path, validate } from "perfecto";

const isPresentPredicate = (value, validationContext) => !!value;
// Build a validator with an error message used when the predicate returns falsy value.
const isPresentValidator = path(isPresentPredicate, "This field is required");
const person = {
  firstName: "Luke",
  lastName: ""
};
const personValidator = [
  isPresentValidator(["firstName"]),
  isPresentValidator(["lastName"])
];
validate(personValidator, { object: person }).then(console.info);
// Output: [{path: ["lastName"], message: "This field is required"}]
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

const isJediPredicate = person => person.isJedi;
// Checks if the person is Jedi
const isJedi = check(isJediPredicate, "Jedi is he not!");

const everyoneIsAJedi = array(isJedi);

validate(
  [everyoneIsAJedi],
  [
    { name: "Han" },
    { name: "Luke, isJedi: true" },
    { name: "Darth Vader", isJedi: true }
  ]
).then(console.info);
// Output: [{path: ["father", "name"], message: "His father is darth vader not!"}]
```
