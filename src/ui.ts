import { TaxScenario, FilingStatus, TaxInputs } from './types.js'
import { ScenarioManager } from './scenarioManager.js'

export class UIManager {
	private scenarioManager: ScenarioManager
	private scenariosContainer: HTMLElement
	private initialFocusDone: boolean = false
	
	// Configuration: Enable focus preservation during real-time updates
	// When true: Uses silent updates to prevent focus loss during typing
	// When false: Uses normal updates with full re-renders (may cause focus loss)
	private preserveFocusDuringUpdates: boolean = true

	constructor(scenarioManager: ScenarioManager) {
		this.scenarioManager = scenarioManager
		this.scenariosContainer = document.getElementById('scenarios-container')!

		this.setupEventListeners()
		this.setupGlobalModal()
		this.scenarioManager.addListener(() => this.render())
		this.render()
	}

	/**
	 * Toggle focus preservation during real-time updates
	 * @param enabled - true to preserve focus (default), false to allow full re-renders
	 */
	public setFocusPreservation(enabled: boolean): void {
		this.preserveFocusDuringUpdates = enabled
	}

	/**
	 * Get current focus preservation setting
	 * @returns true if focus preservation is enabled, false otherwise
	 */
	public getFocusPreservation(): boolean {
		return this.preserveFocusDuringUpdates
	}

	private isValidInteger(value: string): boolean {
		// Allow empty string (will be treated as 0)
		if (value === '') return true

		// Check if it's a valid integer (including negative numbers)
		const trimmed = value.trim()
		const regex = /^-?\d+$/
		return regex.test(trimmed)
	}

	private parseIntegerValue(value: string): number {
		const trimmed = value.trim()
		return trimmed === '' ? 0 : parseInt(trimmed, 10)
	}

	private setupEventListeners() {
		const addButton = document.getElementById('add-scenario')!
		addButton.addEventListener('click', () => {
			this.scenarioManager.createScenario()
		})

		// Remove Add Scenario button from tab navigation to prevent interference
		addButton.tabIndex = -1

		// No global manual tab handling; rely on native order
	}

	private setupGlobalModal() {
		// Create a single modal container at the document body level
		const modalContainer = document.createElement('div')
		modalContainer.id = 'global-modal-container'
		document.body.appendChild(modalContainer)

		// Handle ESC key globally
		document.addEventListener('keydown', (e) => {
			if (e.key === 'Escape') {
				this.closeCurrentModal()
			}
		})
	}

	private render() {
		const scenarios = this.scenarioManager.getScenarios()
		this.scenariosContainer.innerHTML = ''

		if (scenarios.length === 0) {
			this.scenariosContainer.innerHTML = '<p class="no-scenarios">No scenarios yet. Click "Add Scenario" to get started.</p>'
			return
		}

		scenarios.forEach(scenario => {
			const scenarioCard = this.createScenarioCard(scenario)
			this.scenariosContainer.appendChild(scenarioCard)
		})
	}

