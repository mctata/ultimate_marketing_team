// Modified prop-types with a default export for MUI compatibility
const PropTypes = require('prop-types');

// Add a default property that points to itself
PropTypes.default = PropTypes;

// Export the modified PropTypes object as default and as named exports
module.exports = PropTypes;