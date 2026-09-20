import { describe, expect, it } from "vitest";
import { isPasswordValid } from "./auth";

describe("isPasswordValid", () => {
  it("acepta una contraseña con mayúscula, minúscula y número", () => {
    expect(isPasswordValid("ClaveSegura1")).toBe(true);
  });

  it("rechaza contraseñas menores a 8 caracteres", () => {
    expect(isPasswordValid("Corta1")).toBe(false);
  });

  it("rechaza contraseñas sin número", () => {
    expect(isPasswordValid("SoloLetras")).toBe(false);
  });
});