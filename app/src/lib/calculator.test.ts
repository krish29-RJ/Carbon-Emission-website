import { describe, it, expect } from "vitest";
import {
  calculateFootprint,
  getImpactLabel,
  getImpactColor,
  getCategoryLabel,
  type CalculatorInput
} from "./calculator";

describe("Calculator Utility Functions", () => {
  describe("getImpactLabel", () => {
    it("returns correct labels", () => {
      expect(getImpactLabel("low")).toBe("Low Impact");
      expect(getImpactLabel("moderate")).toBe("Moderate Impact");
      expect(getImpactLabel("high")).toBe("High Impact");
    });
  });

  describe("getImpactColor", () => {
    it("returns correct colors", () => {
      expect(getImpactColor("low")).toBe("#10B981");
      expect(getImpactColor("moderate")).toBe("#F59E0B");
      expect(getImpactColor("high")).toBe("#EF4444");
    });
  });

  describe("getCategoryLabel", () => {
    it("returns correct category labels", () => {
      expect(getCategoryLabel("transport")).toBe("Transport");
      expect(getCategoryLabel("energy")).toBe("Home Energy");
      expect(getCategoryLabel("food")).toBe("Food");
      expect(getCategoryLabel("lifestyle")).toBe("Lifestyle");
      expect(getCategoryLabel("unknown")).toBe("unknown"); // Fallback test
    });
  });

  describe("calculateFootprint", () => {
    it("calculates a typical low footprint accurately", () => {
      const input: CalculatorInput = {
        carKmPerWeek: 10, // 40 km/mo * 0.192 = 7.68
        busKmPerWeek: 20, // 80 km/mo * 0.089 = 7.12
        metroKmPerWeek: 30, // 120 km/mo * 0.041 = 4.92
        flightHoursPerYear: 0,
        electricityKwhPerMonth: 100, // 100 * 0.7 = 70
        acHoursPerDay: 2, // 2 * 1.2 = 2.4
        renewableEnergy: true, // 25% reduction on energy
        householdSize: 2,
        dietType: "vegan", // 100
        meatMealsPerWeek: 0,
        foodWasteKgPerWeek: 1, // 4 kg/mo * 2.5 = 10
        shoppingOrdersPerMonth: 2, // 2 * 8 = 16
        deliveryOrdersPerMonth: 1, // 1 * 2.5 = 2.5
        recyclesOften: true // 5% reduction on lifestyle
      };

      const result = calculateFootprint(input);
      
      expect(result.impactLevel).toBe("low");
      expect(result.transportCO2).toBeGreaterThan(0);
      expect(result.energyCO2).toBeGreaterThan(0);
      expect(result.foodCO2).toBeGreaterThan(0);
      expect(result.lifestyleCO2).toBeGreaterThan(0);
      expect(result.totalCO2).toBeLessThan(500); // Because it's "low"
    });

    it("calculates a high footprint accurately", () => {
      const input: CalculatorInput = {
        carKmPerWeek: 500, // Very high
        busKmPerWeek: 0,
        metroKmPerWeek: 0,
        flightHoursPerYear: 50, // High flights
        electricityKwhPerMonth: 1000, 
        acHoursPerDay: 12,
        renewableEnergy: false,
        householdSize: 1,
        dietType: "meat-heavy",
        meatMealsPerWeek: 14,
        foodWasteKgPerWeek: 5,
        shoppingOrdersPerMonth: 10,
        deliveryOrdersPerMonth: 15,
        recyclesOften: false
      };

      const result = calculateFootprint(input);
      
      expect(result.impactLevel).toBe("high");
      expect(result.totalCO2).toBeGreaterThan(1000);
      
      // Verify breakdowns are calculated
      expect(result.breakdown.length).toBe(4);
      const totalPercentage = result.breakdown.reduce((sum, item) => sum + item.percentage, 0);
      // It should be close to 100, allowing for some small rounding diffs
      expect(totalPercentage).toBeGreaterThanOrEqual(99);
      expect(totalPercentage).toBeLessThanOrEqual(101);
    });
  });
});
