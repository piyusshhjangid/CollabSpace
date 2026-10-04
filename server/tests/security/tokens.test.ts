import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../src/app.js";
import { prisma } from "../setup.js";
import {
  createRefreshToken,
  createTwoTenantFixture,
  issueAccessToken,
} from "../factories.js";

describe("authentication token security", () => {
  it("rejects an expired access token", async () => {
    const fixture = await createTwoTenantFixture();

    const expiredToken = issueAccessToken(
      fixture.userA.id,
      "-1s",
    );

    const response = await request(app)
      .get(`/api/workspaces/${fixture.workspaceA.id}/me`)
      .set("Authorization", `Bearer ${expiredToken}`);

    expect(response.status).toBe(401);
  });

  it("rejects a tampered access token", async () => {
    const fixture = await createTwoTenantFixture();

    const token = issueAccessToken(fixture.userA.id);
    const parts = token.split(".");

    expect(parts).toHaveLength(3);

    const signature = parts[2] ?? "";

    const replacement =
      signature.charAt(0) === "a" ? "b" : "a";

    parts[2] = replacement + signature.slice(1);

    const tamperedToken = parts.join(".");

    const response = await request(app)
      .get(`/api/workspaces/${fixture.workspaceA.id}/me`)
      .set("Authorization", `Bearer ${tamperedToken}`);

    expect(response.status).toBe(401);
  });

  it("rejects an expired refresh token", async () => {
    const fixture = await createTwoTenantFixture();

    const refreshToken = await createRefreshToken(
      fixture.userA.id,
      {
        expiresAt: new Date(Date.now() - 1000),
      },
    );

    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: refreshToken.token,
      });

    expect(response.status).toBe(401);
  });

  it("rejects a revoked refresh token", async () => {
    const fixture = await createTwoTenantFixture();

    const refreshToken = await createRefreshToken(
      fixture.userA.id,
      {
        revokedAt: new Date(),
      },
    );

    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: refreshToken.token,
      });

    expect(response.status).toBe(401);
  });

  it("allows a valid refresh token once", async () => {
    const fixture = await createTwoTenantFixture();

    const refreshToken = await createRefreshToken(
      fixture.userA.id,
    );

    const response = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: refreshToken.token,
      });

    expect(response.status).toBe(200);
    expect(response.body?.data?.accessToken).toBeTruthy();
  });

  it("rejects refresh-token replay after the first successful refresh", async () => {
    const fixture = await createTwoTenantFixture();

    const refreshToken = await createRefreshToken(
      fixture.userA.id,
    );

    const first = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: refreshToken.token,
      });

    expect(first.status).toBe(200);

    const storedAfterFirst = await prisma.refresh_tokens.findUnique({
      where: {
        token: refreshToken.token,
      },
    });

    const second = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: refreshToken.token,
      });

    expect(second.status).toBe(401);

    expect(storedAfterFirst?.revoked_at).not.toBeNull();
  });

  it("rejects refresh after logout", async () => {
    const fixture = await createTwoTenantFixture();

    const refreshToken = await createRefreshToken(
      fixture.userA.id,
    );

    const logout = await request(app)
      .post("/auth/logout")
      .send({
        refreshToken: refreshToken.token,
      });

    expect(logout.status).toBe(200);

    const refresh = await request(app)
      .post("/auth/refresh")
      .send({
        refreshToken: refreshToken.token,
      });

    expect(refresh.status).toBe(401);
  });
});
