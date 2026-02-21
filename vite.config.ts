import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  build: {
    // Increase chunk size warning limit (default is 500kb)
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        // Manual chunk configuration for better code-splitting
        manualChunks: {
          // React vendor chunk
          'react-vendor': ['react', 'react-dom', 'react-router'],
          
          // Core Radix UI components
          'radix-ui': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-context-menu',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-label',
            '@radix-ui/react-menubar',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toggle-group',
            '@radix-ui/react-toggle',
            '@radix-ui/react-tooltip'
          ],
          
          // Material-UI components
          'mui': [
            '@emotion/react',
            '@emotion/styled',
            '@mui/icons-material',
            '@mui/material'
          ],
          
          // Charts and visualization
          'charts': ['recharts'],
          
          // Form libraries  
          'forms': [
            'react-hook-form',
            'input-otp'
          ],
          
          // DnD libraries
          'dnd': [
            'react-dnd',
            'react-dnd-html5-backend'
          ],
          
          // Carousel and display components
          'display': [
            'embla-carousel-react',
            'react-slick',
            'react-responsive-masonry',
            'react-resizable-panels'
          ],
          
          // Utility libraries
          'utils': [
            'clsx',
            'class-variance-authority',
            'tailwind-merge',
            'date-fns',
            'lucide-react',
            'cmdk',
            'motion',
            'next-themes',
            'sonner',
            'vaul'
          ]
        },
        
        // Ensure consistent chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    
    // Additional optimizations
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    
    // Reduce CSS bundle size
    cssMinify: true
  }
})
