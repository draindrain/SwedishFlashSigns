import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Served from its own hostname (flashsigns.drnz.se, via public/CNAME), so the
  // base is the root. A '/SwedishFlashSigns/' base would prefix every asset URL
  // with a path that does not exist on the subdomain.
  base: '/',
})
