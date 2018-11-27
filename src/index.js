import {
  addIndex,
  complement,
  compose,
  concat,
  curry,
  filter,
  flatten,
  isNil,
  lensProp,
  map,
  path as getPath,
  pipe,
  pipeP,
  prop,
  view
} from "ramda";
const mapIndexed = addIndex(map);
const allPromises = Promise.all.bind(Promise);
const resolve = Promise.resolve.bind(Promise);
const runIn = curry((context, validator) => validator(context));
const hasError = compose(
  complement(isNil),
  prop("message")
);
const objectLens = lensProp("object");
const getPathProp = prop("path");

export const validate = curry(function validate(validators, context) {
  const runAll = pipe(
    map(runIn(context)),
    allPromises
  );
  return pipeP(
    runAll,
    flatten,
    filter(hasError)
  )(validators);
});

const decide = curry(function decide(context, message, valid) {
  return valid ? context : { ...context, message };
});

export const check = curry(function check(func, message, context) {
  const v = pipe(
    view(objectLens),
    getPath(context.path || []),
    func,
    resolve
  );
  return pipeP(
    v,
    decide(context, message)
  )(context);
});

const concatPath = (path, context) => concat(getPathProp(context) || [], path);

export const path = curry(function path(func, message, path, context) {
  return check(func, message, { ...context, path: concatPath(path, context) });
});

export const nest = curry(function nest(nestPath, validators, context) {
  return validate(validators, {
    ...context,
    path: concatPath(nestPath, context)
  });
});

export const array = curry(function array(validators, context) {
  const values = getPath(context.path, context.object);
  if (!values) {
    return resolve([]);
  }
  return allPromises(
    mapIndexed(
      (value, index) =>
        validate(validators, {
          ...context,
          path: concatPath([index], context)
        }),
      values
    )
  );
});
