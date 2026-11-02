// Next Imports
import type { MetadataRoute } from 'next'

// Installable PWA: staff can add the portal to the home screen on Android and iPhone
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Indoventura Training',
    short_name: 'Training',
    description: 'Staff training, SOPs and recipe library',
    start_url: '/home',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#25293C',
    theme_color: '#7367F0',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
    ]
  }
}
