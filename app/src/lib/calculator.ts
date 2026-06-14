export interface CalculatorInput {
  carKmPerWeek: number;
  busKmPerWeek: number;
  metroKmPerWeek: number;
  flightHoursPerYear: number;
  electricityKwhPerMonth: number;
  acHoursPerDay: number;
  renewableEnergy: boolean;
  householdSize: number;
  dietType: 'vegan' | 'vegetarian' | 'mixed' | 'meat-heavy';
  meatMealsPerWeek: number;
  foodWasteKgPerWeek: number;
  shoppingOrdersPerMonth: number;
  deliveryOrdersPerMonth: number;
  recyclesOften: boolean;
}

export interface CalculatorResult {
  transportCO2: number;
  energyCO2: number;
  foodCO2: number;
  lifestyleCO2: number;
  totalCO2: number;
  impactLevel: 'low' | 'moderate' | 'high';
  breakdown: {
    category: string;
    value: number;
    percentage: number;
    color: string;
  }[];
  activities: {
    category: string;
    activity: string;
    value: number;
    unit: string;
    co2e: number;
  }[];
}

const FACTORS = {
  CAR_KG_PER_KM: 0.192,
  BUS_KG_PER_KM: 0.089,
  TRAIN_KG_PER_KM: 0.041,
  FLIGHT_KG_PER_HOUR: 90,
  ELECTRICITY_KG_PER_KWH: 0.7,
  AC_KG_PER_HOUR_PER_DAY: 1.2,
  VEGAN_DIET_KG_PER_MONTH: 100,
  VEGETARIAN_DIET_KG_PER_MONTH: 150,
  MIXED_DIET_KG_PER_MONTH: 220,
  MEAT_HEAVY_DIET_KG_PER_MONTH: 320,
  MEAT_MEAL_EXTRA_KG: 4.5,
  FOOD_WASTE_KG_PER_KG: 2.5,
  SHOPPING_ORDER_KG: 8,
  DELIVERY_ORDER_KG: 2.5,
  RECYCLING_REDUCTION_PERCENT: 0.05,
  RENEWABLE_ENERGY_REDUCTION: 0.25,
};

const CATEGORY_COLORS: Record<string, string> = {
  transport: '#0EA5E9',
  energy: '#F97316',
  food: '#10B981',
  lifestyle: '#8B5CF6',
};

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function getImpactLevel(totalCO2: number): 'low' | 'moderate' | 'high' {
  if (totalCO2 < 500) return 'low';
  if (totalCO2 <= 1000) return 'moderate';
  return 'high';
}

