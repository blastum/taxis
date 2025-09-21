import { ScenarioManager } from './scenarioManager.js'
import { UIManager } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
	const scenarioManager = new ScenarioManager()
	const uiManager = new UIManager(scenarioManager)

	// Configuration: Focus preservation during real-time updates
	// Set to false to disable focus preservation (may cause focus loss during typing)
	// Set to true to enable focus preservation (default behavior)
	uiManager.setFocusPreservation(true)

	// Create initial scenario if none exist
	if (scenarioManager.getScenarios().length === 0) {
		scenarioManager.createScenario('Sample Scenario')
	}
})
