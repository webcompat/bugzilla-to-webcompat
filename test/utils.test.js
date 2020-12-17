"use strict";

const utils = require("../utils");

global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () =>
      Promise.resolve({
        FIREFOX_NIGHTLY: "86.0a1",
        nightly_version: "84.0a1"
      })
  })
);

describe("Utils", () => {
  it("getBrowser Windows", async () => {
    expect(await utils.getBrowser("Firefox 85", "Windows")).toBe(
      "Firefox 85.0"
    );
    expect(await utils.getBrowser("Firefox 85", "Windows 10")).toBe(
      "Firefox 85.0"
    );
  });

  it("getBrowser macOS", async () => {
    expect(await utils.getBrowser("75 Branch", "macOS")).toBe("Firefox 75.0");
  });

  it("getBrowser Linux/All/undefined", async () => {
    expect(await utils.getBrowser("83 Branch", "Linux")).toBe("Firefox 83.0");
    expect(await utils.getBrowser("80 Branch", "All")).toBe("Firefox 80.0");
    expect(await utils.getBrowser(undefined, undefined)).toBe("Firefox 86.0");
  });

  it("getBrowser no version", async () => {
    expect(await utils.getBrowser("Other branch", "macOS")).toBe(
      "Firefox 86.0"
    );
    expect(await utils.getBrowser("Other branch", "Windows")).toBe(
      "Firefox 86.0"
    );
    expect(await utils.getBrowser("Trunk", "Other")).toBe("Firefox 86.0");
    expect(await utils.getBrowser("Other branch", "All")).toBe("Firefox 86.0");
  });

  it("getBrowser mobile and iOS", async () => {
    expect(await utils.getBrowser("Firefox 64", "iOS")).toBe(
      "Firefox iOS 29.0"
    );
    expect(await utils.getBrowser("80 Branch", "Android")).toBe(
      "Firefox Mobile 80.0"
    );
    expect(await utils.getBrowser("Other branch", "Android")).toBe(
      "Firefox Mobile 84.0"
    );
    expect(await utils.getBrowser("Other branch", "iOS")).toBe(
      "Firefox iOS 29.0"
    );
  });

  it("getOS", () => {
    expect(utils.getOS("macOS")).toBe("Mac OS X 10.15");
    expect(utils.getOS("Linux")).toBe("Linux");
    expect(utils.getOS("Windows 10")).toBe("Windows 10");
    expect(utils.getOS("Windows")).toBe("Windows 10");
    expect(utils.getOS("Windows 8.1")).toBe("Windows 8.1");
    expect(utils.getOS("iOS")).toBe("iOS 14.1");
    expect(utils.getOS("Android")).toBe("Android");
    expect(utils.getOS(undefined)).toBe("Windows 10");
  });

  it("getSteps", () => {
    expect(utils.getSteps(undefined, "fallback")).toBe("fallback");
    expect(utils.getSteps([], "fallback")).toBe("fallback");
    expect(utils.getSteps([{ text: "" }], "fallback")).toBe("fallback");
    expect(utils.getSteps([{ text: "test" }], "fallback")).toBe("test");
  });
});
