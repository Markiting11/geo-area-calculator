
import { AreaUnit } from './types';

// Conversion factors from square meters to other units
export const UNIT_CONVERSIONS: Record<AreaUnit, number> = {
  [AreaUnit.SQ_METERS]: 1,
  [AreaUnit.SQ_FEET]: 10.7639,
  [AreaUnit.ACRES]: 0.000247105,
  [AreaUnit.HECTARES]: 0.0001,
  [AreaUnit.KANAL]: 0.00197684, // 1 Kanal = 505.857 square meters
  [AreaUnit.MARLA]: 0.0395369,  // 1 Marla = 25.29285 square meters
};

export const UNIT_LABELS: Record<AreaUnit, string> = {
  [AreaUnit.SQ_METERS]: 'Square Meters',
  [AreaUnit.SQ_FEET]: 'Square Feet',
  [AreaUnit.ACRES]: 'Acres',
  [AreaUnit.HECTARES]: 'Hectares',
  [AreaUnit.KANAL]: 'Kanal',
  [AreaUnit.MARLA]: 'Marla',
};