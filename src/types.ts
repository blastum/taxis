export type FilingStatus = 'single' | 'marriedFilingJointly' | 'marriedFilingSeparately'

export interface TaxInputs {
	filingStatus: FilingStatus
	ordinaryIncome: number
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
}

export interface DetailedTaxBreakdown {
	income: {
		totalStandardIncome: number
		longTermCapitalGains: number
		capitalLosses: number
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
