import { ScenarioManager } from './scenarioManager.js'
import { UIManager } from './ui.js'

document.addEventListener('DOMContentLoaded', () => {
	const scenarioManager = new ScenarioManager()
	new UIManager(scenarioManager)

	// Create initial scenario if none exist
	if (scenarioManager.getScenarios().length === 0) {
		scenarioManager.createScenario('Sample Scenario')
	}
})
