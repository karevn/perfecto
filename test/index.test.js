import { validate, nest, array, path } from "../src"
import * as R from "ramda"
const notPresentPredicate = R.or(R.isNil, R.isEmpty)
export const present = path(R.complement(notPresentPredicate))
export const notPresent = path(notPresentPredicate)

const presentPredicate = R.complement(R.or(R.isNil, R.isEmpty))
const makeAsync = predicate => value => Promise.resolve(predicate(value))
const presentP = path(makeAsync(presentPredicate))

describe("#validate()", () => {
  it("Gathers plain errors", () => {
    const validator = [
      object => Promise.resolve({ path: ["foo"], message: "bar", object })
    ]
    return expect(
      validate(validator, { foo: "bar", bar: "foo" })
    ).resolves.toEqual([
      { path: ["foo"], message: "bar", object: { foo: "bar", bar: "foo" } }
    ])
  })

  it("Gathers async present validator errors", () => {
    const validator = [presentP("error", ["foo2"])]
    return expect(
      validate(validator, { object: { foo: "bar", bar: "foo" } })
    ).resolves.toEqual([
      { path: ["foo2"], message: "error", object: { foo: "bar", bar: "foo" } }
    ])
  })

  it("Gathers nested errors", () => {
    const validator = [nest(["foo"], [presentP("error", ["bar"])])]
    return expect(validate(validator, { object: {} })).resolves.toEqual([
      { path: ["foo", "bar"], message: "error", object: {} }
    ])
  })
})

describe("#present()", () => {
  it("should return an error if the field is required", () => {
    expect(present("error", ["foo"], {})).resolves.toEqual({
      path: ["foo"],
      message: "error"
    })
  })
})

describe("#nest()", () => {
  it("Add prefix to errors", () => {
    return expect(
      nest(["bar"], [present("error", ["foo"])], {
        object: {}
      })
    ).resolves.toEqual([{ path: ["bar", "foo"], message: "error", object: {} }])
  })
  it("All ok if there are no errors", () => {
    return expect(
      nest(["bar"], [present("error", ["foo"])], {
        object: { bar: { foo: "bar" } }
      })
    ).resolves.toEqual([])
  })
})

describe("Ramda", () => {
  it("Takes paths", () => {
    const obj = {
      a: [{ b: 1 }]
    }
    const lens = R.lensPath(["a", 0, "b"])
    expect(R.view(lens, obj)).toBe(1)
  })
})

describe("#array()", () => {
  it("add index to errors", () => {
    const object = { bar: [{ yo: "fo" }] }
    return expect(
      nest(["bar"], [array([present("error", ["foo"])])])({
        object
      })
    ).resolves.toEqual([{ path: ["bar", 0, "foo"], message: "error", object }])
  })
  it("dont add anything if there are no array errors", () => {
    const object = { bar: [{ foo: true }, { foo: true }] }
    return expect(
      nest(["bar"], [array([present("error", ["foo"])])])({
        object
      })
    ).resolves.toEqual([])
  })
})
