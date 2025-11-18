/* eslint-env node */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => {
  // Cargar visualizer solo si la variable de entorno ANALYZE está definida.
  let visualizerPlugin = null;
  // En el contexto de ejecución del config, `import.meta.env` puede no estar disponible.
  // Usamos `process.env` (Node) para detectar la variable ANALYZE de forma segura.
  const analyze = !!(typeof process !== 'undefined' && (process.env.ANALYZE || process.env.npm_config_ANALYZE));
  if (analyze) {
    try {
      const mod = await import('rollup-plugin-visualizer');
      visualizerPlugin = mod.visualizer({ filename: 'dist/stats.html', open: false });
    } catch (err) {
      // Si no está instalado, no fallamos el build; sólo no generamos el reporte.
      console.warn('rollup-plugin-visualizer no está instalado. Para generar el reporte ejecuta: npm i -D rollup-plugin-visualizer', err);
    }
  }

  const plugins = [react()];
  if (visualizerPlugin) plugins.push(visualizerPlugin);

  return {
    plugins,
    server: {
      host: '127.0.0.1',
      port: 4000,
    },
    resolve: {
      alias: {
        '@': '/src',
        '@services': '/src/services',
        '@contexts': '/src/contexts'
      }
    },
    build: {
      // Aumentamos el umbral de advertencia a 1000 KB para evitar ruidos si es aceptable.
      // Esto no reduce los bundles; es sólo para reducir alerts. Ajusta según convenga.
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          // Separar node_modules en chunks para reducir el tamaño del chunk principal.
          manualChunks(id) {
            if (!id || !id.includes) return undefined;
            if (id.includes('node_modules')) {
              // FullCalendar separado
              if (id.includes('@fullcalendar') || id.includes('fullcalendar')) return 'vendor_fullcalendar';
              if (id.includes('react-dom')) return 'vendor_react_dom';
              if (id.includes('react-router')) return 'vendor_router';
              if (id.includes('react-icons')) return 'vendor_icons';
              if (id.includes('axios')) return 'vendor_axios';
              // Caída general para otras dependencias
              return 'vendor';
            }
            return undefined;
          }
        }
      }
    }
  }
})