	private createScenarioCard(scenario: TaxScenario): HTMLElement {
		const card = document.createElement('div')
		card.className = 'scenario-card'
		card.innerHTML = `
			<div class="scenario-header">
				<input type="text" class="scenario-name" value="${scenario.name}" data-id="${scenario.id}">
				<div class="scenario-actions">
					<button class="btn btn-small" data-action="duplicate" data-id="${scenario.id}">Duplicate</button>
					<button class="btn btn-small btn-danger" data-action="delete" data-id="${scenario.id}">Delete</button>
				</div>
			</div>

			<div class="scenario-inputs">
				<h3>Inputs</h3>
				
				<div class="input-group">
					<label>Filing Status:</label>
					<select data-field="filingStatus" data-id="${scenario.id}">
						<option value="single" ${scenario.inputs.filingStatus === 'single' ? 'selected' : ''}>Single</option>
						<option value="marriedFilingJointly" ${scenario.inputs.filingStatus === 'marriedFilingJointly' ? 'selected' : ''}>Married Filing Jointly</option>
						<option value="marriedFilingSeparately" ${scenario.inputs.filingStatus === 'marriedFilingSeparately' ? 'selected' : ''}>Married Filing Separately</option>
					</select>
				</div>
				
				<div class="input-group">
					<label>Ordinary Income:</label>
					<input type="text" data-field="ordinaryIncome" data-id="${scenario.id}" value="${scenario.inputs.ordinaryIncome}" placeholder="Enter amount">
				</div>
				
				<div class="input-group">
					<label>Ordinary Earnings:</label>
					<input type="text" data-field="ordinaryEarnings" data-id="${scenario.id}" value="${scenario.inputs.ordinaryEarnings}" placeholder="Enter amount">
				</div>
				
				<div class="input-group">
					<label>Long-term Capital Gains:</label>
					<input type="text" data-field="longTermCapitalGains" data-id="${scenario.id}" value="${scenario.inputs.longTermCapitalGains}" placeholder="Enter amount">
				</div>
				
				<div class="input-group">
					<label>Capital Losses:</label>
					<input type="text" data-field="capitalLosses" data-id="${scenario.id}" value="${scenario.inputs.capitalLosses}" placeholder="Enter amount">
				</div>
				
				<div class="input-group">
					<label>65+:</label>
					${this.renderSeniorsField(scenario)}
				</div>
			</div>

			<div class="scenario-results">
				<h3 class="results-header">
					Results
					<button class="disclosure-btn" data-id="${scenario.id}" aria-label="Show detailed tax breakdown">
						Calculations
						<svg class="disclosure-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
							<path d="M9 18l6-6-6-6"/>
						</svg>
					</button>
				</h3>
				${this.renderResults(scenario)}
			</div>
			
		`

		this.attachCardEventListeners(card)
		this.attachModalEventListeners(card)
		return card
	}

	private renderSeniorsField(scenario: TaxScenario): string {
		const filingStatus = scenario.inputs.filingStatus
		const currentValue = scenario.inputs.seniors65Plus

		if (filingStatus === 'marriedFilingJointly') {
			// For MFJ, show a number input 0-2
			return `<input type="number" data-field="seniors65Plus" data-id="${scenario.id}" value="${currentValue}" min="0" max="2" placeholder="0-2">`
		} else {
			// For Single or MFS, show a checkbox
			const isChecked = currentValue > 0 ? 'checked' : ''
			return `<input type="checkbox" data-field="seniors65Plus" data-id="${scenario.id}" ${isChecked}>`
		}
	}

	private renderResults(scenario: TaxScenario): string {
		if (!scenario.results) return '<p>No results calculated</p>'

		const { results } = scenario
		return `
			<div class="results-grid">
				<div class="result-item">
					<label>Standard Deduction:</label>
					<span>$${results.standardDeduction.toLocaleString()}</span>
				</div>
				<div class="result-item">
					<label>Senior Deduction:</label>
					<span>$${results.seniorDeduction.toLocaleString()}</span>
				</div>
				<div class="result-item">
					<label>Total Deductions:</label>
					<span>$${results.totalDeductions.toLocaleString()}</span>
				</div>
				<div class="result-item">
					<label>Taxable Income:</label>
					<span>$${results.taxableIncome.toLocaleString()}</span>
				</div>
				<div class="result-item">
					<label>Ordinary Tax:</label>
					<span>$${results.ordinaryTax.toLocaleString()}</span>
				</div>
				<div class="result-item">
					<label>Capital Gains Tax:</label>
					<span>$${results.capitalGainsTax.toLocaleString()}</span>
				</div>
				<div class="result-item">
					<label>NIIT (3.8%):</label>
					<span>$${results.niitTax.toLocaleString()}</span>
				</div>
				<div class="result-item highlight">
					<label>Total Tax:</label>
					<span>$${results.totalTax.toLocaleString()}</span>
				</div>
				<div class="result-item highlight">
					<label>Effective Rate:</label>
					<span>${results.effectiveRate.toFixed(2)}%</span>
				</div>
			</div>
		`
	}

