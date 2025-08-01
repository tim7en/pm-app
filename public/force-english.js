// Force clear language preference and set to English
if (typeof window !== 'undefined') {
  console.log('Forcing language to English...')
  localStorage.removeItem('language')
  localStorage.setItem('language', 'en')
  console.log('Language set to:', localStorage.getItem('language'))
  // Reload the page to apply changes
  window.location.reload()
}
