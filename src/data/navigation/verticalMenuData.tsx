// Type Imports
import type { VerticalMenuDataType, VerticalMenuItemDataType } from '@/types/menuTypes'
import type { AuthContextValue } from '@/contexts/AuthContext'

type Can = AuthContextValue['can']

type Item = VerticalMenuItemDataType & { visible?: boolean }

const section = (label: string, items: Item[]): VerticalMenuDataType[] => {
  const children = items
    .filter(item => item.visible !== false)
    .map(item => {
      const menuItem = { ...item }

      delete menuItem.visible

      return menuItem
    })

  return children.length ? [{ isSection: true, label, children }] : []
}

// Menu built from the role permissions returned by /master/user-profile
const verticalMenuData = (can: Can, unread = 0): VerticalMenuDataType[] => [
  ...section('Learn', [
    { label: 'Home', href: '/home', icon: 'tabler-smart-home' },
    { label: 'My Training', href: '/my-training', icon: 'tabler-school' },
    { label: 'Recipe Library', href: '/recipes', icon: 'tabler-chef-hat' },
    {
      label: 'Notifications',
      href: '/notifications',
      icon: 'tabler-bell',
      ...(unread ? { suffix: { label: unread, color: 'error' } } : {})
    }
  ]),
  ...section('Team', [
    { label: 'Team Progress', href: '/team', icon: 'tabler-users-group', visible: can('report') },
    { label: 'Reports', href: '/reports', icon: 'tabler-chart-bar', visible: can('report') }
  ]),
  ...section('Content', [
    { label: 'Training Modules', href: '/admin/modules', icon: 'tabler-books', visible: can('training') },
    { label: 'Training Paths', href: '/admin/paths', icon: 'tabler-route', visible: can('path') },
    { label: 'Assignments', href: '/admin/assignments', icon: 'tabler-clipboard-check', visible: can('assignment') },
    { label: 'Recipes', href: '/admin/recipes', icon: 'tabler-tools-kitchen-2', visible: can('recipe') },
    {
      label: 'Video Library',
      href: '/admin/videos',
      icon: 'tabler-movie',
      visible: can(['training', 'recipe'], 'write')
    },
    { label: 'Categories', href: '/admin/categories', icon: 'tabler-category', visible: can('category') }
  ]),
  ...section('Organisation', [
    { label: 'Users', href: '/admin/users', icon: 'tabler-users', visible: can('user') },
    { label: 'Outlets', href: '/admin/outlets', icon: 'tabler-building-store', visible: can('outlet') },
    { label: 'Brands', href: '/admin/brands', icon: 'tabler-tag', visible: can('brand') },
    { label: 'Roles & Permissions', href: '/admin/roles', icon: 'tabler-shield-lock', visible: can('role') },
    { label: 'Audit Log', href: '/admin/audit', icon: 'tabler-history', visible: can('audit') }
  ])
]

export default verticalMenuData