	private renderDetailedBreakdownModal(scenario: TaxScenario): string {
		if (!scenario.detailedBreakdown) return ''

		const { income, deductions, ordinaryTax, capitalGainsTax, niit } = scenario.detailedBreakdown

		return `
			<div class="modal-overlay" data-modal-id="${scenario.id}" style="display: none;">
				<div class="modal-content">
					<div class="modal-header">
						<h2>Tax Calculation Details: ${scenario.name}</h2>
						<button class="modal-close" data-modal-id="${scenario.id}" aria-label="Close modal">
							<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<path d="M18 6L6 18M6 6l12 12"/>
							</svg>
						</button>
					</div>
					
					<div class="modal-body">
						<div class="breakdown-section">
							<h3>Income Summary</h3>
							<div class="breakdown-grid">
								<div class="breakdown-item">
									<label>Total Standard Income:</label>
									<span>$${income.totalStandardIncome.toLocaleString()}</span>
								</div>
								<div class="breakdown-item">
									<label>Long-term Capital Gains:</label>
									<span>$${income.longTermCapitalGains.toLocaleString()}</span>
								</div>
								${income.capitalLosses > 0 ? `
								<div class="breakdown-item">
									<label>Capital Losses:</label>
									<span>-$${income.capitalLosses.toLocaleString()}</span>
								</div>
								` : ''}
							</div>
						</div>

						<div class="breakdown-section">
							<h3>Deductions</h3>
							<div class="breakdown-grid">
								<div class="breakdown-item">
									<label>Standard Deduction:</label>
									<span>$${deductions.standardDeduction.toLocaleString()}</span>
								</div>
								${deductions.seniorDeduction > 0 ? `
								<div class="breakdown-item">
									<label>Senior Deduction (${scenario.inputs.seniors65Plus} × $${deductions.seniorDeductionPerPerson.toLocaleString()}):</label>
									<span>$${deductions.seniorDeduction.toLocaleString()}</span>
								</div>
								` : ''}
								<div class="breakdown-item highlight">
									<label>Total Deductions:</label>
									<span>$${deductions.totalDeductions.toLocaleString()}</span>
								</div>
							</div>
						</div>

						<div class="breakdown-section">
							<h3>Ordinary Income Tax</h3>
							<div class="breakdown-grid">
								<div class="breakdown-item">
									<label>Taxable Ordinary Income:</label>
									<span>$${ordinaryTax.taxableOrdinaryIncome.toLocaleString()}</span>
								</div>
								${ordinaryTax.brackets.map(bracket => `
								<div class="breakdown-item bracket-item">
									<label>$${bracket.amount.toLocaleString()} at ${(bracket.rate * 100).toFixed(0)}%:</label>
									<span>$${bracket.tax.toLocaleString()}</span>
								</div>
								`).join('')}
							</div>
						</div>

						<div class="breakdown-section">
							<h3>Capital Gains Tax</h3>
							<div class="breakdown-grid">
								<div class="breakdown-item">
									<label>Taxable Capital Gains:</label>
									<span>$${capitalGainsTax.taxableCapitalGains.toLocaleString()}</span>
								</div>
								${capitalGainsTax.zeroBracket.amount > 0 ? `
								<div class="breakdown-item bracket-item">
									<label>$${capitalGainsTax.zeroBracket.amount.toLocaleString()} at 0%:</label>
									<span>$${capitalGainsTax.zeroBracket.tax.toLocaleString()}</span>
								</div>
								` : ''}
								${capitalGainsTax.fifteenBracket.amount > 0 ? `
								<div class="breakdown-item bracket-item">
									<label>$${capitalGainsTax.fifteenBracket.amount.toLocaleString()} at 15%:</label>
									<span>$${capitalGainsTax.fifteenBracket.tax.toLocaleString()}</span>
								</div>
								` : ''}
								${capitalGainsTax.twentyBracket.amount > 0 ? `
								<div class="breakdown-item bracket-item">
									<label>$${capitalGainsTax.twentyBracket.amount.toLocaleString()} at 20%:</label>
									<span>$${capitalGainsTax.twentyBracket.tax.toLocaleString()}</span>
								</div>
								` : ''}
							</div>
						</div>

						${niit.niitAmount > 0 ? `
						<div class="breakdown-section">
							<h3>Net Investment Income Tax (NIIT)</h3>
							<div class="breakdown-grid">
								<div class="breakdown-item">
									<label>Modified AGI:</label>
									<span>$${niit.magi.toLocaleString()}</span>
								</div>
								<div class="breakdown-item">
									<label>NIIT Threshold:</label>
									<span>$${niit.threshold.toLocaleString()}</span>
								</div>
								<div class="breakdown-item">
									<label>Excess:</label>
									<span>$${niit.excess.toLocaleString()}</span>
								</div>
								<div class="breakdown-item">
									<label>Net Investment Income:</label>
									<span>$${niit.netInvestmentIncome.toLocaleString()}</span>
								</div>
								<div class="breakdown-item bracket-item">
									<label>$${Math.min(niit.netInvestmentIncome, niit.excess).toLocaleString()} × 3.8%:</label>
									<span>$${niit.niitAmount.toLocaleString()}</span>
								</div>
							</div>
						</div>
						` : ''}
					</div>
				</div>
			</div>
		`
	}

