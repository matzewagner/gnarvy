import React, { createClass } from 'react';
import { INTEGRATION_TESTING } from '../../../localConfig.js'

// Public: Wrap a stateless (purely functional) component in a non-stateless
// component so that a `ref` can be added.
//
// For example, the react-native-elements <Button /> is purely functional, so
// a ref cannot be assigned and thus it cannot be added to your Gnarvy test hook
// store.
//
// statelessComponent - The purely functional React component you want to wrap.
//
// Example
//
//   import {
//     Button
//   } from 'react-native-elements';
//   import { wrap } from 'gnarvy';
//
//   class MyComponent extends React.Component {
//     // ...
//     render() {
//       const wrappedButton = wrap(Button);
//
//       // ...
//     }
//   }
export default function wrap(statelessComponent) {
  if (!INTEGRATION_TESTING) return statelessComponent

  var reactClass = {}

  Object.keys(statelessComponent).forEach(function (key) {
    reactClass[key] = statelessComponent[key];
  });

  if (statelessComponent.defaultProps) {
    reactClass.getDefaultProps = function() {
      return statelessComponent.defaultProps;
    }
  }

  reactClass.displayName = statelessComponent.name || statelessComponent.displayName;
  reactClass.render = function() {
    return statelessComponent(this.props, this.context);
  };

  return createClass(reactClass);
}
