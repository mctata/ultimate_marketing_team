// This file serves as a compatibility layer for prop-types in ESM environments
import * as PropTypes from 'prop-types';

// Create a default export that points to the PropTypes object
const propTypes = { ...PropTypes };

export default propTypes;