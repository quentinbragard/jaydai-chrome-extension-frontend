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
  const logo = chrome.runtime.getURL('images/full-logo-white.png');
  return (
    <CardHeader className="jd-pb-2 jd-relative jd-overflow-hidden">
      <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-indigo-600 jd-to-blue-500 jd-opacity-90 jd-bg-animate jd-rounded-lg"></div>
      <div className="jd-absolute jd-inset-0 jd-bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAwIiBoZWlnaHQ9IjUwMCIgdmlld0JveD0iMCAwIDUwMCA1MDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIwMC44NzYgMTYwLjAwOGM2LjgxOCA2LjgxOCAxNi4xMTQgMTEuMDM5IDI2LjQxNCAxMS4wMzlzMTkuNTk2LTQuMjIxIDI2LjQxNC0xMS4wMzlsLjAwMS0uMDAxYzYuODE5LTYuODE4IDExLjA0MS0xNi4xMTQgMTEuMDQxLTI2LjQxNCAwLTEwLjMtNC4yMjItMTkuNTk3LTExLjA0MS0yNi40MTYtNi44MTgtNi44MTgtMTYuMTE0LTExLjA0LTI2LjQxNC0xMS4wNC0xMC4zIDAtMTkuNTk2IDQuMjIyLTI2LjQxNCAxMS4wNGwtLjAwMi4wMDFjLTYuODE4IDYuODE5LTExLjAzOSAxNi4xMTQtMTEuMDM5IDI2LjQxNCAwIDEwLjMgNC4yMjEgMTkuNTk2IDExLjAzOSAyNi40MTRsLjAwMS4wMDFaIiBmaWxsPSIjZmZmZmZmMTAiLz48cGF0aCBkPSJNMjU2IDMwNmM4LjI4NCAwIDE1LTYuNzE2IDE1LTE1IDAtOC4yODQtNi43MTYtMTUtMTUtMTVzLTE1IDYuNzE2LTE1IDE1YzAgOC4yODQgNi43MTYgMTUgMTUgMTVaIiBmaWxsPSIjZmZmZmZmMTAiLz48cGF0aCBkPSJNMTg4IDM3MC41YzAgMTEuODc0IDkuNjI2IDIxLjUgMjEuNSAyMS41UzIzMSAzODIuMzc0IDIzMSAzNzAuNSAyMjEuMzc0IDM0OSAyMDkuNSAzNDkgMTg4IDM1OC42MjYgMTg4IDM3MC41WiIgZmlsbD0iI2ZmZmZmZjEwIi8+PHBhdGggZD0iTTMxNCAyODVjMCA0LjQ0Mi0zLjU1OCA4LTggOHMtOC0zLjU1OC04LTggMy41NTgtOCA4LTggOCAzLjU1OCA4IDhaIiBmaWxsPSIjZmZmZmZmMTAiLz48L3N2Zz4=')] bg-cover opacity-50"></div>
      
      {/* Add geometric shapes for modern touch */}
      <div className="jd-absolute jd-top-0 jd-right-0 jd-w-24 jd-h-24 jd-bg-white jd-opacity-5 jd-rounded-full jd-transform jd-translate-x-8 jd-translate-y-8"></div>
      <div className="jd-absolute jd-bottom-0 jd-left-0 jd-w-16 jd-h-16 jd-bg-white jd-opacity-5 jd-rounded-full jd-transform jd-translate-x-8 jd-translate-y-8"></div>
      
      <div className="jd-relative jd-z-10">
        <div className="jd-flex jd-items-center jd-justify-between">
          <div className="jd-flex jd-items-center">
            <div className="jd-w-16 jd-h-16 jd-rounded-md  jd-flex jd-items-center jd-justify-center jd-mr-3">
              <img src={logo} alt="Logo" className="jd-object-contain" />
            </div>
          </div>
          {isAuthenticated && (
            <div className="jd-flex jd-items-center jd-space-x-1 jd-bg-white/10 jd-backdrop-blur-sm jd-rounded-full jd-px-2 jd-py-1">
              <span className="jd-w-2 jd-h-2 jd-bg-green-400 jd-rounded-full jd-animate-pulse"></span>
              <span className="jd-text-xs jd-text-white/90 jd-font-medium">
                {getMessage('online', undefined, 'Online')}
              </span>
            </div>
          )}
        </div>
        
        {isAuthenticated && user && (
          <div className="jd-text-sm jd-text-blue-100 jd-mt-2 jd-flex jd-items-center">
            <div className="jd-glass jd-px-3 jd-py-1 jd-rounded-full jd-text-xs jd-flex jd-items-center jd-space-x-1 jd-backdrop-blur-sm jd-bg-white/10 jd-shadow-inner">
              <span className="jd-text-white/90">
                {getMessage('signedInAs', undefined, 'Signed in as')}
              </span>
              <span className="jd-font-semibold jd-text-white jd-truncate jd-max-w-[180px]">
                {user.email || user.name}
              </span>
            </div>
          </div>
        )}
      </div>
    </CardHeader>
  );
};