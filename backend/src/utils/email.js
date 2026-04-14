export function validateEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !regex.test(email)) {
    const err = new Error("Invalid email address.");
    err.statusCode = 400;
    throw err;
  }
}
