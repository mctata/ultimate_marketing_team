// This file serves as a compatibility layer for prop-types in ESM environments
import * as PropTypesNamespace from 'prop-types';

// Create a default export that points to the PropTypes object
const PropTypes = PropTypesNamespace;
PropTypes.default = PropTypesNamespace;

export default PropTypes;