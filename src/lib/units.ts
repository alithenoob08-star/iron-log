const KG_PER_LB = 0.45359237;

export function kgToDisplay(kg: number, unit: "kg" | "lb"): number {
  const value = unit === "lb" ? kg / KG_PER_LB : kg;
  return Math.round(value * 10) / 10;
}

export function displayToKg(value: number, unit: "kg" | "lb"): number {
  return unit === "lb" ? value * KG_PER_LB : value;
}
