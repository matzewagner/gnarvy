// const fs = require('fs')
// import RNFetchBlob from 'react-native-fetch-blob'
// Internal: Wrapper around an app being tested, and a bunch of test cases.
//
// The TestScope also includes all the functions available when writing your
// spec files.

class ComponentNotFoundError extends Error {
	constructor(message) {
		super(message);
		this.name = 'ComponentNotFoundError';
	}
};

export default class TestScope {

	constructor(component, waitTime, startDelay) {
		this.component = component;
		this.testHooks = component.testHookStore;

		this.testCases = [];

		this.waitTime = waitTime;
		this.startDelay = startDelay;

		this.run.bind(this);
	}

	// Internal: Synchronously run each test case one after the other, outputting
	// on the console if the test case passes or fails. Also resets the app
	// after each test case by changing the component key to force React to
	// re-render the entire component tree.
	async run() {
		if (this.startDelay) {
			await this.pause(this.startDelay);
		}
		
		const start = new Date
		time = start.toLocaleTimeString()
		dateStr = start.toISOString().slice(-24).replace(/D/g,)
		logStr = `${dateStr.slice(0, 8)}_${time.replace(/:/g, )}.log`
		const startStr = `Gnarvy test suite started at ${start}.`
		console.log(startStr)
		
		// RNFetchBlob.fs.createWriteStream(`./IntegrationTestLogs/${logStr}`, 'utf8')
		// 	.then(stream => {
				for (let i = 0; i < this.testCases.length; i++) {
					let {description, f} = this.testCases[i];
					try {
						await f.call(this);
						const passStr = `${description}  ✅`
						console.log(passStr)
						// stream.write(`n${passStr}`)
					} catch (e) {
						const failStr =`${description}  ❌
						${e.message}`
						console.log(failStr)
						// stream.write(`n${failStr}`)
					}
					await this.component.clearAsync();
					this.component.reRender();
				}
				const stop = new Date();
				const duration = (stop - start) / 1000;
				const endStr = `Gnarvy test suite stopped at ${stop}, duration: ${duration} seconds.`
				console.log(endStr)
				// stream.write(`n${endStr}`)
				// stream.close()
			// })

	}

	// Public: Find a component by its test hook identifier. Waits
	// this.waitTime for the component to appear before abandoning.
	//
	// Usually, you'll want to use `exists` instead.
	//
	// identifier - String, component identifier registered in the test hook store
	//              via `generateTestHook`.
	//
	// Example
	//
	//   import { assert } from 'assert';
	//   const c = await spec.findComponent('MyScene.myComponent');
	//   assert(c, 'Component is missing');
	//
	// Returns a promise; use `await` when calling this function. Resolves the
	// promise if the component is found, rejects the promise after
	// this.waitTime if the component is never found in the test hook
	// store.
	findComponent(identifier) {
		let promise = new Promise((resolve, reject) => {
			let startTime = Date.now();
			let loop = setInterval(() => {
				const component = this.testHooks.get(identifier);
				if (component) {
					clearInterval(loop);
					return resolve(component);
				} else {
					if (Date.now() - startTime >= this.waitTime) {
						reject(new ComponentNotFoundError(`Could not find component with identifier ${identifier}`));
						clearInterval(loop);
					}
				}
			}, 100);
		});

		return promise;
	}

	// Public: Build up a group of test cases.
	//
	// label - Label for these test cases.
	// f     - Callback function containing your tests cases defined with `it`.
	//
	// Example
	//
	//   // specs/MyFeatureSpec.js
	//   export default function(spec) {
	//     spec.describe('My Scene', function() {
	//
	//       spec.it('Has a component', async function() {
	//         await spec.exists('MyScene.myComponent');
	//       });
	//
	//     });
	//   }
	//
	// Returns undefined.
	describe(label, f) {
		this.describeLabel = label;
		f.call(this);
	}

	// Public: Define a test case.
	//
	// label - Label for this test case. This is combined with the label from
	//         `describe` when Gnarvy outputs to the console.
	// f     - The test case.
	//
	// See example above.
	it(label, f) {
		const description = `${this.describeLabel}: ${label}`;
		this.testCases.push({description, f});
	}

	// Public: Fill in a `TextInput`-compatible component with a string value.
	// Your component should respond to the property `onChangeText`.
	//
	// identifier - Identifier for the component.
	// str        - String to fill in.
	//
	// Returns a promise, use await when calling this function. Promise will be
	// rejected if the component is not found.
	async fillIn(identifier, str) {
		const component =  await this.findComponent(identifier);
		component.props.onChangeText(str);
	}

	// Public: 'Press' a component (e.g. a `<Button />`).
	// Your component should respond to the property `onPress`.
	//
	// identifier - Identifier for the component.
	//
	// Returns a promise, use await when calling this function. Promise will be
	// rejected if the component is not found.
	async press(identifier) {
		const component = await this.findComponent(identifier);
		component.props.onPress();
	}

	// Public: Pause the test for a specified length of time, perhaps to allow
	// time for a request response to be received.
	//
	// time - Integer length of time to pause for (in milliseconds).
	//
	// Returns a promise, use await when calling this function.
	async pause(time) {
		let promise = new Promise((resolve, reject) => {
			setTimeout(function() {
				resolve();
			}, time);
		});

		return promise;
	}

	// Public: Check a component exists.
	//
	// identifier - Identifier for the component.
	//
	// Returns a promise, use await when calling this function. Promise will be
	// rejected if component is not found, otherwise will be resolved with
	// `true`.
	async exists(identifier) {
		const component = await this.findComponent(identifier);
		return !!component;
	}

	// Public: Check for the absence of a component. Will potentially halt your
	// test for your maximum wait time.
	//
	// identifier - Identifier for the component.
	async notExists(identifier) {
		try {
			await this.findComponent(identifier);
		} catch(e) {
			if (e.name == 'ComponentNotFoundError') {
				return true;
			}
			throw e;
		}
		throw new Error(`Component with identifier ${identifier} was present`);
	}
}
