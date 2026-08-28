export function omitUndefinedValues<Value>(value: Value): Value {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => omitUndefinedValues(item)) as Value;
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entryValue]) => entryValue !== undefined)
        .map(([key, entryValue]) => [key, omitUndefinedValues(entryValue)]),
    ) as Value;
  }

  return value;
}