	private attachCardEventListeners(card: HTMLElement) {
		// Handle scenario name changes
		const nameInput = card.querySelector('.scenario-name') as HTMLInputElement

		nameInput.addEventListener('blur', () => {
			const id = nameInput.dataset.id!
			this.scenarioManager.updateScenario(id, { name: nameInput.value })
		})

		// Force scenario name to go to ordinary income on Tab/Enter
		nameInput.addEventListener('keydown', (e) => {
			if ((e as KeyboardEvent).key === 'Tab' || (e as KeyboardEvent).key === 'Enter') {
				e.preventDefault()
				const ordinaryIncomeField = card.querySelector('[data-field="ordinaryIncome"]') as HTMLElement
				if (ordinaryIncomeField) {
					ordinaryIncomeField.focus()
				}
			}
		})

		// Get the LTCG field and auto-focus it with selected content
		const ltgField = card.querySelector('[data-field="longTermCapitalGains"]') as HTMLInputElement
		const capitalLossesField = card.querySelector('[data-field="capitalLosses"]') as HTMLInputElement

		// Remove debug UI and logs

		// No forced tabIndex changes; rely on DOM order

		// Table-driven manual tab navigation for stability
		const tabOrderSelectors = [
			'.scenario-name',
			'[data-field="ordinaryIncome"]',
			'[data-field="ordinaryEarnings"]',
			'[data-field="longTermCapitalGains"]',
			'[data-field="capitalLosses"]',
			'[data-field="seniors65Plus"]'
		]
		const tabOrder = tabOrderSelectors
			.map(sel => card.querySelector(sel) as HTMLElement | null)
			.filter((el): el is HTMLElement => !!el)

		// Reset all elements to default tab behavior first
		const allInputs = card.querySelectorAll('input, select, button')
		allInputs.forEach(el => {
			if (el instanceof HTMLElement) {
				el.tabIndex = 0 // Reset to default
			}
		})

		// Assign positive tabindex in order so native tab follows our list
		tabOrder.forEach((el, idx) => {
			el.tabIndex = idx + 1
		})

		// Remove filing status from tab navigation
		const filingStatusField = card.querySelector('[data-field="filingStatus"]') as HTMLElement
		if (filingStatusField) {
			filingStatusField.tabIndex = -1
		}

		// Ensure results section and action buttons are not in tab order
		const resultsElements = card.querySelectorAll('.scenario-results *')
		resultsElements.forEach(el => {
			if (el instanceof HTMLElement) {
				el.tabIndex = -1
			}
		})

		// Remove action buttons from tab order
		const actionButtons = card.querySelectorAll('.scenario-actions button')
		actionButtons.forEach(button => {
			if (button instanceof HTMLElement) {
				button.tabIndex = -1
			}
		})

		// Add custom tab cycling: after 65+ field, Tab goes back to ordinary income
		tabOrder.forEach((el, idx) => {
			el.addEventListener('keydown', (e) => {
				if ((e as KeyboardEvent).key === 'Tab' && !e.shiftKey) {
					// If we're on the last field (65+), cycle back to ordinary income
					if (idx === tabOrder.length - 1) {
						e.preventDefault()
						const ordinaryIncomeField = card.querySelector('[data-field="ordinaryIncome"]') as HTMLElement
						if (ordinaryIncomeField) {
							ordinaryIncomeField.focus()
						}
					}
				}
			})
		})

		// Set up selection on focus for all inputs within this card
		const focusableInputs = card.querySelectorAll('input[data-field], select[data-field]')
		focusableInputs.forEach(el => {
			el.addEventListener('focus', () => {
				if (el instanceof HTMLInputElement) {
					setTimeout(() => el.select(), 10)
				}
			})
		})

		// One-time initial focus: Ordinary Income when app opens
		if (!this.initialFocusDone) {
			const ordinaryIncomeField = card.querySelector('[data-field="ordinaryIncome"]') as HTMLInputElement | null
			if (ordinaryIncomeField) {
				setTimeout(() => {
					ordinaryIncomeField.focus()
					ordinaryIncomeField.select()
				}, 50)
				this.initialFocusDone = true
			}
		}

		// NOTE: Remove autofocus to avoid focus bouncing on re-render during tabbing

		// Handle input field changes
		const inputs = card.querySelectorAll('[data-field]')
		inputs.forEach(input => {
			const inputElement = input as HTMLInputElement

			// Add Enter-to-commit for text/number inputs (triggers blur and recalculation)
			if ((input as HTMLElement).tagName.toLowerCase() === 'input' && inputElement.type !== 'checkbox') {
				inputElement.addEventListener('keydown', (e) => {
					if ((e as KeyboardEvent).key === 'Enter') {
						e.preventDefault()
						inputElement.blur()
					}
				})
			}

			// For text/number inputs, handle changes in real-time with debouncing
			if (inputElement.dataset.field !== 'filingStatus' && inputElement.type !== 'checkbox') {
				let debounceTimeout: number | null = null

				inputElement.addEventListener('input', () => {
					const value = inputElement.value
					const isValid = this.isValidInteger(value)

					// Visual feedback for validation
					if (isValid) {
						inputElement.classList.remove('invalid')
					} else {
						inputElement.classList.add('invalid')
					}

					// Clear previous timeout
					if (debounceTimeout) {
						clearTimeout(debounceTimeout)
					}

					// Debounce the actual update to avoid excessive calculations
					debounceTimeout = window.setTimeout(() => {
						const field = (input as HTMLElement).dataset.field!
						const id = (input as HTMLElement).dataset.id!

						if (this.isValidInteger(value)) {
							const parsedValue = this.parseIntegerValue(value)

							// Check if value has actually changed
							const currentScenario = this.scenarioManager.getScenario(id)
							if (currentScenario) {
								const currentValue = currentScenario.inputs[field as keyof typeof currentScenario.inputs]
								if (parsedValue === currentValue) return
							}

							if (this.preserveFocusDuringUpdates) {
								// Use silent update to prevent focus loss
								this.scenarioManager.updateScenarioSilently(id, {
									inputs: { [field]: parsedValue }
								})

								// Manually update just the results display for this scenario
								this.updateResultsDisplay(id)
							} else {
								// Use normal update with full re-render (may cause focus loss)
								this.scenarioManager.updateScenario(id, {
									inputs: { [field]: parsedValue }
								})
							}
						}
					}, 150) // 150ms debounce
				})
			}

			// For checkboxes, handle change event immediately
			if (inputElement.type === 'checkbox') {
				inputElement.addEventListener('change', () => {
					const field = (input as HTMLElement).dataset.field!
					const id = (input as HTMLElement).dataset.id!
					const value = inputElement.checked ? 1 : 0

					// Check if value has actually changed
					const currentScenario = this.scenarioManager.getScenario(id)
					if (currentScenario) {
						const currentValue = currentScenario.inputs[field as keyof typeof currentScenario.inputs]
						if (value === currentValue) return
					}

					this.scenarioManager.updateScenario(id, {
						inputs: { [field]: value }
					})
				})
			}

			// For filing status changes, trigger immediate update to re-render seniors field
			if (inputElement.dataset.field === 'filingStatus') {
				inputElement.addEventListener('change', () => {
					const field = (input as HTMLElement).dataset.field!
					const id = (input as HTMLElement).dataset.id!
					const value = inputElement.value

					// Check if value has actually changed
					const currentScenario = this.scenarioManager.getScenario(id)
					if (currentScenario) {
						const currentValue = currentScenario.inputs[field as keyof typeof currentScenario.inputs]
						if (value === currentValue) return
					}

					this.scenarioManager.updateScenario(id, {
						inputs: { [field]: value }
					})

					// Move focus to ordinary income after filing status change
					const ordinaryIncomeField = card.querySelector('[data-field="ordinaryIncome"]') as HTMLElement
					if (ordinaryIncomeField) {
						setTimeout(() => ordinaryIncomeField.focus(), 10)
					}
				})
			}
		})

		// Handle action buttons
		const buttons = card.querySelectorAll('[data-action]')
		buttons.forEach(button => {
			button.addEventListener('click', () => {
				const action = (button as HTMLElement).dataset.action!
				const id = (button as HTMLElement).dataset.id!

				if (action === 'duplicate') {
					this.scenarioManager.duplicateScenario(id)
				} else if (action === 'delete') {
					if (confirm('Are you sure you want to delete this scenario?')) {
						this.scenarioManager.deleteScenario(id)
					}
				}
			})
		})
	}

