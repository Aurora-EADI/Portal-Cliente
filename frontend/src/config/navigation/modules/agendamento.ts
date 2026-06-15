import { CalendarDays, Home, Clock, Container, Users, SlidersHorizontal } from 'lucide-react';
import { NavigationContext } from '../types';
import { UserRole } from '@/types';

export const agendamentoFCLNavigation: NavigationContext = {
  basePath: '/agendamento',
  staticOnly: true,
  items: [
    { label: 'Home', icon: Home, path: '/modules' },
    {
      label: 'Agendamento FCL',
      icon: CalendarDays,
      path: '/agendamento',
      isGroup: true,
      children: [
        { label: 'Dashboard', icon: Home, path: '/agendamento' },
        { label: 'Novo Agendamento', icon: CalendarDays, path: '/agendamento?tab=wizard' },
        { label: 'Portaria (Gate)', icon: Clock, path: '/agendamento?tab=gate' },
        { label: 'DIs & Containers', icon: Container, path: '/agendamento?tab=dis' },
        { label: 'Motoristas', icon: Users, path: '/agendamento?tab=drivers' },
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