export function calculateFootprint(data: CalculatorInput): CalculatorResult {
  // Transport (monthly)
  const carCO2 = data.carKmPerWeek * 4 * FACTORS.CAR_KG_PER_KM;
  const busCO2 = data.busKmPerWeek * 4 * FACTORS.BUS_KG_PER_KM;
  const trainCO2 = data.metroKmPerWeek * 4 * FACTORS.TRAIN_KG_PER_KM;
  const flightCO2 = (data.flightHoursPerYear / 12) * FACTORS.FLIGHT_KG_PER_HOUR;
  const transportCO2 = carCO2 + busCO2 + trainCO2 + flightCO2;

  // Energy (monthly)
  let electricityCO2 = data.electricityKwhPerMonth * FACTORS.ELECTRICITY_KG_PER_KWH;
  const acCO2 = data.acHoursPerDay * FACTORS.AC_KG_PER_HOUR_PER_DAY;
  let energyCO2 = (electricityCO2 + acCO2) / data.householdSize;

  if (data.renewableEnergy) {
    energyCO2 *= (1 - FACTORS.RENEWABLE_ENERGY_REDUCTION);
    electricityCO2 *= (1 - FACTORS.RENEWABLE_ENERGY_REDUCTION);
  }

  // Food (monthly)
  const dietBases: Record<string, number> = {
    vegan: FACTORS.VEGAN_DIET_KG_PER_MONTH,
    vegetarian: FACTORS.VEGETARIAN_DIET_KG_PER_MONTH,
    mixed: FACTORS.MIXED_DIET_KG_PER_MONTH,
    'meat-heavy': FACTORS.MEAT_HEAVY_DIET_KG_PER_MONTH,
  };

  const dietBaseCO2 = dietBases[data.dietType] || FACTORS.MIXED_DIET_KG_PER_MONTH;
  const meatExtraCO2 = data.meatMealsPerWeek * 4 * FACTORS.MEAT_MEAL_EXTRA_KG;
  const wasteCO2 = data.foodWasteKgPerWeek * 4 * FACTORS.FOOD_WASTE_KG_PER_KG;
  const foodCO2 = dietBaseCO2 + meatExtraCO2 + wasteCO2;

  // Lifestyle (monthly)
  let shoppingCO2 = data.shoppingOrdersPerMonth * FACTORS.SHOPPING_ORDER_KG;
  let deliveryCO2 = data.deliveryOrdersPerMonth * FACTORS.DELIVERY_ORDER_KG;
  let lifestyleCO2 = shoppingCO2 + deliveryCO2;

  if (data.recyclesOften) {
    lifestyleCO2 *= (1 - FACTORS.RECYCLING_REDUCTION_PERCENT);
    shoppingCO2 *= (1 - FACTORS.RECYCLING_REDUCTION_PERCENT);
    deliveryCO2 *= (1 - FACTORS.RECYCLING_REDUCTION_PERCENT);
  }

  const totalCO2 = transportCO2 + energyCO2 + foodCO2 + lifestyleCO2;

  const activities = [
    { category: 'transport', activity: 'car_petrol', value: data.carKmPerWeek * 4, unit: 'km/month', co2e: round(carCO2) },
    { category: 'transport', activity: 'bus', value: data.busKmPerWeek * 4, unit: 'km/month', co2e: round(busCO2) },
    { category: 'transport', activity: 'train_metro', value: data.metroKmPerWeek * 4, unit: 'km/month', co2e: round(trainCO2) },
    { category: 'transport', activity: 'short_flight', value: data.flightHoursPerYear / 12, unit: 'hours/month', co2e: round(flightCO2) },
    { category: 'energy', activity: 'electricity', value: data.electricityKwhPerMonth, unit: 'kWh/month', co2e: round(electricityCO2 / data.householdSize) },
    { category: 'energy', activity: 'ac_usage', value: data.acHoursPerDay, unit: 'hours/day', co2e: round(acCO2 / data.householdSize) },
    { category: 'food', activity: data.dietType + '_diet', value: 1, unit: 'month', co2e: round(dietBaseCO2) },
    { category: 'food', activity: 'meat_meal', value: data.meatMealsPerWeek * 4, unit: 'meals/month', co2e: round(meatExtraCO2) },
    { category: 'food', activity: 'food_waste', value: data.foodWasteKgPerWeek * 4, unit: 'kg/month', co2e: round(wasteCO2) },
    { category: 'lifestyle', activity: 'online_shopping', value: data.shoppingOrdersPerMonth, unit: 'orders/month', co2e: round(shoppingCO2) },
    { category: 'lifestyle', activity: 'delivery_order', value: data.deliveryOrdersPerMonth, unit: 'orders/month', co2e: round(deliveryCO2) },
  ];

  if (data.renewableEnergy) {
    activities.push({ category: 'energy', activity: 'renewable_energy_discount', value: 1, unit: 'discount', co2e: round(-(electricityCO2 + acCO2) * FACTORS.RENEWABLE_ENERGY_REDUCTION / data.householdSize) });
  }

  if (data.recyclesOften) {
    activities.push({ category: 'lifestyle', activity: 'recycling_discount', value: 1, unit: 'discount', co2e: round(-(shoppingCO2 + deliveryCO2) * FACTORS.RECYCLING_REDUCTION_PERCENT) });
  }

  const breakdown = [
    { category: 'Transport', value: round(transportCO2), percentage: round((transportCO2 / totalCO2) * 100), color: CATEGORY_COLORS.transport },
    { category: 'Energy', value: round(energyCO2), percentage: round((energyCO2 / totalCO2) * 100), color: CATEGORY_COLORS.energy },
    { category: 'Food', value: round(foodCO2), percentage: round((foodCO2 / totalCO2) * 100), color: CATEGORY_COLORS.food },
    { category: 'Lifestyle', value: round(lifestyleCO2), percentage: round((lifestyleCO2 / totalCO2) * 100), color: CATEGORY_COLORS.lifestyle },
  ];

  return {
    transportCO2: round(transportCO2),
    energyCO2: round(energyCO2),
    foodCO2: round(foodCO2),
    lifestyleCO2: round(lifestyleCO2),
    totalCO2: round(totalCO2),
    impactLevel: getImpactLevel(totalCO2),
    breakdown,
    activities,
  };
}

export function getImpactLabel(level: 'low' | 'moderate' | 'high'): string {
  switch (level) {
    case 'low': return 'Low Impact';
    case 'moderate': return 'Moderate Impact';
    case 'high': return 'High Impact';
  }
}

export function getImpactColor(level: 'low' | 'moderate' | 'high'): string {
  switch (level) {
    case 'low': return '#10B981';
    case 'moderate': return '#F59E0B';
    case 'high': return '#EF4444';
  }
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    transport: 'Transport',
    energy: 'Home Energy',
    food: 'Food',
    lifestyle: 'Lifestyle',
  };
  return labels[category] || category;
}
