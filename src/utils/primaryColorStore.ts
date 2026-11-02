// Persists the theme picker's primary color in localStorage so it survives reloads and logouts.

const PRIMARY_COLOR_KEY = 'trl_primary_color'

const isHexColor = (value: string) => /^#([0-9a-f]{3}){1,2}$/i.test(value)

export const primaryColorStore = {
  get() {
    if (typeof window === 'undefined') return null

    const color = localStorage.getItem(PRIMARY_COLOR_KEY)

    return color && isHexColor(color) ? color : null
  },
  set(color: string) {
    localStorage.setItem(PRIMARY_COLOR_KEY, color)
  },
  clear() {
    localStorage.removeItem(PRIMARY_COLOR_KEY)
  }
}
