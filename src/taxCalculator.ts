import { FilingStatus, TaxInputs, TaxResults, DetailedTaxBreakdown } from './types.js'

// 2024 Tax Year Constants
const STANDARD_DEDUCTIONS = {
	single: 14600,
	marriedFilingJointly: 29200,
	marriedFilingSeparately: 14600
} as const

// Additional standard deduction per person age 65+
const SENIOR_ADDITIONAL_DEDUCTION: Record<FilingStatus, number> = {
	single: 1950,
	marriedFilingJointly: 1550,
	marriedFilingSeparately: 1550
}

// 2024 Tax Brackets for Ordinary Income (Rev. Proc. 2023-34)
const TAX_BRACKETS = {
	single: [
		{ min: 0, max: 11600, rate: 0.10 },
		{ min: 11600, max: 47150, rate: 0.12 },
		{ min: 47150, max: 100525, rate: 0.22 },
		{ min: 100525, max: 191950, rate: 0.24 },
		{ min: 191950, max: 243725, rate: 0.32 },
		{ min: 243725, max: 609350, rate: 0.35 },
		{ min: 609350, max: Infinity, rate: 0.37 }
	],
	marriedFilingJointly: [
		{ min: 0, max: 23200, rate: 0.10 },
		{ min: 23200, max: 94300, rate: 0.12 },
		{ min: 94300, max: 201050, rate: 0.22 },
		{ min: 201050, max: 383900, rate: 0.24 },
		{ min: 383900, max: 487450, rate: 0.32 },
		{ min: 487450, max: 731200, rate: 0.35 },
		{ min: 731200, max: Infinity, rate: 0.37 }
	],
	marriedFilingSeparately: [
		{ min: 0, max: 11600, rate: 0.10 },
		{ min: 11600, max: 47150, rate: 0.12 },
		{ min: 47150, max: 100525, rate: 0.22 },
		{ min: 100525, max: 191950, rate: 0.24 },
		{ min: 191950, max: 243725, rate: 0.32 },
		{ min: 243725, max: 365600, rate: 0.35 },
		{ min: 365600, max: Infinity, rate: 0.37 }
	]
} as const

// 2024 Long-term Capital Gains thresholds
const LTCG_THRESHOLDS = {
	single: { zero: 47025, fifteen: 518900 },
	marriedFilingJointly: { zero: 94050, fifteen: 583750 },
	marriedFilingSeparately: { zero: 47025, fifteen: 291850 }
} as const

function calculateTaxFromBrackets(income: number, brackets: readonly { min: number; max: number; rate: number }[]): number {
	let tax = 0

	for (const bracket of brackets) {
		if (income <= bracket.min) break

		const taxableInBracket = Math.min(income, bracket.max) - bracket.min
		tax += taxableInBracket * bracket.rate
	}

	return tax
}

export function calculateTax(inputs: TaxInputs): TaxResults {
	const standardDeduction = STANDARD_DEDUCTIONS[inputs.filingStatus]
	const seniorDeductionPerPerson = SENIOR_ADDITIONAL_DEDUCTION[inputs.filingStatus]
	const seniorDeduction = inputs.seniors65Plus * seniorDeductionPerPerson
	const totalDeductions = standardDeduction + seniorDeduction

	// Gross components
	const ordinaryGross = inputs.ordinaryIncome + inputs.ordinaryEarnings
	const netCapitalGains = Math.max(0, inputs.longTermCapitalGains - inputs.capitalLosses)

	// Total and taxable income (simplified; losses applied against total income per app design)
	const totalIncome = inputs.ordinaryIncome + inputs.ordinaryEarnings + inputs.longTermCapitalGains - inputs.capitalLosses
	const taxableIncome = Math.max(0, totalIncome - totalDeductions)

	// Allocate deductions first to ordinary income, then to LTCG
	const ordinaryTaxable = Math.max(0, ordinaryGross - totalDeductions)
	const deductionLeftoverForLTCG = Math.max(0, totalDeductions - ordinaryGross)
	const ltcgTaxable = Math.max(0, netCapitalGains - deductionLeftoverForLTCG)

	// Ordinary tax using ordinary brackets
	const ordinaryTax = calculateTaxFromBrackets(ordinaryTaxable, TAX_BRACKETS[inputs.filingStatus])

	// LTCG stacking on top of taxable ordinary income
	const { zero: zeroThreshold, fifteen: fifteenThreshold } = LTCG_THRESHOLDS[inputs.filingStatus]
	let remainingLTCG = ltcgTaxable
	const zeroPortion = Math.min(remainingLTCG, Math.max(0, zeroThreshold - ordinaryTaxable))
	remainingLTCG -= zeroPortion
	const fifteenPortion = Math.min(remainingLTCG, Math.max(0, fifteenThreshold - ordinaryTaxable - zeroPortion))
	remainingLTCG -= fifteenPortion
	const twentyPortion = Math.max(0, remainingLTCG)
	const capitalGainsTax = zeroPortion * 0 + fifteenPortion * 0.15 + twentyPortion * 0.20

	// NIIT (3.8%)
	const NIIT_THRESHOLDS: Record<FilingStatus, number> = {
		single: 200000,
		marriedFilingJointly: 250000,
		marriedFilingSeparately: 125000
	}
	const magiApprox = ordinaryGross + netCapitalGains
	const netInvestmentIncome = Math.max(0, inputs.ordinaryEarnings) + netCapitalGains
	const niitExcess = Math.max(0, magiApprox - NIIT_THRESHOLDS[inputs.filingStatus])
	const niitTax = 0.038 * Math.min(netInvestmentIncome, niitExcess)

	const totalTax = ordinaryTax + capitalGainsTax + niitTax
	const effectiveRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0

	return {
		standardDeduction,
		seniorDeduction,
		totalDeductions,
		taxableIncome,
		ordinaryTax,
		capitalGainsTax,
		niitTax,
		totalTax,
		effectiveRate
	}
}

