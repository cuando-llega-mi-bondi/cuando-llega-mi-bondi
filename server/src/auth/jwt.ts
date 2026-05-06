import { SignJWT, jwtVerify } from "jose";
import { env } from "../env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export type JwtPayload = {
    sub: string;
    email: string;
    nombre?: string;
    persona_id?: string;
};

export async function sign(payload: JwtPayload): Promise<string> {
    return new SignJWT({ ...payload })
        .setProtectedHeader({ alg: "HS256" })
        .setSubject(payload.sub)
        .setIssuedAt()
        .setExpirationTime(`${env.AUTH_TOKEN_TTL_SECONDS}s`)
        .sign(secret);
}

export async function verify(token: string): Promise<JwtPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
        const sub = typeof payload.sub === "string" ? payload.sub : null;
        const email = typeof payload.email === "string" ? payload.email : null;
        if (!sub || !email) return null;
        // Validar uuid
        if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(sub)) {
            return null;
        }
        return {
            sub,
            email,
            nombre: typeof payload.nombre === "string" ? payload.nombre : undefined,
            persona_id:
                typeof payload.persona_id === "string" ? payload.persona_id : undefined,
        };
    } catch {
        return null;
    }
}
