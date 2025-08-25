import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  DollarSign, 
  GitBranch, 
  Map 
} from 'lucide-react';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard
  },
  {
    name: 'Tarefas',
    href: '/tasks',
    icon: CheckSquare
  },
  {
    name: 'Agenda',
    href: '/agenda',
    icon: Calendar
  },
  {
    name: 'Comercial',
    href: '/commercial',
    icon: DollarSign
  },
  {
    name: 'Fluxograma',
    href: '/flowchart',
    icon: GitBranch
  },
  {
    name: 'Mapa',
    href: '/map',
    icon: Map
  }
];

const Sidebar = () => {
  return (
    <div className="w-64 bg-card border-r min-h-[calc(100vh-4rem)]">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )
              }
            >
              <Icon className="mr-3 h-4 w-4" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;

