// src/extension/popup/components/AppHeader.tsx
import React from 'react';
import { Sparkles } from 'lucide-react';
import { CardHeader, CardTitle } from "@/components/ui/card";
import { getMessage } from '@/core/utils/i18n';
import { AuthUser } from '@/types';

interface AppHeaderProps {
  isAuthenticated: boolean;
  user: AuthUser | null;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ 
  isAuthenticated,
  user
}) => {
  return (
    <CardHeader className="pb-2 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-blue-500 opacity-90 bg-animate"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwMC44NzYgMTYwLjAwOGM2LjgxOCA2LjgxOCAxNi4xMTQgMTEuMDM5IDI2LjQxNCAxMS4wMzlzMTkuNTk2LTQuMjIxIDI2LjQxNC0xMS4wMzlsLjAwMS0uMDAxYzYuODE5LTYuODE4IDExLjA0MS0xNi4xMTQgMTEuMDQxLTI2LjQxNCAwLTEwLjMtNC4yMjItMTkuNTk3LTExLjA0MS0yNi40MTYtNi44MTgtNi44MTgtMTYuMTE0LTExLjA0LTI2LjQxNC0xMS4wNC0xMC4zIDAtMTkuNTk2IDQuMjIyLTI2LjQxNCAxMS4wNGwtLjAwMi4wMDFjLTYuODE4IDYuODE5LTExLjAzOSAxNi4xMTQtMTEuMDM5IDI2LjQxNCAwIDEwLjMgNC4yMjEgMTkuNTk2IDExLjAzOSAyNi40MTRsLjAwMS4wMDFaIiBmaWxsPSIjZmZmZmZmMTAiLz48cGF0aCBkPSJNMjU2IDMwNmM4LjI4NCAwIDE1LTYuNzE2IDE1LTE1IDAtOC4yODQtNi43MTYtMTUtMTUtMTVzLTE1IDYuNzE2LTE1IDE1YzAgOC4yODQgNi43MTYgMTUgMTUgMTVaIiBmaWxsPSIjZmZmZmZmMTAiLz48cGF0aCBkPSJNMTg4IDM3MC41YzAgMTEuODc0IDkuNjI2IDIxLjUgMjEuNSAyMS41UzIzMSAzODIuMzc0IDIzMSAzNzAuNSAyMjEuMzc0IDM0OSAyMDkuNSAzNDkgMTg4IDM1OC42MjYgMTg4IDM3MC41WiIgZmlsbD0iI2ZmZmZmZjEwIi8+PHBhdGggZD0iTTMxNCAyODVjMCA0LjQ0Mi0zLjU1OCA4LTggOHMtOC0zLjU1OC04LTggMy41NTgtOCA4LTggOCAzLjU1OCA4IDhaIiBmaWxsPSIjZmZmZmZmMTAiLz48L3N2Zz4=')] bg-cover opacity-50"></div>
      
      {/* Add geometric shapes for modern touch */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-white opacity-5 rounded-full transform translate-x-8 -translate-y-8"></div>
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white opacity-5 rounded-full transform -translate-x-8 translate-y-8"></div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center mr-3 shadow-sm">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-white text-xl font-bold">
              {getMessage('aiToolLauncher', undefined, 'AI Tool Launcher')}
            </CardTitle>
          </div>
          {isAuthenticated && (
            <div className="flex items-center space-x-1 bg-white/10 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-xs text-white/90 font-medium">
                {getMessage('online', undefined, 'Online')}
              </span>
            </div>
          )}
        </div>
        
        {isAuthenticated && user && (
          <div className="text-sm text-blue-100 mt-2 flex items-center">
            <div className="glass px-3 py-1 rounded-full text-xs flex items-center space-x-1 backdrop-blur-sm bg-white/10 shadow-inner">
              <span className="text-white/90">
                {getMessage('signedInAs', undefined, 'Signed in as')}
              </span>
              <span className="font-semibold text-white truncate max-w-[180px]">
                {user.email || user.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </CardHeader>
  );
};