	private attachModalEventListeners(card: HTMLElement) {
		// Handle disclosure button clicks
		const disclosureBtn = card.querySelector('.disclosure-btn') as HTMLElement
		if (disclosureBtn) {
			disclosureBtn.addEventListener('click', () => {
				const id = disclosureBtn.dataset.id!
				this.openModalForScenario(id)
			})
		}
	}

	private openModalForScenario(scenarioId: string) {
		const scenario = this.scenarioManager.getScenario(scenarioId)
		if (!scenario || !scenario.detailedBreakdown) return

		const modalContainer = document.getElementById('global-modal-container')!
		modalContainer.innerHTML = this.renderDetailedBreakdownModal(scenario)

		const modal = modalContainer.querySelector('.modal-overlay') as HTMLElement
		if (modal) {
			// Set up close button event
			const closeBtn = modal.querySelector('.modal-close') as HTMLElement
			if (closeBtn) {
				closeBtn.addEventListener('click', () => this.closeCurrentModal())
			}

			// Set up overlay click to close
			modal.addEventListener('click', (e) => {
				if (e.target === modal) {
					this.closeCurrentModal()
				}
			})

			this.openModal(modal)
		}
	}

	private closeCurrentModal() {
		const modalContainer = document.getElementById('global-modal-container')!
		const modal = modalContainer.querySelector('.modal-overlay') as HTMLElement
		if (modal) {
			this.closeModal(modal)
		}
	}

