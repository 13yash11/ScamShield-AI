import React from 'react';
import { Sidebar } from './Sidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-[calc(100vh-4rem-120px)] bg-background-secondary/40">
      <Sidebar />
      <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl">
        {children}
      </div>
    </div>
  );
};
