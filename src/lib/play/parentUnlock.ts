export const PARENT_SEQUENCE = "parent";
export const PARENT_LONG_PRESS_MS = 2000;

export function pushParentSequence(buffer: string, key: string) {
  if (key.length !== 1) {
    return {
      nextBuffer: buffer,
      matched: false,
    };
  }

  const nextBuffer = `${buffer}${key.toLowerCase()}`.slice(-PARENT_SEQUENCE.length);
  return {
    nextBuffer,
    matched: nextBuffer === PARENT_SEQUENCE,
  };
}
