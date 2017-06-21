import { INTEGRATION_TESTING } from '../../../testConfig.js'

export default gnarHook = function(hookName, refArg, props /* string or function */) {
    if (!INTEGRATION_TESTING && !refArg) { return }
    return (
				ref => {
					switch (typeof refArg) {
							case 'function':
									refArg(ref)
							case 'string':
									this.refs[refArg] = ref
					} 
					
					if (INTEGRATION_TESTING) {
							if (!this.props && !props) return console.error('Props were not supplied')
							const { generateTestHook } = this.props || props
							if (!generateTestHook) return console.error(`Can't find generateTestHook()`)
							generateTestHook(hookName)(ref)
					}
			}
		)
}