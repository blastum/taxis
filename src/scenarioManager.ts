import { TaxScenario, TaxInputs } from './types.js'
import { calculateTax, calculateDetailedTaxBreakdown } from './taxCalculator.js'

export class ScenarioManager {
	private scenarios: TaxScenario[] = []
	private listeners: (() => void)[] = []

	constructor() {
		this.loadFromStorage()
	}

	addListener(callback: () => void) {
		this.listeners.push(callback)
	}

	private notify() {
		this.listeners.forEach(callback => callback())
	}

	private saveToStorage() {
		localStorage.setItem('taxis-scenarios', JSON.stringify(this.scenarios))
	}

	private loadFromStorage() {
		const stored = localStorage.getItem('taxis-scenarios')
		if (stored) {
			try {
				this.scenarios = JSON.parse(stored)
				// Handle backward compatibility: add missing fields
				this.scenarios.forEach(scenario => {
					if (!scenario.inputs.taxYear) {
						scenario.inputs.taxYear = 2024
					}
					// Add new income fields if missing (for backward compatibility)
					if (typeof scenario.inputs.ira401kDistributions === 'undefined') {
						scenario.inputs.ira401kDistributions = 0
					}
					if (typeof scenario.inputs.pensionIncome === 'undefined') {
						scenario.inputs.pensionIncome = 0
					}
					if (typeof scenario.inputs.socialSecurityIncome === 'undefined') {
						scenario.inputs.socialSecurityIncome = 0
					}
					scenario.results = calculateTax(scenario.inputs)
					scenario.detailedBreakdown = calculateDetailedTaxBreakdown(scenario.inputs)
				})
				// Save updated scenarios back to storage
				this.saveToStorage()
			} catch (e) {
				console.error('Failed to load scenarios from storage:', e)
				this.scenarios = []
			}
		}
	}

	createScenario(name = 'New Scenario'): TaxScenario {
		const scenario: TaxScenario = {
			id: Date.now().toString(),
			name,
			inputs: {
				taxYear: 2024,
				filingStatus: 'single',
				ordinaryIncome: 0,
				ira401kDistributions: 0,
				pensionIncome: 0,
				socialSecurityIncome: 0,
				ordinaryEarnings: 0,
				longTermCapitalGains: 0,
				capitalLosses: 0,
				seniors65Plus: 0
			}
		}

		scenario.results = calculateTax(scenario.inputs)
		scenario.detailedBreakdown = calculateDetailedTaxBreakdown(scenario.inputs)
		this.scenarios.push(scenario)
		this.saveToStorage()
		this.notify()
		return scenario
	}

	duplicateScenario(id: string): TaxScenario | null {
		const original = this.scenarios.find(s => s.id === id)
		if (!original) return null

		const duplicate: TaxScenario = {
			...original,
			id: Date.now().toString(),
			name: `${original.name} (Copy)`
		}

		this.scenarios.push(duplicate)
		this.saveToStorage()
		this.notify()
		return duplicate
	}

	updateScenario(id: string, updates: Partial<Pick<TaxScenario, 'name'>> & { inputs?: Partial<TaxInputs> }) {
		const scenario = this.scenarios.find(s => s.id === id)
		if (!scenario) return

		if (updates.name !== undefined) {
			scenario.name = updates.name
		}

		if (updates.inputs) {
			scenario.inputs = { ...scenario.inputs, ...updates.inputs }
			scenario.results = calculateTax(scenario.inputs)
			scenario.detailedBreakdown = calculateDetailedTaxBreakdown(scenario.inputs)
		}

		this.saveToStorage()
		this.notify()
	}

	// Update scenario data and recalculate taxes without triggering full re-render
	updateScenarioSilently(id: string, updates: Partial<Pick<TaxScenario, 'name'>> & { inputs?: Partial<TaxInputs> }) {
		const scenario = this.scenarios.find(s => s.id === id)
		if (!scenario) return

		if (updates.name !== undefined) {
			scenario.name = updates.name
		}

		if (updates.inputs) {
			scenario.inputs = { ...scenario.inputs, ...updates.inputs }
			scenario.results = calculateTax(scenario.inputs)
			scenario.detailedBreakdown = calculateDetailedTaxBreakdown(scenario.inputs)
		}

		this.saveToStorage()
		// No notify() call - this prevents full re-render
	}

	deleteScenario(id: string) {
		const index = this.scenarios.findIndex(s => s.id === id)
		if (index === -1) return

		this.scenarios.splice(index, 1)
		this.saveToStorage()
		this.notify()
	}

	getScenarios(): TaxScenario[] {
		return [...this.scenarios]
	}

	getScenario(id: string): TaxScenario | undefined {
		return this.scenarios.find(s => s.id === id)
	}
}
