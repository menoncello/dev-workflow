import type { JWTOption } from "@elysiajs/jwt";
import env from "#helpers/env";

const jwtConfig: JWTOption = {
  name: "jwt",
  secret: env.JWT_SECRET,
  exp: env.JWT_EXPIRES_IN || "24h",
};

export { jwtConfig };
