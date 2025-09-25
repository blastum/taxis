export type FilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately'
export type TaxYear = 2024 | 2025

export interface TaxInputs {
	taxYear: TaxYear
	filingStatus: FilingStatus
	ordinaryIncome: number
	ira401kDistributions: number
	pensionIncome: number
	socialSecurityIncome: number
	ordinaryEarnings: number
	longTermCapitalGains: number
	capitalLosses: number
	seniors65Plus: number
}

export interface TaxResults {
	standardDeduction: number
	seniorDeduction: number
	totalDeductions: number
	taxableIncome: number
	ordinaryTax: number
	capitalGainsTax: number
	niitTax: number
	totalTax: number
	effectiveRate: number
	capitalLossOffset: number
	remainingCapitalLosses: number
}

export interface DetailedTaxBreakdown {
	income: {
		totalStandardIncome: number
		longTermCapitalGains: number
		capitalLosses: number
		capitalLossOffset: number
		remainingCapitalLosses: number
	}
	deductions: {
		standardDeduction: number
		seniorDeduction: number
		seniorDeductionPerPerson: number
		totalDeductions: number
	}
	ordinaryTax: {
		taxableOrdinaryIncome: number
		brackets: Array<{
			range: string
			amount: number
			rate: number
			tax: number
		}>
	}
	capitalGainsTax: {
		taxableCapitalGains: number
		zeroBracket: { amount: number; tax: number }
		fifteenBracket: { amount: number; tax: number }
		twentyBracket: { amount: number; tax: number }
	}
	niit: {
		magi: number
		threshold: number
		excess: number
		netInvestmentIncome: number
		niitAmount: number
	}
}

export interface TaxScenario {
	id: string
	name: string
	inputs: TaxInputs
	results?: TaxResults
	detailedBreakdown?: DetailedTaxBreakdown
}
