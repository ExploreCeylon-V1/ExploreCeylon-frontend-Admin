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

      const result = await adminGet("/api/admin/users");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/admin/users",
        expect.objectContaining({ cache: "no-store", headers: {} })
      );
      expect(result).toEqual({ items: [] });
    });

    it("includes an Authorization: Bearer header using the ec_admin_token key when present", async () => {
      localStorage.setItem("ec_admin_token", "new-token-123");
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ ok: true }));

      await adminGet("/api/admin/bookings");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/admin/bookings",
        expect.objectContaining({
          headers: { Authorization: "Bearer new-token-123" },
        })
      );
    });

    it("falls back to the legacy exploreCeylonToken key when ec_admin_token is absent", async () => {
      localStorage.setItem("exploreCeylonToken", "legacy-token-456");
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ ok: true }));

      await adminGet("/api/admin/reviews");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/admin/reviews",
        expect.objectContaining({
          headers: { Authorization: "Bearer legacy-token-456" },
        })
      );
    });

    it("prefers ec_admin_token over the legacy key when both are present", async () => {
      localStorage.setItem("ec_admin_token", "new-token");
      localStorage.setItem("exploreCeylonToken", "legacy-token");
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ ok: true }));

      await adminGet("/api/admin/users");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/admin/users",
        expect.objectContaining({
          headers: { Authorization: "Bearer new-token" },
        })
      );
    });

    it("throws with the server-provided error message when the response is not ok", async () => {
      globalThis.fetch.mockResolvedValue(
        mockJsonResponse({ error: "Not authorized" }, { ok: false, status: 403 })
      );

      await expect(adminGet("/api/admin/users")).rejects.toThrow("Not authorized");
    });

    it("falls back to a generic status message when the error body has no message", async () => {
      globalThis.fetch.mockResolvedValue(
        mockJsonResponse({}, { ok: false, status: 500 })
      );

      await expect(adminGet("/api/admin/users")).rejects.toThrow("Request failed: 500");
    });
  });

  describe("adminMutate", () => {
    it("sends the given method, JSON body, content-type and auth headers", async () => {
      localStorage.setItem("ec_admin_token", "token-abc");
      globalThis.fetch.mockResolvedValue(mockJsonResponse({ id: 1 }));

      const result = await adminMutate("/api/admin/users/1", "PUT", { status: "BANNED" });

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/admin/users/1",
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

    it("omits the body when no body is provided", async () => {
      globalThis.fetch.mockResolvedValue(mockJsonResponse(null));

      await adminMutate("/api/admin/users/1", "DELETE");

      expect(globalThis.fetch).toHaveBeenCalledWith(
        "http://localhost:8080/api/admin/users/1",
        expect.objectContaining({ method: "DELETE", body: undefined })
      );
    });

    it("returns null for a 204 No Content response", async () => {
      globalThis.fetch.mockResolvedValue({ ok: true, status: 204, json: vi.fn() });

      const result = await adminMutate("/api/admin/users/1", "DELETE");

      expect(result).toBeNull();
    });

    it("throws with the server-provided error message when the response is not ok", async () => {
      globalThis.fetch.mockResolvedValue(
        mockJsonResponse({ message: "Validation failed" }, { ok: false, status: 400 })
      );

      await expect(
        adminMutate("/api/admin/users/1", "POST", { name: "" })
      ).rejects.toThrow("Validation failed");
    });
  });
});
