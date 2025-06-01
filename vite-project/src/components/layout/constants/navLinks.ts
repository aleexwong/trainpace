export interface NavLinkItem {
    label: string;
    path: string;
    role?: 'admin' | 'user'; // optional access control
  }
  
  export const navLinks: NavLinkItem[] = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Races', path: '/races' },
    { label: 'Fuel Planner', path: '/fuel' },
  ];