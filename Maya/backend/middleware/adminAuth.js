/**
 * Admin Authentication Middleware
 *
 * Protects all /api/admin/* endpoints with a shared-secret token.
 * Callers must include the token in the X-Admin-Token request header.
 *
 * Token comparison uses a timing-safe approach (timingSafeEqual via
 * Buffer) to prevent timing-based enumeration attacks.
 *
 * Configuration:
 *   Set ADMIN_TOKEN in .env locally or as a platform environment variable.
 *   If ADMIN_TOKEN is absent the middleware returns 503 on every request.
 *
 * Exports:
 *   requireAdminAuth        - ready-to-use middleware reading from config
 *   createAdminAuthMiddleware - factory for unit tests (inject token getter)
 */

import { timingSafeEqual } from "crypto";
import { logWarning, logInfo } from "../utils/logger.js";
import config from "../config/env.js";

/**
 * Perform a constant-time string comparison so an attacker cannot
 * determine partial token matches from response timing.
 */
function safeEqual(a, b) {
  try {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) {
      // Run a dummy comparison to prevent length-based timing leaks
      timingSafeEqual(bufA, bufA);
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Factory that returns an admin auth middleware backed by the provided
 * token getter. This decouples the auth logic from the config module,
 * making unit tests possible without mocking the entire config object.
 *
 * @param {() => string|null} getToken - called on every request to retrieve
 *   the expected admin token value.
 * @returns {import('express').RequestHandler}
 */
export function createAdminAuthMiddleware(getToken) {
  return function adminAuthMiddleware(req, res, next) {
    const adminToken = getToken();

    if (!adminToken) {
      logWarning("Admin endpoint blocked: ADMIN_TOKEN is not configured", {
        path: req.path,
        ip: req.ip,
      });
      return res.status(503).json({
        error: "Admin endpoints are not available",
        message: "ADMIN_TOKEN environment variable is not configured.",
      });
    }

    const provided = req.headers["x-admin-token"];

    if (!provided) {
      logWarning("Admin auth failed: missing X-Admin-Token header", {
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({
        error: "Unauthorized",
        message: "Admin access requires a valid X-Admin-Token header.",
      });
    }

    if (!safeEqual(provided, adminToken)) {
      logWarning("Admin auth failed: invalid token", {
        path: req.path,
        ip: req.ip,
      });
      return res.status(401).json({
        error: "Unauthorized",
        message: "Invalid admin token.",
      });
    }

    logInfo("Admin endpoint accessed", { path: req.path, ip: req.ip });
    next();
  };
}

/**
 * Ready-to-use middleware that reads ADMIN_TOKEN from the application config.
 * This is what server.js uses for every protected route.
 */
export const requireAdminAuth = createAdminAuthMiddleware(
  () => config.adminToken,
);