	private openModal(modal: HTMLElement) {
		modal.style.display = 'flex'
		modal.style.opacity = '0'
		modal.style.transform = 'scale(0.9)'

		// Animate in
		requestAnimationFrame(() => {
			modal.style.transition = 'opacity 0.2s ease, transform 0.2s ease'
			modal.style.opacity = '1'
			modal.style.transform = 'scale(1)'
		})

		// Prevent body scroll
		document.body.style.overflow = 'hidden'
	}

	private closeModal(modal: HTMLElement) {
		modal.style.transition = 'opacity 0.2s ease, transform 0.2s ease'
		modal.style.opacity = '0'
		modal.style.transform = 'scale(0.9)'

		setTimeout(() => {
			const modalContainer = document.getElementById('global-modal-container')!
			modalContainer.innerHTML = ''
			modal.style.transition = ''
		}, 200)

		// Restore body scroll
		document.body.style.overflow = ''
	}

	private updateResultsDisplay(scenarioId: string) {
		const scenario = this.scenarioManager.getScenario(scenarioId)
		if (!scenario) return

		// Find the scenario card and update only the results grid content
		const scenarioCard = document.querySelector(`[data-id="${scenarioId}"]`)?.closest('.scenario-card')
		if (scenarioCard) {
			const resultsGrid = scenarioCard.querySelector('.results-grid')
			if (resultsGrid) {
				// Update only the results grid content, preserving the button and header
				const newResultsHTML = this.renderResults(scenario)
				// Extract just the results-grid content from the new HTML
				const tempDiv = document.createElement('div')
				tempDiv.innerHTML = newResultsHTML
				const newResultsGrid = tempDiv.querySelector('.results-grid')
				if (newResultsGrid) {
					resultsGrid.innerHTML = newResultsGrid.innerHTML
				}
			}
		}
	}
}
