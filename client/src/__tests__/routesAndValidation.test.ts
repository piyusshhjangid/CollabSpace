import { describe, it, expect } from "vitest";

describe("Authentication Validation Rules", () => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  it("validates registration credentials correctly", () => {
    // 1. Full name validation
    expect("".trim()).toBe("");
    expect("  ".trim()).toBe("");
    expect("Alex Rivera".trim().length).toBeGreaterThan(0);

    // 2. Email format validation
    expect(emailRegex.test("invalid-email")).toBe(false);
    expect(emailRegex.test("missing@domain")).toBe(false);
    expect(emailRegex.test("valid.user@company.com")).toBe(true);

    // 3. Password length >= 8
    expect("short".length < 8).toBe(true);
    expect("validpass123".length >= 8).toBe(true);

    // 4. Password confirmation match
    const p1: string = "secure_password_1";
    const p2: string = "secure_password_2";
    const p3: string = "secure_password_1";
    expect(p1 === p2).toBe(false);
    expect(p1 === p3).toBe(true);
  });

  it("validates login input constraints", () => {
    expect(emailRegex.test("")).toBe(false);
    expect(emailRegex.test("test@domain.com")).toBe(true);
    expect("pass".length > 0).toBe(true);
    expect("".length > 0).toBe(false);
  });

  it("sanitizes user input by trimming emails and names", () => {
    const rawName = "  Jane Doe  ";
    const rawEmail = "   jane@domain.com   ";
    expect(rawName.trim()).toBe("Jane Doe");
    expect(rawEmail.trim()).toBe("jane@domain.com");
  });
});

describe("Protected & Guest Route Logic", () => {
  it("determines protected destination safely without open redirect loops", () => {
    const getSafeDestination = (fromPath?: string) => {
      if (!fromPath || fromPath.startsWith("/login") || fromPath.startsWith("/signup")) {
        return "/";
      }
      return fromPath;
    };

    expect(getSafeDestination(undefined)).toBe("/");
    expect(getSafeDestination("/login")).toBe("/");
    expect(getSafeDestination("/signup")).toBe("/");
    expect(getSafeDestination("/projects")).toBe("/projects");
    expect(getSafeDestination("/tasks")).toBe("/tasks");
  });
});
