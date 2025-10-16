// Re-export bindings from the JSX implementation so imports that
// reference './AuthContext' resolve the same regardless of extension.
export * from './AuthContext.jsx';

// Also provide a named export AuthContext in case some modules import it directly
// (it will be exported by the re-export above).