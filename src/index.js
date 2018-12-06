import {
  addIndex,
  complement,
  compose,
  composeP,
  concat,
  curry,
  filter,
  flatten,
  isNil,
  identity,
  map,
  path as getPath,
  prop,
  propOr,
  ifElse,
  always,
  pathOr,
  set,
  lensPath,
  reduce
} from "ramda";

const mapIndexed = addIndex(map);
const allPromises = Promise.all.bind(Promise);
const resolve = Promise.resolve.bind(Promise);
const runIn = context => validator => validator(context);
const getPathProp = propOr([], "path");
const isPresent = complement(isNil);
const isPresentFilter = filter(isPresent);
const getValue = compose(
  getPath,
  getPathProp
);
const getPathOrArray = pathOr([]);
const getObject = prop("object");
const getNull = always(null);

const runAllInContext = context =>
  compose(
    allPromises,
    compose(
      map,
      runIn
    )(context)
  );

export const validate = curry(function validate(validators, context) {
  return composeP(
    isPresentFilter,
    flatten,
    runAllInContext(context)
  )(validators);
});

const createError = (context, message) =>
  always({
    path: getPathProp(context),
    message
  });

export const check = curry(function check(func, message, context) {
  const validate = compose(
    resolve,
    value => func(value, context, message),
    getValue(context),
    getObject
  );
  return composeP(
    ifElse(identity, getNull, createError(context, message)),
    validate
  )(context);
});

const nestPath = (path, context) => concat(getPathProp(context), path);
const withNestedPath = (context, path) => ({
  ...context,
  path: nestPath(path, context)
});

export const path = curry(function path(func, message, path, context) {
  return check(func, message, withNestedPath(context, path));
});

export const nest = curry(function nest(nestPath, validators, context) {
  return validate(validators, withNestedPath(context, nestPath));
});

export const array = curry(function array(validators, context) {
  return compose(
    allPromises,
    mapIndexed((_, index) => nest([index], validators, context)),
    getPathOrArray(getPathProp(context)),
    getObject
  )(context);
});

export const predicate = curry(function predicate(
  predicateFunc,
  validators,
  context
) {
  return composeP(
    ifElse(identity, () => validate(validators, context), always([])),
    compose(
      resolve,
      predicateFunc
    )
  )(context);
});

const addFormikError = (errors, error) =>
  set(lensPath(error.path), error.message, errors);
export const mapToFormikErrors = reduce(addFormikError, {});
export const validateFormik = composeP(
  mapToFormikErrors,
  validate
);
