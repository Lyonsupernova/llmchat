'use client';

import React, { ReactNode, createContext, useContext, useEffect } from 'react';
import { RootLayout } from '@repo/common/components';
import { ReactQueryProvider, RootProvider } from '@repo/common/context';
import { TooltipProvider } from '@repo/ui';

// Import the Role enum from Prisma schema
type Role = 'USER' | 'LAWYER' | 'REALTOR' | 'ADMIN';

interface LLMChatAppProps {
  children: ReactNode;
  role?: Role;
}

// Create Role Context
interface RoleContextType {
  role: Role;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

// Role Provider Component
// const RoleProvider = ({ children, role }: { children: ReactNode; role: Role }) => {
 

//   return (
//     <RoleContext.Provider value={{ role }}>
//       {children}
//     </RoleContext.Provider>
//   );
// };

// Hook to use role context
export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const LLMChatApp = ({ 
  children, 
  role = 'USER'
}: LLMChatAppProps) => {
  return (
    <RootProvider>
      <TooltipProvider>
        <ReactQueryProvider>
            <RootLayout>
              {children}
            </RootLayout>
        </ReactQueryProvider>
      </TooltipProvider>
    </RootProvider>
  );
};

export default LLMChatApp;
export type { Role, LLMChatAppProps }; 