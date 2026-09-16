import { CalendarDays, Clock, Container, Users, SlidersHorizontal, LayoutDashboard, Truck } from 'lucide-react';
import { NavigationContext } from '../types';
import { UserRole } from '@/types';

export const agendamentoFCLNavigation: NavigationContext = {
  basePath: '/agendamento',
  staticOnly: true,
  items: [
    {
      label: 'Agendamento FCL',
      icon: CalendarDays,
      path: '/agendamento',
      isGroup: true,
      children: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/agendamento' },
        { label: 'Portaria (Gate)', icon: Clock, path: '/agendamento?tab=gate', requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { label: 'DIs & Containers', icon: Container, path: '/agendamento?tab=dis', requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE] },
        { label: 'Motoristas', icon: Users, path: '/agendamento?tab=drivers', requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE, UserRole.CLIENTE, UserRole.DESPACHANTE, UserRole.TRANSPORTADORA] },
        { label: 'Transportadoras', icon: Truck, path: '/agendamento?tab=transportadoras', requiredRoles: [UserRole.CLIENTE, UserRole.DESPACHANTE] },
        {
          label: 'Configurações',
          icon: SlidersHorizontal,
          path: '/agendamento?tab=config',
          requiredRoles: [UserRole.ADMIN, UserRole.EMPLOYEE],
        },
      ],
    },
  ],
};
