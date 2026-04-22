import { describe, expect, it } from "vitest";
import { getLoadingMessageAtIndex } from "./LoadingReport";

describe("getLoadingMessageAtIndex", () => {
  it("returns each loading message for sequential indexes", () => {
    expect(getLoadingMessageAtIndex(0)).toBe("Checking ingredients...");
    expect(getLoadingMessageAtIndex(1)).toBe("Reviewing certifications...");
    expect(getLoadingMessageAtIndex(2)).toBe("Investigating supply chain...");
    expect(getLoadingMessageAtIndex(3)).toBe("Generating report...");
  });

  it("cycles back to the first message when index exceeds list length", () => {
    expect(getLoadingMessageAtIndex(4)).toBe("Checking ingredients...");
    expect(getLoadingMessageAtIndex(8)).toBe("Checking ingredients...");
  });
});
