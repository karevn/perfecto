import {
  validate,
  nest,
  array,
  path,
  check,
  predicate,
  mapToFormikErrors,
  validateForm
} from "../src";
import * as R from "ramda";
const notPresentPredicate = R.or(R.isNil, R.isEmpty);
export const present = path(R.complement(notPresentPredicate));
export const notPresent = path(notPresentPredicate);

const presentPredicate = R.complement(R.or(R.isNil, R.isEmpty));
const makeAsync = predicate => value => Promise.resolve(predicate(value));
const presentP = path(makeAsync(presentPredicate));

const isJediPredicate = person => !!person.isJedi;
const isJedi = check(isJediPredicate, "Jedi he is not");

describe("#check()", () => {
  it("should return an error if there is any", () =>
    expect(validate([isJedi], { object: { name: "Jabba" } })).resolves.toEqual([
      { message: "Jedi he is not", path: [] }
    ]));
  it("returns no errors if all is OK", () =>
    expect(
      validate([isJedi], { object: { name: "Luke", isJedi: true } })
    ).resolves.toEqual([]));
});

describe("#validate()", () => {
  it("Gathers plain errors", () => {
    const validator = [
      object => Promise.resolve({ path: ["foo"], message: "bar" })
    ];
    return expect(
      validate(validator, { object: { foo: "bar", bar: "foo" } })
    ).resolves.toEqual([{ path: ["foo"], message: "bar" }]);
  });

  it("Gathers async present validator errors", () => {
    const validator = [presentP("error", ["foo2"])];
    return expect(
      validate(validator, { object: { foo: "bar", bar: "foo" } })
    ).resolves.toEqual([{ path: ["foo2"], message: "error" }]);
  });

  it("Gathers nested errors", () => {
    const validator = [nest(["foo"], [presentP("error", ["bar"])])];
    return expect(validate(validator, { object: {} })).resolves.toEqual([
      { path: ["foo", "bar"], message: "error" }
    ]);
  });
});

describe("#present()", () => {
  it("should return an error if the field is required", () => {
    expect(present("error", ["foo"], {})).resolves.toEqual({
      path: ["foo"],
      message: "error"
    });
  });
});

describe("#nest()", () => {
  it("Add prefix to errors", () => {
    return expect(
      nest(["bar"], [present("error", ["foo"])], {
        object: {}
      })
    ).resolves.toEqual([{ path: ["bar", "foo"], message: "error" }]);
  });

  it("All ok if there are no errors", () => {
    return expect(
      nest(["bar"], [present("error", ["foo"])], {
        object: { bar: { foo: "bar" } }
      })
    ).resolves.toEqual([]);
  });
});

describe("Ramda", () => {
  it("Takes paths", () => {
    const obj = {
      a: [{ b: 1 }]
    };
    const lens = R.lensPath(["a", 0, "b"]);
    expect(R.view(lens, obj)).toBe(1);
  });
});

describe("#array()", () => {
  it("add array index to errors", () => {
    const object = { bar: [{ yo: "fo" }] };
    return expect(
      nest(["bar"], [array([present("error", ["foo"])])])({
        object
      })
    ).resolves.toEqual([{ path: ["bar", 0, "foo"], message: "error" }]);
  });

  it("dont add anything if there are no array errors", () => {
    const object = { bar: [{ foo: true }, { foo: true }] };
    return expect(
      nest(["bar"], [array([present("error", ["foo"])])])({
        object
      })
    ).resolves.toEqual([]);
  });

  it("no errors for empty arrays", () => {
    const validator = array([isJedi]);
    return expect(validate([validator], { object: [] })).resolves.toEqual([]);
  });

  it("no errors for null", () => {
    const validator = array([isJedi]);
    return expect(validate([validator], { object: null })).resolves.toEqual([]);
  });

  it("works fine with check and array", () => {
    const validator = array([isJedi]);
    const object = [{ name: "Bob" }, { name: "Joe" }];
    return expect(validate([validator], { object })).resolves.toEqual([
      {
        message: "Jedi he is not",
        path: [0]
      },
      {
        message: "Jedi he is not",
        path: [1]
      }
    ]);
  });

  it("works with #check()", () => {
    const people = [{ name: "Bob" }, { name: "Joe" }];
    return expect(array([isJedi], { object: people })).resolves.toEqual([
      [{ path: [0], message: "Jedi he is not" }],
      [{ path: [1], message: "Jedi he is not" }]
    ]);
  });
});

describe("#predicate()", () => {
  const hasSword = present("Got no sword", ["sword"]);
  const isJediCheck = R.compose(
    isJediPredicate,
    R.prop("object")
  );

  it("omits validators if predicate returns false", () =>
    expect(
      validate([predicate(isJediCheck, [hasSword])], {
        object: { name: "Luke", sword: "Lightsword", isJedi: true }
      })
    ).resolves.toEqual([]));

  it("runs validators if predicate returns true", () =>
    expect(
      validate([predicate(isJediCheck, [hasSword])], {
        object: { name: "Luke", isJedi: true }
      })
    ).resolves.toEqual([{ path: ["sword"], message: "Got no sword" }]));
});

describe("#mapToFormikErrors", () => {
  it("transforms simple paths to Formik errors", () => {
    expect(mapToFormikErrors([{ path: ["foo"], message: "bar" }])).toEqual({
      foo: "bar"
    });
  });

  it("transforms nested paths to Formik errors", () => {
    expect(
      mapToFormikErrors([{ path: ["foo", "foo2"], message: "bar" }])
    ).toEqual({
      foo: { foo2: "bar" }
    });
  });

  it("transforms nested array paths to Formik errors", () => {
    expect(
      mapToFormikErrors([{ path: ["foo", 0, "foo2"], message: "bar" }])
    ).toEqual({
      foo: [{ foo2: "bar" }]
    });
  });
});

describe("#validateForm", () => {
  const validator = [present("is required", ["name"])];

  it("throws errors if any", () =>
    expect(validateForm(validator, {})).rejects.toEqual({
      name: "is required"
    }));

  it("resolves to an empty object if all is fine", () =>
    expect(validateForm(validator, { name: "Luke" })).resolves.toEqual({}));
});
