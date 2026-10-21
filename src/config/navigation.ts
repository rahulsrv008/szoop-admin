export interface NavItem {
  label: string;
  icon: string;
  path: string;
  /** Empty means every signed-in admin can see it. */
  roles?: string[];
  exact?: boolean;
  /** Shows the booking monitor's live alert count next to the item. */
  monitorBadge?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

/** Drives the sidebar. Keep the order product-first, not alphabetical. */
export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', icon: 'dashboard', path: '/dashboard' }],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Bookings', icon: 'event_note', path: '/bookings' },
      {
        label: 'Booking monitor',
        icon: 'monitor_heart',
        path: '/bookings/monitor',
        monitorBadge: true,
      },
      { label: 'Live bookings', icon: 'sensors', path: '/bookings/live' },
      { label: 'Attendance', icon: 'how_to_reg', path: '/attendance' },
      { label: 'Missed jobs', icon: 'event_busy', path: '/missed-jobs' },
    ],
  },
  {
    title: 'People',
    items: [
      { label: 'Customers', icon: 'people', path: '/customers' },
      { label: 'Agents', icon: 'engineering', path: '/agents' },
      { label: 'Pending approvals', icon: 'verified_user', path: '/agents/pending' },
    ],
  },
  {
    title: 'Catalog',
    items: [
      { label: 'Customer app', icon: 'phone_iphone', path: '/home-content' },
      { label: 'Services', icon: 'home_repair_service', path: '/services' },
      { label: 'Pricing', icon: 'sell', path: '/pricing' },
      { label: 'Service areas', icon: 'map', path: '/service-areas' },
    ],
  },
  {
    title: 'Money',
    items: [
      { label: 'Payments', icon: 'payments', path: '/payments' },
      { label: 'Earnings', icon: 'savings', path: '/earnings' },
      { label: 'Coupons', icon: 'confirmation_number', path: '/coupons' },
    ],
  },
  {
    title: 'Experience',
    items: [
      { label: 'Ratings', icon: 'star_rate', path: '/ratings' },
      { label: 'Complaints', icon: 'support_agent', path: '/complaints' },
      { label: 'Notifications', icon: 'campaign', path: '/notifications' },
    ],
  },
  {
    title: 'Insights',
    items: [{ label: 'Reports', icon: 'insights', path: '/reports' }],
  },
  {
    title: 'System',
    items: [
      {
        label: 'Settings',
        icon: 'settings',
        path: '/settings',
        roles: ['SUPER_ADMIN'],
      },
    ],
  },
];
