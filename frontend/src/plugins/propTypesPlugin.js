/**
 * A custom Vite plugin to handle prop-types compatibility issues between ESM and CJS
 */
export default function propTypesPlugin() {
  const virtualModuleId = 'virtual:prop-types-compat';
  const resolvedVirtualModuleId = '\0' + virtualModuleId;
  
  return {
    name: 'vite-plugin-prop-types-compat',
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
      
      // If this is prop-types being imported by MUI, redirect it
      if (id === 'prop-types' && this.caller?.includes('@mui')) {
        return resolvedVirtualModuleId;
      }
    },
    load(id) {
      if (id === resolvedVirtualModuleId) {
        // This code ensures prop-types has a default export
        return `
          import * as PropTypesModule from 'prop-types';
          
          // Add a default export if it doesn't exist
          const PropTypes = { ...PropTypesModule };
          
          // Ensure it has a default export that refers to itself
          PropTypes.default = PropTypes;
          
          export default PropTypes;
          export * from 'prop-types';
        `;
      }
    }
  };
}