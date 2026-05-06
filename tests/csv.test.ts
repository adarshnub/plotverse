import { describe, expect, it } from "vitest";
import { clientFromCsvRow, parseCsv, propertyFromCsvRow } from "@/lib/csv";

describe("csv import helpers", () => {
  it("parses quoted CSV cells and maps property rows", () => {
    const [row] = parseCsv('title,area,price,amenities\n"Sea flat","Bandra West",82000000,"Parking, Security"');
    const result = propertyFromCsvRow(row, 2);

    expect(result.errors).toEqual([]);
    expect(result.property.area).toBe("Bandra West");
    expect(result.property.amenities).toEqual(["Parking", "Security"]);
  });

  it("validates client budget max", () => {
    const result = clientFromCsvRow({ name: "Asha", budgetmax: "", preferredareas: "Powai" }, 2);
    expect(result.errors[0]).toContain("budget max");
  });
});
