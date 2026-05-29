const crypto = require("crypto");

const getSecret = () => process.env.JWT_SECRET || process.env.SESSION_SECRET || "vocademy-dev-secret-change-me";

const base64url = (value) => Buffer.from(value).toString("base64url");

const sign = (payload) => {
  const data = base64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");

  return `${data}.${signature}`;
};

const verify = (token) => {
  if (!token || !token.includes(".")) {
    return null;
  }

  const [data, signature] = token.split(".");
  const expectedSignature = crypto.createHmac("sha256", getSecret()).update(data).digest("base64url");

  if (
    signature.length !== expectedSignature.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));

    if (payload.exp && Date.now() > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
};

const createAuthToken = (user) =>
  sign({
    sub: user._id.toString(),
    role: user.role,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
  });

module.exports = {
  createAuthToken,
  verify,
};
