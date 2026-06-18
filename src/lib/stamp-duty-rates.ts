export interface StampDutyResult {
  stampDuty: number;
  registrationFee: number;
  total: number;
  formula: string;
  notes: string;
}

export const STATES = [
  { code: 'MH', name: 'Maharashtra', cities: ['Mumbai', 'Pune', 'Nagpur', 'Thane', 'Other'] },
  { code: 'KA', name: 'Karnataka', cities: ['Bengaluru', 'Mysuru', 'Mangaluru', 'Other'] },
  { code: 'DL', name: 'Delhi', cities: ['New Delhi', 'North Delhi', 'South Delhi', 'Other'] },
  { code: 'TN', name: 'Tamil Nadu', cities: ['Chennai', 'Coimbatore', 'Madurai', 'Other'] },
  { code: 'TS', name: 'Telangana', cities: ['Hyderabad', 'Warangal', 'Other'] },
  { code: 'OTHER', name: 'Other State', cities: ['Other'] },
] as const;

export type StateCode = (typeof STATES)[number]['code'];

export function calculateStampDuty(
  stateCode: string,
  city: string,
  monthlyRent: number,
  deposit: number,
  termMonths: number = 11
): StampDutyResult {
  const totalRent = monthlyRent * termMonths;
  let stampDuty = 0;
  let registrationFee = 0;
  let formula = '';
  let notes = '';

  switch (stateCode) {
    case 'MH':
      // Maharashtra leave & license: 0.25% of (Total Rent + 10% of Deposit)
      const mhBase = totalRent + (0.10 * deposit);
      stampDuty = Math.ceil(mhBase * 0.0025);
      // Min stamp duty is Rs. 100
      if (stampDuty < 100) stampDuty = 100;
      registrationFee = city === 'Other' ? 500 : 1000;
      formula = '0.25% × (Total Rent + 10% × Security Deposit)';
      notes = 'Based on Maharashtra leave and license rules. A flat registration fee of ₹1,000 applies to urban areas and ₹500 to rural/other areas.';
      break;

    case 'KA':
      // Karnataka: 0.5% of total rent + deposit
      stampDuty = Math.ceil((totalRent + deposit) * 0.005);
      // Min stamp duty is Rs. 100
      if (stampDuty < 100) stampDuty = 100;
      registrationFee = 200;
      formula = '0.50% × (Total Rent + Security Deposit)';
      notes = 'Standard stamp duty rate for license agreements of term ≤ 11 months in Karnataka, with a nominal local registration fee of ₹200.';
      break;

    case 'DL':
      // Delhi: 2% of total rent + deposit
      stampDuty = Math.ceil((totalRent + deposit) * 0.02);
      registrationFee = 1000;
      formula = '2.00% × (Total Rent + Security Deposit)';
      notes = 'Based on the Indian Stamp Act as applicable to the NCT of Delhi for short-term agreements.';
      break;

    case 'TN':
      // Tamil Nadu: 1% of total rent + deposit
      stampDuty = Math.ceil((totalRent + deposit) * 0.01);
      registrationFee = 1000;
      formula = '1.00% × (Total Rent + Security Deposit)';
      notes = 'Applicable for Tamil Nadu short-term rentals under the TN Regulation of Rights and Responsibilities of Landlords and Tenants Act.';
      break;

    case 'TS':
      // Telangana: 0.5% of total rent + deposit
      stampDuty = Math.ceil((totalRent + deposit) * 0.005);
      registrationFee = 1000;
      formula = '0.50% × (Total Rent + Security Deposit)';
      notes = 'Standard short-term lease stamp duty for Telangana. Registration fees vary slightly depending on municipality.';
      break;

    default:
      // Other state default: 1% of total rent + deposit
      stampDuty = Math.ceil((totalRent + deposit) * 0.01);
      registrationFee = 500;
      formula = '1.00% × (Total Rent + Security Deposit)';
      notes = 'Fallback estimate based on general Indian Stamp Act provisions for states with no specialized short-term rates listed.';
      break;
  }

  return {
    stampDuty,
    registrationFee,
    total: stampDuty + registrationFee,
    formula,
    notes,
  };
}