export function calculateDetailedTaxBreakdown(inputs: TaxInputs): DetailedTaxBreakdown {
	const standardDeduction = STANDARD_DEDUCTIONS[inputs.filingStatus]
	const seniorDeductionPerPerson = SENIOR_ADDITIONAL_DEDUCTION[inputs.filingStatus]
	const seniorDeduction = inputs.seniors65Plus * seniorDeductionPerPerson
	const totalDeductions = standardDeduction + seniorDeduction

	// Gross components
	const ordinaryGross = inputs.ordinaryIncome + inputs.ordinaryEarnings
	const netCapitalGains = Math.max(0, inputs.longTermCapitalGains - inputs.capitalLosses)
	const totalStandardIncome = inputs.ordinaryIncome + inputs.ordinaryEarnings

	// Allocate deductions first to ordinary income, then to LTCG
	const ordinaryTaxable = Math.max(0, ordinaryGross - totalDeductions)
	const deductionLeftoverForLTCG = Math.max(0, totalDeductions - ordinaryGross)
	const ltcgTaxable = Math.max(0, netCapitalGains - deductionLeftoverForLTCG)

	// Detailed ordinary tax calculation
	const brackets = TAX_BRACKETS[inputs.filingStatus]
	const ordinaryTaxBrackets = []
	let remainingIncome = ordinaryTaxable

	for (const bracket of brackets) {
		if (remainingIncome <= 0) break

		const taxableInBracket = Math.min(remainingIncome, bracket.max - bracket.min)
		if (taxableInBracket > 0) {
			const tax = taxableInBracket * bracket.rate
			ordinaryTaxBrackets.push({
				range: `$${bracket.min.toLocaleString()} - $${bracket.max === Infinity ? '∞' : bracket.max.toLocaleString()}`,
				amount: taxableInBracket,
				rate: bracket.rate,
				tax
			})
			remainingIncome -= taxableInBracket
		}
	}

	// LTCG detailed calculation
	const { zero: zeroThreshold, fifteen: fifteenThreshold } = LTCG_THRESHOLDS[inputs.filingStatus]
	let remainingLTCG = ltcgTaxable
	const zeroPortion = Math.min(remainingLTCG, Math.max(0, zeroThreshold - ordinaryTaxable))
	remainingLTCG -= zeroPortion
	const fifteenPortion = Math.min(remainingLTCG, Math.max(0, fifteenThreshold - ordinaryTaxable - zeroPortion))
	remainingLTCG -= fifteenPortion
	const twentyPortion = Math.max(0, remainingLTCG)

	// NIIT detailed calculation
	const NIIT_THRESHOLDS: Record<FilingStatus, number> = {
		single: 200000,
		marriedFilingJointly: 250000,
		marriedFilingSeparately: 125000
	}
	const magiApprox = ordinaryGross + netCapitalGains
	const netInvestmentIncome = Math.max(0, inputs.ordinaryEarnings) + netCapitalGains
	const niitExcess = Math.max(0, magiApprox - NIIT_THRESHOLDS[inputs.filingStatus])
	const niitAmount = 0.038 * Math.min(netInvestmentIncome, niitExcess)

	return {
		income: {
			totalStandardIncome,
			longTermCapitalGains: inputs.longTermCapitalGains,
			capitalLosses: inputs.capitalLosses
		},
		deductions: {
			standardDeduction,
			seniorDeduction,
			seniorDeductionPerPerson,
			totalDeductions
		},
		ordinaryTax: {
			taxableOrdinaryIncome: ordinaryTaxable,
			brackets: ordinaryTaxBrackets
		},
		capitalGainsTax: {
			taxableCapitalGains: ltcgTaxable,
			zeroBracket: { amount: zeroPortion, tax: zeroPortion * 0 },
			fifteenBracket: { amount: fifteenPortion, tax: fifteenPortion * 0.15 },
			twentyBracket: { amount: twentyPortion, tax: twentyPortion * 0.20 }
		},
		niit: {
			magi: magiApprox,
			threshold: NIIT_THRESHOLDS[inputs.filingStatus],
			excess: niitExcess,
			netInvestmentIncome,
			niitAmount
		}
	}
}
