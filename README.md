# Gnarvy


**Gnarvy** is a cross-platform integration test framework for React Native. It is built on top of Cavy by
[Pixie Labs](http://pixielabs.io) but includes additional features.


## Gnarvy specifics:
* The `hook()` and `wrap()` methods know wether `INTEGRATION_TESTING` is enabled and if not, they will simply return the unaltered component. In order for this to work, you need to export `INTEGRATION_TESTING` as `true` or `false` from your *testConfig.js* file in the top-level of Yardsale.

* In addition to Cavy's generateTestHook function, Gnarvy uses **gnarHook**, which can handles cases where the component has a ref on its own, prior to adding testing functionality. If `INTEGRATION_TESTING` is enabled, gnarHook will run the generateTestHook function under the hood. In order for this to work, gnarHook needs to bind to its component: 
  ```javascript
  <MyComponent ref={gnarHook.bind(this)('MyRef')} />
  ```
  Note that for functional (stateless) components, where props get passed in as a function argument, you will need to supply them as the 3rd function argument, and you can omit the binding.
  ```javascript
  const MyFunctionalComponent = (props) => {
    return (
      <View ref={gnarHook('MyRef', null, props) />
    )
  }
  ```

## From Cavy:

### How does it work?

Gnarvy (ab)uses React `ref` generating functions to give you the ability to refer
to, and simulate actions upon, deeply nested components within your
application. Unlike a tool like [enzyme](https://github.com/airbnb/enzyme)
which uses a simulated renderer, Gnarvy runs within your live application as it
is running on a host device (e.g. your Android or iOS simulator).

This allows you to do far more accurate integration testing than if you run
your React app within a simulated rendering environment.

### Where does it fit in?

We built Gnarvy because, at the time of writing, React Native had only a handful
of testing approaches available:

1. Unit testing components ([Jest](https://github.com/facebook/jest)).
2. Shallow-render testing components ([enzyme](https://github.com/airbnb/enzyme)).
3. Testing within your native environment, using native JS hooks ([Appium](http://appium.io/)).
4. Testing completely within your native environment ([XCTest](https://developer.apple.com/reference/xctest)).

Gnarvy fits in between shallow-render testing and testing within your native
environment.

### Gnarvy's components

Gnarvy provides 3 tools to let you run integration tests:

1. A store of 'test hooks'; key-value pairs between a string identifier and a
   component somewhere in your app component tree.
2. A set of helper functions to write spec files.
3. A `<Tester>` component you wrap around your entire app to make the test hook
   store available, and autorun your test cases on boot.

## Installation

To get started using Gnarvy, install it using `yarn`:

    yarn add gnarvy --dev

or `npm`:

    npm i --save-dev gnarvy

## Basic usage

Check out [the sample app](https://github.com/pixielabs/cavy/tree/master/sample-app/EmployeeDirectory) for example usage. Here it is running:

![Sample app running](https://cloud.githubusercontent.com/assets/126989/22829358/193b5c0a-ef9a-11e6-994e-d4df852a6181.gif)

### Hook up components for testing

Add 'hooks' to any components you want to test by adding a `ref` and using the
`generateTestHook` function.

`generateTestHook` takes a string as its first argument - this is the identifier
to be used in tests. It takes an optional second argument in case you want to
set your own `ref` generating function.

Stateless functional components cannot be assigned a `ref` since they don't have
instances. Use the `wrap` function to wrap them inside a non-stateless component.

```javascript
import React, { Component } from 'react';
import { TextInput } from 'react-native';
import { FuncComponent } from 'somewhere';

import { hook, wrap } from 'gnarvy';

class Scene extends Component {
  render() {
    const WrappedComponent = wrap(FuncComponent);
    return (
      <View>
        <TextInput
          ref={this.props.generateTestHook('Scene.TextInput')}
          onChangeText={...}
        />
        <WrappedComponent
          ref={this.props.generateTestHook('Scene.Component')}
          onPress={...}
        />
      </View>      
    );
  }
}

const TestableScene = hook(Scene);
export default TestableScene;
```

### Write your test cases

Using your component identifiers, write your spec functions. We suggest saving
these in a spec folder, naming them something like `./specs/AppSpec.js`.

```javascript
export default function(spec) {
  spec.describe('My feature', function() {
    spec.it('works', async function() {
      await spec.fillIn('Scene.TextInput', 'some string')
      await spec.press('Scene.button');
      await spec.exists('NextScene')
    });
  });
}
```

[See below](#available-spec-helpers) for a list of currently available spec
helper functions.

### Set up your test wrapper

Import `Tester`, `TestHookStore` and your specs in your top-level JS file
(typically this is your `index.{ios,android}.js` files), and instantiate a new
`TestHookStore`.

Wrap your app in a Tester component, passing in the `TestHookStore` and an array
containing your imported spec functions.

Optional props:

`waitTime`          - Integer, the time in milliseconds that your tests should
                      wait to find specified 'hooked' components.
                      Set to `2000` (2 seconds) by default.

`startDelay`        - Integer, the time in milliseconds before test execution
                      begins. Set to `0` by default.

`clearAsyncStorage` - Boolean, set this to `true` to clear AsyncStorage between
                      each test e.g. to remove a logged in user.
                      Set to `false` by default.

```javascript
import React, { Component } from 'react';
import { AppRegistry } from 'react-native';
import { Tester, TestHookStore } from 'gnarvy';
import AppSpec from './specs/AppSpec';
import App from './app';

const testHookStore = new TestHookStore();

export default class AppWrapper extends Component {
  render() {
    return (
      <Tester specs={[AppSpec]} store={testHookStore} waitTime={4000}>
        <App />
      </Tester>
    );
  }
}

AppRegistry.registerComponent('AppWrapper', () => AppWrapper);
```

**Congratulations! You are now all set up to start testing your app with Gnarvy.**

Your tests will run automatically when you run your app using either:

    $ react-native run-ios

or

    $ react-native run-android

## Available spec helpers

`fillIn(identifier, str)` - fills in the identified 'TextInput'-compatible
component with the provided string (str). Your component must respond to the
property `onChangeText`.

`press(identifier)` - presses the identified component. Your component must
respond to the property `onPress`.

`pause(integer)` - pauses the running test for the length of time, specified in
milliseconds (integer). This is useful if you need to allow time for a response
to be received before progressing.

`exists(identifier)` - returns `true` if the component can be identified (i.e.
is currently on screen).

`notExists(identifier)` - as above, but checks for the absence of the
component.

`findComponent(identifier)` - returns the identified component. This function
should be used if your testable component does not respond to either
`onChangeText` or `onPress`, for example:

```javascript
picker = await spec.findComponent('Scene.modalPicker');
picker.open();
```

## FAQs

#### How does Gnarvy compare to Appium? What is the benefit?

Gnarvy is a comparable tool to Appium. The key difference is that Appium uses
native hooks to access components (accessibility IDs), wheras Gnarvy uses React
Native refs. This means that Gnarvy sits directly within your React Native
environment (working identically with both Android and iOS builds), making it
easy to integrate into your application very quickly, without much
overhead.

#### What does this allow me to do that Jest does not?

Jest is a useful tool for unit testing individual React Native components,
whereas Gnarvy is an integration testing tool allowing you to run end-to-end user
interface tests.

#### How about supporting stateless components?

We'd love for Gnarvy to be better compatible with stateless functional components
and would be more than happy to see its reliance on refs replaced with something
better suited to the task...
What that looks like specifically, we're not 100% sure yet. We're very happy to
discuss possible alternatives!

## Contributing

- Check out the latest master to make sure the feature hasn't been implemented
  or the bug hasn't been fixed yet.
- Check out the issue tracker to make sure someone already hasn't requested it
  and/or contributed it.
- Fork the project.
- Start a feature/bugfix branch.
- Commit and push until you are happy with your contribution.
- Please try not to mess with the package.json, version, or history. If you
  want to have your own version, or is otherwise necessary, that is fine, but
  please isolate to its own commit so we can cherry-pick around it.
