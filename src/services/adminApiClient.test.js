import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { adminGet, adminMutate, buildQuery } from "./adminApiClient";

function mockJsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: vi.fn().mockResolvedValue(body),
  };
}

describe("adminApiClient", () => {
  beforeEach(() => {
    localStorage.clear();
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("buildQuery", () => {
    it("serializes params into a query string", () => {
      expect(buildQuery({ status: "ACTIVE", page: 2 })).toBe("?status=ACTIVE&page=2");
    });

    it("omits undefined, null, empty-string and ALL sentinel values", () => {
      expect(
        buildQuery({
          status: "ALL",
          search: "",
          missing: undefined,
          nothing: null,
          page: 0,
        })
      ).toBe("?page=0");
    });

    it("returns an empty string when there are no usable params", () => {
      expect(buildQuery({ status: "ALL", search: "" })).toBe("");
    });
  });

  describe("adminGet", () => {
    it("calls fetch with the base URL + path and no auth header when no token is stored", async () => {
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ items: [] }));

      const result = await adminGet("/api/v1/admin/users");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/admin/users",
        expect.objectContaining({ cache: "no-store", headers: {} })
      );
      expect(result).toEqual({ items: [] });
    });

    it("includes an Authorization: Bearer header using ec_admin_token when present", async () => {
      localStorage.setItem("ec_admin_token", "new-token-123");
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ ok: true }));

      await adminGet("/api/v1/admin/bookings");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/admin/bookings",
        expect.objectContaining({
          headers: { Authorization: "Bearer new-token-123" },
        })
      );
    });

    it("falls back to legacy exploreCeylonToken key when ec_admin_token is absent", async () => {
      localStorage.setItem("exploreCeylonToken", "legacy-token-456");
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ ok: true }));

      await adminGet("/api/v1/admin/reviews");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/admin/reviews",
        expect.objectContaining({
          headers: { Authorization: "Bearer legacy-token-456" },
        })
      );
    });

    it("performs silent token refresh on 403 response and retries original request", async () => {
      localStorage.setItem("ec_admin_token", "expired-token");
      localStorage.setItem("ec_admin_refresh_token", "valid-refresh-token");

      // 1st call: 403 Forbidden
      // 2nd call: Refresh endpoint -> returns new token
      // 3rd call: Retry original request -> returns 200 OK
      globalThis.fetch
        .mockResolvedValueOnce(mockJsonResponse({ error: "Access Denied" }, { ok: false, status: 403 }))
        .mockResolvedValueOnce(mockJsonResponse({ accessToken: "fresh-new-token" }, { ok: true, status: 200 }))
        .mockResolvedValueOnce(mockJsonResponse({ data: "success" }, { ok: true, status: 200 }));

      const res = await adminGet("/api/v1/admin/guides/bookings");

      expect(res).toEqual({ data: "success" });
      expect(localStorage.getItem("ec_admin_token")).toBe("fresh-new-token");
      expect(globalThis.fetch).toHaveBeenCalledTimes(3);
    });

    it("clears auth and redirects to login if refresh fails", async () => {
      localStorage.setItem("ec_admin_token", "expired-token");
      localStorage.setItem("ec_admin_refresh_token", "expired-refresh-token");

      // 1st call: 401 Unauthorized
      // 2nd call: Refresh endpoint -> returns 401 Unauthorized
      globalThis.fetch
        .mockResolvedValueOnce(mockJsonResponse({ error: "Unauthorized" }, { ok: false, status: 401 }))
        .mockResolvedValueOnce(mockJsonResponse({ error: "Invalid refresh token" }, { ok: false, status: 401 }));

      await expect(adminGet("/api/v1/admin/guides/payments/summaries")).rejects.toThrow();

      expect(localStorage.getItem("ec_admin_token")).toBeNull();
      expect(localStorage.getItem("ec_admin_refresh_token")).toBeNull();
    });
  });

  describe("adminMutate", () => {
    it("sends method, JSON body, content-type and auth headers", async () => {
      localStorage.setItem("ec_admin_token", "token-abc");
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ id: 1 }));

      const result = await adminMutate("/api/v1/admin/users/1", "PUT", { status: "BANNED" });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/v1/admin/users/1",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer token-abc",
          },
          body: JSON.stringify({ status: "BANNED" }),
        }
      );
      expect(result).toEqual({ id: 1 });
    });

    it("returns null for a 204 No Content response", async () => {
      globalThis.fetch.mockResolvedValue({ ok: true, status: 204, json: vi.fn() });

      const result = await adminMutate("/api/v1/admin/users/1", "DELETE");

      expect(result).toBeNull();
    });
  });
});
