import { describe, expect, it } from "vitest";
import { isPasswordValid } from "./auth";

describe("isPasswordValid", () => {
  it("acepta una contraseña con mayúscula, minúscula y número", () => {
    expect(isPasswordValid("ClaveSegura1")).toBe(true);
  });

  it("acepta contraseñas largas válidas", () => {
    expect(isPasswordValid("SuperPassword123#2026")).toBe(true);
  });

  it("rechaza contraseñas menores a 8 caracteres", () => {
    expect(isPasswordValid("Corta1")).toBe(false);
  });

  it("rechaza contraseñas sin número", () => {
    expect(isPasswordValid("SoloLetras")).toBe(false);
  });

  it("rechaza contraseñas sin mayúsculas", () => {
    expect(isPasswordValid("solominusculas1")).toBe(false);
  });

  it("rechaza contraseñas sin minúsculas", () => {
    expect(isPasswordValid("SOLOMAYUSCULAS1")).toBe(false);
  });
});
