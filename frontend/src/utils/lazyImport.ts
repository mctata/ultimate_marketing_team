import React from 'react';

/**
 * Utility for lazy loading components with TypeScript support
 * 
 * @example
 * // Instead of:
 * const LazyComponent = React.lazy(() => import('./Component'));
 * 
 * // Use:
 * const { Component } = lazyImport(() => import('./Component'));
 * 
 * // This preserves the component name for React DevTools and ensures type safety
 */
export function lazyImport<
  T extends React.ComponentType<any>,
  I extends { [K2 in K]: T },
  K extends keyof I
>(factory: () => Promise<I>, name: K): I {
  return Object.create({
    [name]: React.lazy(() => 
      factory().then((module) => ({ default: module[name] }))
    )
  });
}

/**
 * Helper for lazy loading entire modules
 * Useful for code splitting at the route level
 * 
 * @example
 * // Instead of:
 * const DashboardPage = React.lazy(() => import('./pages/Dashboard'));
 * 
 * // Use:
 * const DashboardPage = lazyPage(() => import('./pages/Dashboard'));
 * 
 * // This enhances debugging and ensures proper loading
 */
export function lazyPage<T extends React.ComponentType<any>>(factory: () => Promise<{ default: T }>) {
  const LazyComponent = React.lazy(factory);
  
  // Return a wrapped component
  return (props: React.ComponentProps<T>): JSX.Element => (
    <React.Suspense fallback={<LoadingPlaceholder />}>
      <LazyComponent {...props} />
    </React.Suspense>
  );
}

/**
 * Simple loading placeholder during lazy loading
 */
const LoadingPlaceholder = () => (
  <div 
    style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      width: '100%',
      height: '200px'
    }}
  >
    <div>Loading...</div>
  </div>
);

export default lazyImport;