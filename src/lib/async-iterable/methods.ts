export async function* map<T, U, TReturn = any, TNext = any>(
  iterable: AsyncIterable<T, TReturn, TNext>,
  callback: (value: T) => U,
): AsyncIterableIterator<U, TReturn, TNext> {
  while (true) {
    const { done, value } = await iterable[Symbol.asyncIterator]().next();
    if (done) return value;
    yield callback(value);
  }
}

export async function collect<T, TReturn = any>(
  iterable: AsyncIterable<T, TReturn>,
): Promise<{ entries: T[]; result: TReturn }> {
  const entries: T[] = [];
  while (true) {
    const { done, value } = await iterable[Symbol.asyncIterator]().next();
    if (done) return { entries, result: value };
    entries.push(value);
  }
}
