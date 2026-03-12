export async function hashPin(pin: string) {
  const data = new TextEncoder().encode(pin.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashBytes = Array.from(new Uint8Array(hashBuffer));
  return hashBytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
