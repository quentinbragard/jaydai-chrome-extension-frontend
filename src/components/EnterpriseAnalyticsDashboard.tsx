// src/components/dialogs/analytics/EnterpriseAnalyticsDashboard.tsx
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Area, AreaChart, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar, ComposedChart
} from 'recharts';
import { 
  Users, Building2, User, AlertTriangle, Zap, Leaf, TrendingUp, Target,
  Calendar, Clock, Globe, Shield, Award, BookOpen, MoreVertical, Send,
  BarChart3, PieChart as PieChartIcon, Activity, ArrowUpRight, ArrowDownRight,
  Mail, MessageSquare, BrainCircuit, Lightbulb, Code, FileText, Search,
  PenTool, Cpu, Heart, DollarSign, Gauge, CheckCircle, XCircle, Sparkles,
  TrendingDown, Star, Infinity, Layers, Hexagon
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Types and Interfaces
interface Department {
  id: string;
  name: string;
  employees: number;
  usage_score: number;
  security_score: number;
  teams: Team[];
}

interface Team {
  id: string;
  name: string;
  dept_id: string;
  employees: number;
  usage_score: number;
  security_score: number;
  members: Employee[];
}

interface Employee {
  id: string;
  name: string;
  role: string;
  dept_id: string;
  team_id: string;
  maturity_level: 'Débutant' | 'Explorateur' | 'Optimisateur' | 'Stratège';
  usage_score: number;
  security_score: number;
  interactions: number;
  last_active: string;
  issues: string[];
  avatar_url?: string;
}

type ViewType = 'company' | 'department' | 'team' | 'employee';

// Enhanced Mock Data with more realistic values and avatars
const mockData = {
  departments: [
    {
      id: 'marketing',
      name: 'Marketing & Communication',
      employees: 28,
      usage_score: 87,
      security_score: 82,
      teams: [
        {
          id: 'digital-marketing',
          name: 'Marketing Digital',
          dept_id: 'marketing',
          employees: 14,
          usage_score: 94,
          security_score: 85,
          members: [
            {
              id: 'emp1',
              name: 'Sophie Martin',
              role: 'Chef de projet digital',
              dept_id: 'marketing',
              team_id: 'digital-marketing',
              maturity_level: 'Optimisateur' as const,
              usage_score: 96,
              security_score: 91,
              interactions: 347,
              last_active: '2024-01-15',
              issues: [],
              avatar_url: 'https://images.unsplash.com/photo-1494790108041-6d2a3b2b2c7c?w=150&h=150&fit=crop&crop=face'
            },
            {
              id: 'emp2',
              name: 'Pierre Dubois',
              role: 'Content Manager',
              dept_id: 'marketing',
              team_id: 'digital-marketing',
              maturity_level: 'Explorateur' as const,
              usage_score: 68,
              security_score: 45,
              interactions: 156,
              last_active: '2024-01-12',
              issues: ['Données sensibles détectées', 'Charte IA non respectée'],
              avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }
          ]
        },
        {
          id: 'brand-marketing',
          name: 'Marketing Brand',
          dept_id: 'marketing',
          employees: 14,
          usage_score: 81,
          security_score: 79,
          members: []
        }
      ]
    },
    {
      id: 'rh',
      name: 'Ressources Humaines',
      employees: 21,
      usage_score: 75,
      security_score: 94,
      teams: [
        {
          id: 'talent-acquisition',
          name: 'Acquisition de talents',
          dept_id: 'rh',
          employees: 11,
          usage_score: 71,
          security_score: 97,
          members: []
        }
      ]
    },
    {
      id: 'tech',
      name: 'Technique & Innovation',
      employees: 45,
      usage_score: 93,
      security_score: 88,
      teams: [
        {
          id: 'dev-backend',
          name: 'Développement Backend',
          dept_id: 'tech',
          employees: 18,
          usage_score: 96,
          security_score: 92,
          members: []
        },
        {
          id: 'dev-frontend',
          name: 'Développement Frontend',
          dept_id: 'tech',
          employees: 15,
          usage_score: 91,
          security_score: 89,
          members: []
        }
      ]
    },
    {
      id: 'finance',
      name: 'Finance & Contrôle',
      employees: 18,
      usage_score: 69,
      security_score: 91,
      teams: []
    }
  ] as Department[],

  // Enhanced usage statistics
  usageStats: {
    total_interactions: 18724,
    active_users: 89,
    total_users: 112,
    avg_sessions_per_day: 187,
    growth_rate: 28.3
  },

  // Usage by Category with enhanced data
  usageByCategory: [
    { name: 'Rédaction & Content', value: 3456, color: '#6366f1', trend: '+15%' },
    { name: 'Recherche & Analyse', value: 2987, color: '#06d6a0', trend: '+23%' },
    { name: 'Code & Développement', value: 2654, color: '#f72585', trend: '+31%' },
    { name: 'Data Analysis', value: 2234, color: '#ffbe0b', trend: '+18%' },
    { name: 'Brainstorming', value: 1876, color: '#8338ec', trend: '+12%' },
    { name: 'RH & Ressources', value: 1654, color: '#fb5607', trend: '+9%' },
    { name: 'Marketing & Ventes', value: 1543, color: '#219ebc', trend: '+26%' },
    { name: 'Formation & Aide', value: 1320, color: '#ff006e', trend: '+14%' }
  ],

  // Enhanced maturity distribution
  maturityDistribution: [
    { name: 'Débutant', count: 27, percentage: 24, color: '#ef4444' },
    { name: 'Explorateur', count: 34, percentage: 30, color: '#f59e0b' },
    { name: 'Optimisateur', count: 31, percentage: 28, color: '#3b82f6' },
    { name: 'Stratège', count: 20, percentage: 18, color: '#10b981' }
  ],

  // Enhanced energy consumption
  energyConsumption: [
    { month: 'Août', company: 178.4, sector_avg: 234.7, equivalent: '26 h de streaming vidéo', efficiency: 76 },
    { month: 'Sept', company: 195.8, sector_avg: 241.3, equivalent: '29 h de streaming vidéo', efficiency: 81 },
    { month: 'Oct', company: 203.2, sector_avg: 248.9, equivalent: '30 h de streaming vidéo', efficiency: 82 },
    { month: 'Nov', company: 189.5, sector_avg: 255.4, equivalent: '28 h de streaming vidéo', efficiency: 74 },
    { month: 'Déc', company: 167.3, sector_avg: 262.1, equivalent: '25 h de streaming vidéo', efficiency: 64 },
    { month: 'Jan', company: 156.7, sector_avg: 268.8, equivalent: '23 h de streaming vidéo', efficiency: 58 }
  ],

  // Enhanced security metrics
  securityMetrics: {
    sensitive_data_detected: 89,
    blocked_requests: 31,
    charter_violations: 28,
    security_score: 87,
    total_scans: 18724,
    false_positives: 7
  },

  // Enhanced department comparison
  departmentComparison: [
    { name: 'Marketing', usage: 87, security: 82, maturity: 8.1, innovation: 89 },
    { name: 'Technique', usage: 93, security: 88, maturity: 9.2, innovation: 95 },
    { name: 'RH', usage: 75, security: 94, maturity: 7.3, innovation: 72 },
    { name: 'Finance', usage: 69, security: 91, maturity: 6.8, innovation: 65 },
    { name: 'Ventes', usage: 82, security: 76, maturity: 7.8, innovation: 84 },
    { name: 'Opérations', usage: 78, security: 85, maturity: 7.5, innovation: 79 }
  ],

  // Enhanced sector comparison
  sectorComparison: {
    company_score: 87,
    sector_average: 78,
    top_quartile: 92,
    market_leaders: [
      { name: 'Google', score: 97, logo: '🔍' },
      { name: 'Microsoft', score: 96, logo: '⊞' },
      { name: 'Meta', score: 94, logo: '◐' },
      { name: 'Amazon', score: 93, logo: '📦' }
    ]
  },

  // New productivity insights
  productivityInsights: [
    { 
      category: 'Automatisation',
      impact: 95,
      hours_saved: 247,
      description: 'Automatisation des tâches répétitives',
      icon: <Cpu className="h-5 w-5" />
    },
    {
      category: 'Créativité',
      impact: 88,
      hours_saved: 156,
      description: 'Génération d\'idées et brainstorming',
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      category: 'Analyse',
      impact: 92,
      hours_saved: 203,
      description: 'Analyse de données et insights',
      icon: <BarChart3 className="h-5 w-5" />
    },
    {
      category: 'Communication',
      impact: 79,
      hours_saved: 124,
      description: 'Rédaction et communication',
      icon: <MessageSquare className="h-5 w-5" />
    }
  ],

  // Enhanced user risk data with avatars
  userRiskData: [
    { 
      name: 'Pierre Dubois', 
      dept: 'Marketing', 
      violations: 12, 
      risk: 'high', 
      score: 45,
      avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    },
    { 
      name: 'Marie Leroux', 
      dept: 'Finance', 
      violations: 8, 
      risk: 'medium', 
      score: 67,
      avatar_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    },
    { 
      name: 'Thomas Bernard', 
      dept: 'RH', 
      violations: 6, 
      risk: 'medium', 
      score: 72,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
    },
    { 
      name: 'Sophie Moreau', 
      dept: 'Technique', 
      violations: 4, 
      risk: 'low', 
      score: 85,
      avatar_url: 'https://images.unsplash.com/photo-1494790108041-6d2a3b2b2c7c?w=150&h=150&fit=crop&crop=face'
    },
    { 
      name: 'Jean Petit', 
      dept: 'Ventes', 
      violations: 3, 
      risk: 'low', 
      score: 88,
      avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
    }
  ]
};

// Premium color schemes with gradients
const PREMIUM_COLORS = {
  primary: ['#6366f1', '#8b5cf6'],
  secondary: ['#06d6a0', '#1dd1a1'],
  accent: ['#f72585', '#ff006e'],
  warning: ['#ffbe0b', '#fb8500'],
  success: ['#10b981', '#06d6a0'],
  danger: ['#ef4444', '#f87171']
};

// Enhanced KPI Card Component
const PremiumKPICard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  icon: React.ReactNode;
  gradient: string[];
  delay?: number;
}> = ({ title, value, subtitle, trend, icon, gradient, delay = 0 }) => (
  <div 
    className="jd-group jd-relative jd-overflow-hidden jd-animate-in jd-slide-in-from-bottom-4 jd-duration-500"
    style={{ animationDelay: `${delay}ms` }}
  >
    <Card className="jd-h-full jd-border-0 jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300 jd-backdrop-blur-sm jd-bg-white/90 dark:jd-bg-gray-900/90">
      <div 
        className="jd-absolute jd-inset-0 jd-opacity-10 jd-bg-gradient-to-br"
        style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
      />
      <CardHeader className="jd-relative jd-flex jd-flex-row jd-items-center jd-justify-between jd-space-y-0 jd-pb-2">
        <CardTitle className="jd-text-sm jd-font-medium jd-text-muted-foreground">
          {title}
        </CardTitle>
        <div 
          className="jd-p-3 jd-rounded-xl jd-bg-gradient-to-br jd-shadow-lg"
          style={{ backgroundImage: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }}
        >
          <div className="jd-text-white">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="jd-relative">
        <div className="jd-text-2xl jd-font-bold jd-text-foreground">{value}</div>
        {subtitle && (
          <p className="jd-text-xs jd-text-muted-foreground jd-mt-1">{subtitle}</p>
        )}
        {trend && (
          <div className="jd-flex jd-items-center jd-gap-1 jd-mt-2">
            {trend.startsWith('+') ? (
              <ArrowUpRight className="jd-h-4 jd-w-4 jd-text-green-500" />
            ) : (
              <ArrowDownRight className="jd-h-4 jd-w-4 jd-text-red-500" />
            )}
            <span className={`jd-text-xs jd-font-medium ${
              trend.startsWith('+') ? 'jd-text-green-600' : 'jd-text-red-600'
            }`}>
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);

// Enhanced Chart Card Component
const PremiumChartCard: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  height?: string;
  delay?: number;
}> = ({ title, subtitle, children, height = "h-80", delay = 0 }) => (
  <div 
    className="jd-animate-in jd-slide-in-from-bottom-4 jd-duration-500"
    style={{ animationDelay: `${delay}ms` }}
  >
    <Card className="jd-border-0 jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300 jd-backdrop-blur-sm jd-bg-white/90 dark:jd-bg-gray-900/90">
      <CardHeader>
        <CardTitle className="jd-text-lg jd-font-semibold jd-flex jd-items-center jd-gap-2">
          <Sparkles className="jd-h-5 jd-w-5 jd-text-blue-500" />
          {title}
        </CardTitle>
        {subtitle && (
          <CardDescription className="jd-text-sm">{subtitle}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="jd-p-6">
        <div className={`jd-${height} jd-w-full`}>
          <style jsx>{`
            .recharts-text {
              font-family: 'Roboto', sans-serif !important;
            }
            .recharts-legend-item-text {
              font-family: 'Roboto', sans-serif !important;
            }
            .recharts-cartesian-axis-tick-value {
              font-family: 'Roboto', sans-serif !important;
            }
            .recharts-label {
              font-family: 'Roboto', sans-serif !important;
            }
          `}</style>
          {children}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Enhanced Progress Ring Component
const ProgressRing: React.FC<{
  progress: number;
  size: number;
  strokeWidth: number;
  gradient: string[];
  children?: React.ReactNode;
}> = ({ progress, size, strokeWidth, gradient, children }) => {
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = `${(progress / 100) * circumference} ${circumference}`;

  return (
    <div className="jd-relative jd-flex jd-items-center jd-justify-center">
      <svg
        width={size}
        height={size}
        className="jd-transform jd--rotate-90 jd-transition-all jd-duration-1000"
      >
        <defs>
          <linearGradient id={`gradient-${progress}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradient[0]} />
            <stop offset="100%" stopColor={gradient[1]} />
          </linearGradient>
        </defs>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={`url(#gradient-${progress})`}
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {children && (
        <div className="jd-absolute jd-inset-0 jd-flex jd-items-center jd-justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

const EnterpriseAnalyticsDashboard: React.FC = () => {
  const [viewType, setViewType] = useState<ViewType>('company');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  // Memoized data for charts to prevent unnecessary re-renders
  const currentData = useMemo(() => {
    if (viewType === 'employee' && selectedEmployee) {
      return mockData.departments
        .flatMap(d => d.teams)
        .flatMap(t => t.members)
        .find(e => e.id === selectedEmployee);
    } else if (viewType === 'team' && selectedTeam) {
      return mockData.departments
        .flatMap(d => d.teams)
        .find(t => t.id === selectedTeam);
    } else if (viewType === 'department' && selectedDepartment) {
      return mockData.departments.find(d => d.id === selectedDepartment);
    }
    return mockData; // Company view
  }, [viewType, selectedDepartment, selectedTeam, selectedEmployee]);

  // Get current view title
  const getViewTitle = () => {
    switch (viewType) {
      case 'department':
        const dept = mockData.departments.find(d => d.id === selectedDepartment);
        return `Département ${dept?.name || ''}`;
      case 'team':
        const team = mockData.departments
          .flatMap(d => d.teams)
          .find(t => t.id === selectedTeam);
        return `Équipe ${team?.name || ''}`;
      case 'employee':
        const employee = mockData.departments
          .flatMap(d => d.teams)
          .flatMap(t => t.members)
          .find(e => e.id === selectedEmployee);
        return `${employee?.name || ''} - ${employee?.role || ''}`;
      default:
        return 'Intelligence Artificielle d\'Entreprise';
    }
  };

  // Get context actions
  const getContextActions = () => {
    const actions = [];
    
    if (viewType === 'employee') {
      const employee = mockData.departments
        .flatMap(d => d.teams)
        .flatMap(t => t.members)
        .find(e => e.id === selectedEmployee);
      
      if (employee && employee.issues.length > 0) {
        actions.push({
          id: 'send-reminder',
          label: 'Envoyer rappel charte IA',
          icon: <Mail className="h-4 w-4" />,
          variant: 'destructive' as const
        });
      }
      
      actions.push({
        id: 'schedule-training',
        label: 'Programmer formation',
        icon: <BookOpen className="h-4 w-4" />,
        variant: 'default' as const
      });
    }
    
    if (viewType === 'department' || viewType === 'team') {
      actions.push({
        id: 'bulk-reminder',
        label: 'Rappel groupé charte IA',
        icon: <MessageSquare className="h-4 w-4" />,
        variant: 'default' as const
      });
      
      actions.push({
        id: 'audit-report',
        label: 'Générer rapport audit',
        icon: <FileText className="h-4 w-4" />,
        variant: 'default' as const
      });
    }
    
    return actions;
  };

  return (
    <div className="jd-w-full jd-space-y-8 jd-p-6 jd-bg-gradient-to-br jd-from-slate-50 jd-to-blue-50 dark:jd-from-gray-900 dark:jd-to-blue-900 jd-min-h-screen">
      {/* Premium Modern Header with Advanced Glassmorphism */}
      <div className="jd-relative jd-overflow-hidden">
        {/* Background with Modern Gradient & Geometric Shapes */}
        <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-from-slate-50 jd-via-blue-50/30 jd-to-indigo-100/40 dark:jd-from-gray-900 dark:jd-via-blue-900/20 dark:jd-to-indigo-900/30" />
        
        {/* Animated Geometric Elements */}
        <div className="jd-absolute jd-top-0 jd-right-0 jd-w-96 jd-h-96 jd-opacity-5">
          <div className="jd-absolute jd-top-8 jd-right-8 jd-w-32 jd-h-32 jd-bg-blue-500 jd-rounded-full jd-animate-pulse" />
          <div className="jd-absolute jd-top-24 jd-right-32 jd-w-16 jd-h-16 jd-bg-purple-500 jd-rounded-lg jd-rotate-45 jd-animate-bounce" style={{animationDuration: '3s'}} />
          <div className="jd-absolute jd-top-16 jd-right-56 jd-w-24 jd-h-24 jd-bg-gradient-to-r jd-from-blue-500 jd-to-purple-500 jd-rounded-tr-full jd-animate-spin" style={{animationDuration: '8s'}} />
        </div>

        {/* Main Header Container with Advanced Glassmorphism */}
        <div className="jd-relative jd-backdrop-blur-xl jd-bg-white/80 dark:jd-bg-gray-900/80 jd-border jd-border-white/20 dark:jd-border-gray-700/30 jd-rounded-3xl jd-shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] jd-m-4">
          <div className="jd-p-8 lg:jd-p-10">
            
            {/* Top Row - Title & Actions */}
            <div className="jd-flex jd-flex-col lg:jd-flex-row jd-justify-between jd-items-start lg:jd-items-center jd-gap-6 jd-mb-8">
              
              {/* Left Side - Branding & Title */}
              <div className="jd-flex jd-items-center jd-gap-6">
                {/* Animated Logo/Icon */}
                <div className="jd-relative">
                  <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-br jd-from-blue-500 jd-to-purple-600 jd-rounded-2xl jd-blur-md jd-opacity-70 jd-animate-pulse" />
                  <div className="jd-relative jd-p-4 jd-bg-gradient-to-br jd-from-blue-500 jd-to-purple-600 jd-rounded-2xl jd-shadow-lg jd-transform jd-transition-transform jd-duration-300 hover:jd-scale-105">
                    <BrainCircuit className="jd-h-10 jd-w-10 jd-text-white" />
                  </div>
                </div>

                {/* Title & Description */}
                <div className="jd-space-y-2">
                  <h1 className="jd-text-3xl lg:jd-text-4xl jd-font-bold jd-bg-gradient-to-r jd-from-gray-900 jd-via-blue-800 jd-to-purple-800 dark:jd-from-white dark:jd-via-blue-200 dark:jd-to-purple-200 jd-bg-clip-text jd-text-transparent jd-animate-in jd-slide-in-from-left jd-duration-700">
                    {getViewTitle()}
                  </h1>
                  <p className="jd-text-gray-600 dark:jd-text-gray-300 jd-text-lg jd-font-medium jd-flex jd-items-center jd-gap-2">
                    <Sparkles className="jd-h-5 jd-w-5 jd-text-blue-500" />
                    Dashboard Analytics IA • Données temps réel
                  </p>
                </div>
              </div>

              {/* Right Side - Action Buttons */}
              <div className="jd-flex jd-flex-wrap jd-gap-3">
                {getContextActions().map((action, index) => (
                  <Button
                    key={action.id}
                    variant={action.variant}
                    size="default"
                    onClick={() => {
                      setSelectedAction(action.id);
                      setActionDialogOpen(true);
                    }}
                    className="jd-gap-2 jd-bg-white/70 dark:jd-bg-gray-800/70 jd-backdrop-blur-sm jd-border jd-border-white/20 dark:jd-border-gray-700/30 jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300 hover:jd-scale-105 jd-animate-in jd-slide-in-from-right jd-duration-500"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Navigation Breadcrumb */}
            <div className="jd-flex jd-items-center jd-gap-2 jd-text-sm jd-text-gray-500 dark:jd-text-gray-400 jd-mb-6">
              <Building2 className="jd-h-4 jd-w-4" />
              <span>Analytics</span>
              <span className="jd-text-gray-300">•</span>
              <span>IA Entreprise</span>
              {viewType !== 'company' && (
                <>
                  <span className="jd-text-gray-300">•</span>
                  <span className="jd-text-blue-600 dark:jd-text-blue-400 jd-font-medium">{getViewTitle()}</span>
                </>
              )}
            </div>

            {/* Status Indicators */}
            <div className="jd-flex jd-flex-wrap jd-items-center jd-gap-6 jd-mb-8">
              <div className="jd-flex jd-items-center jd-gap-3 jd-px-4 jd-py-2 jd-bg-green-50 dark:jd-bg-green-900/20 jd-border jd-border-green-200 dark:jd-border-green-700/30 jd-rounded-full">
                <div className="jd-relative">
                  <div className="jd-w-3 jd-h-3 jd-bg-green-500 jd-rounded-full jd-animate-pulse" />
                  <div className="jd-absolute jd-inset-0 jd-w-3 jd-h-3 jd-bg-green-500 jd-rounded-full jd-animate-ping" />
                </div>
                <span className="jd-text-green-700 dark:jd-text-green-300 jd-font-medium jd-text-sm">
                  Système opérationnel
                </span>
              </div>

              <div className="jd-flex jd-items-center jd-gap-3 jd-px-4 jd-py-2 jd-bg-blue-50 dark:jd-bg-blue-900/20 jd-border jd-border-blue-200 dark:jd-border-blue-700/30 jd-rounded-full">
                <Clock className="jd-h-4 jd-w-4 jd-text-blue-600" />
                <span className="jd-text-blue-700 dark:jd-text-blue-300 jd-font-medium jd-text-sm">
                  Synchronisé {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className="jd-flex jd-items-center jd-gap-3 jd-px-4 jd-py-2 jd-bg-purple-50 dark:jd-bg-purple-900/20 jd-border jd-border-purple-200 dark:jd-border-purple-700/30 jd-rounded-full">
                <Activity className="jd-h-4 jd-w-4 jd-text-purple-600" />
                <span className="jd-text-purple-700 dark:jd-text-purple-300 jd-font-medium jd-text-sm">
                  {mockData.usageStats.active_users} utilisateurs actifs
                </span>
              </div>
            </div>

            {/* Enhanced Navigation Selectors */}
            <div className="jd-space-y-4">
              <h3 className="jd-text-sm jd-font-semibold jd-text-gray-900 dark:jd-text-white jd-uppercase jd-tracking-wider jd-flex jd-items-center jd-gap-2">
                <Target className="jd-h-4 jd-w-4" />
                Niveau d'analyse
              </h3>
              
              <div className="jd-flex jd-flex-wrap jd-gap-4">
                <div className="jd-relative jd-group">
                  <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-blue-500/10 jd-to-purple-500/10 jd-rounded-xl jd-blur-sm jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300" />
                  <Select value={viewType} onValueChange={(value: ViewType) => setViewType(value)}>
                    <SelectTrigger className="jd-w-64 jd-h-12 jd-bg-white/70 dark:jd-bg-gray-800/70 jd-backdrop-blur-sm jd-border jd-border-white/30 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300 jd-group-hover:jd-border-blue-300 dark:jd-group-hover:jd-border-blue-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="jd-backdrop-blur-xl jd-bg-white/90 dark:jd-bg-gray-900/90 jd-border jd-border-white/20 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-2xl">
                      <SelectItem value="company" className="jd-rounded-lg">
                        <div className="jd-flex jd-items-center jd-gap-3">
                          <div className="jd-p-2 jd-bg-blue-100 dark:jd-bg-blue-900/30 jd-rounded-lg">
                            <Building2 className="h-4 w-4 jd-text-blue-600" />
                          </div>
                          <div>
                            <div className="jd-font-medium">Vue Entreprise</div>
                            <div className="jd-text-xs jd-text-gray-500">Analyse globale</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="department" className="jd-rounded-lg">
                        <div className="jd-flex jd-items-center jd-gap-3">
                          <div className="jd-p-2 jd-bg-green-100 dark:jd-bg-green-900/30 jd-rounded-lg">
                            <Users className="h-4 w-4 jd-text-green-600" />
                          </div>
                          <div>
                            <div className="jd-font-medium">Vue Département</div>
                            <div className="jd-text-xs jd-text-gray-500">Par division</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="team" className="jd-rounded-lg">
                        <div className="jd-flex jd-items-center jd-gap-3">
                          <div className="jd-p-2 jd-bg-purple-100 dark:jd-bg-purple-900/30 jd-rounded-lg">
                            <Target className="h-4 w-4 jd-text-purple-600" />
                          </div>
                          <div>
                            <div className="jd-font-medium">Vue Équipe</div>
                            <div className="jd-text-xs jd-text-gray-500">Par équipe</div>
                          </div>
                        </div>
                      </SelectItem>
                      <SelectItem value="employee" className="jd-rounded-lg">
                        <div className="jd-flex jd-items-center jd-gap-3">
                          <div className="jd-p-2 jd-bg-orange-100 dark:jd-bg-orange-900/30 jd-rounded-lg">
                            <User className="h-4 w-4 jd-text-orange-600" />
                          </div>
                          <div>
                            <div className="jd-font-medium">Vue Employé</div>
                            <div className="jd-text-xs jd-text-gray-500">Individuel</div>
                          </div>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Conditional selectors with enhanced styling */}
                {viewType !== 'company' && (
                  <div className="jd-relative jd-group">
                    <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-green-500/10 jd-to-blue-500/10 jd-rounded-xl jd-blur-sm jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300" />
                    <Select 
                      value={selectedDepartment} 
                      onValueChange={(value) => {
                        setSelectedDepartment(value);
                        setSelectedTeam('');
                        setSelectedEmployee('');
                      }}
                    >
                      <SelectTrigger className="jd-w-64 jd-h-12 jd-bg-white/70 dark:jd-bg-gray-800/70 jd-backdrop-blur-sm jd-border jd-border-white/30 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300">
                        <SelectValue placeholder="Sélectionner département" />
                      </SelectTrigger>
                      <SelectContent className="jd-backdrop-blur-xl jd-bg-white/90 dark:jd-bg-gray-900/90 jd-border jd-border-white/20 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-2xl">
                        {mockData.departments.map(dept => (
                          <SelectItem key={dept.id} value={dept.id} className="jd-rounded-lg">
                            <div className="jd-flex jd-items-center jd-gap-3">
                              <div className="jd-w-8 jd-h-8 jd-bg-gradient-to-br jd-from-blue-500 jd-to-purple-500 jd-rounded-lg jd-flex jd-items-center jd-justify-center">
                                <span className="jd-text-white jd-text-xs jd-font-bold">
                                  {dept.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="jd-font-medium">{dept.name}</div>
                                <div className="jd-text-xs jd-text-gray-500">{dept.employees} employés</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {(viewType === 'team' || viewType === 'employee') && selectedDepartment && (
                  <div className="jd-relative jd-group">
                    <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-purple-500/10 jd-to-pink-500/10 jd-rounded-xl jd-blur-sm jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300" />
                    <Select 
                      value={selectedTeam} 
                      onValueChange={(value) => {
                        setSelectedTeam(value);
                        setSelectedEmployee('');
                      }}
                    >
                      <SelectTrigger className="jd-w-64 jd-h-12 jd-bg-white/70 dark:jd-bg-gray-800/70 jd-backdrop-blur-sm jd-border jd-border-white/30 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300">
                        <SelectValue placeholder="Sélectionner équipe" />
                      </SelectTrigger>
                      <SelectContent className="jd-backdrop-blur-xl jd-bg-white/90 dark:jd-bg-gray-900/90 jd-border jd-border-white/20 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-2xl">
                        {mockData.departments.find(d => d.id === selectedDepartment)?.teams.map(team => (
                          <SelectItem key={team.id} value={team.id} className="jd-rounded-lg">
                            <div className="jd-flex jd-items-center jd-gap-3">
                              <div className="jd-w-8 jd-h-8 jd-bg-gradient-to-br jd-from-purple-500 jd-to-pink-500 jd-rounded-lg jd-flex jd-items-center jd-justify-center">
                                <span className="jd-text-white jd-text-xs jd-font-bold">
                                  {team.name.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="jd-font-medium">{team.name}</div>
                                <div className="jd-text-xs jd-text-gray-500">{team.employees} membres</div>
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {viewType === 'employee' && selectedTeam && (
                  <div className="jd-relative jd-group">
                    <div className="jd-absolute jd-inset-0 jd-bg-gradient-to-r jd-from-pink-500/10 jd-to-red-500/10 jd-rounded-xl jd-blur-sm jd-opacity-0 jd-group-hover:jd-opacity-100 jd-transition-opacity jd-duration-300" />
                    <Select 
                      value={selectedEmployee} 
                      onValueChange={setSelectedEmployee}
                    >
                      <SelectTrigger className="jd-w-64 jd-h-12 jd-bg-white/70 dark:jd-bg-gray-800/70 jd-backdrop-blur-sm jd-border jd-border-white/30 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-lg hover:jd-shadow-xl jd-transition-all jd-duration-300">
                        <SelectValue placeholder="Sélectionner employé" />
                      </SelectTrigger>
                      <SelectContent className="jd-backdrop-blur-xl jd-bg-white/90 dark:jd-bg-gray-900/90 jd-border jd-border-white/20 dark:jd-border-gray-700/30 jd-rounded-xl jd-shadow-2xl">
                        {mockData.departments
                          .flatMap(d => d.teams)
                          .find(t => t.id === selectedTeam)?.members.map(emp => (
                            <SelectItem key={emp.id} value={emp.id} className="jd-rounded-lg">
                              <div className="jd-flex jd-items-center jd-gap-3">
                                <img 
                                  src={emp.avatar_url || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjc2MTQgMjAgMjUgMTcuNzYxNCAyNSAxNUMyNSAxMi4yMzg2IDIyLjc2MTQgMTAgMjAgMTBDMTcuMjM4NiAxMCAxNSAxMi4yMzg2IDE1IDE1QzE1IDE3Ljc2MTQgMTcuMjM4NiAyMCAyMCAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwIDM1QzEwIDI5LjQ3NzEgMTQuNDc3MSAyNSAyMCAyNUMyNS41MjI5IDI1IDMwIDI5LjQ3NzEgMzAgMzVIMTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg=='} 
                                  alt={emp.name} 
                                  className="jd-w-8 jd-h-8 jd-rounded-full jd-object-cover"
                                  onError={(e) => {
                                    e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjc2MTQgMjAgMjUgMTcuNzYxNCAyNSAxNUMyNSAxMi4yMzg2IDIyLjc2MTQgMTAgMjAgMTBDMTcuMjM4NiAxMCAxNSAxMi4yMzg2IDE1IDE1QzE1IDE3Ljc2MTQgMTcuMjM4NiAyMCAyMCAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwIDM1QzEwIDI5LjQ3NzEgMTQuNDc3MSAyNSAyMCAyNUMyNS41MjI5IDI1IDMwIDI5LjQ3NzEgMzAgMzVIMTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg==';
                                  }}
                                />
                                <div>
                                  <div className="jd-font-medium">{emp.name}</div>
                                  <div className="jd-text-xs jd-text-gray-500">{emp.role}</div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Tabs Navigation with Glassmorphism and Active Indicator */}
      <Tabs defaultValue="overview" className="jd-w-full">
        <div className="jd-sticky jd-top-0 jd-z-10 jd-mb-6 jd-backdrop-blur-lg jd-bg-white/80 dark:jd-bg-gray-900/80 jd-rounded-xl jd-shadow-md jd-p-2">
          <TabsList className="jd-grid jd-w-full jd-grid-cols-3 lg:jd-grid-cols-6 jd-gap-2 jd-bg-transparent">
            {[
              { value: 'overview', label: 'Vue d\'ensemble', icon: <PieChartIcon className="jd-h-5 jd-w-5" /> },
              { value: 'usage', label: 'Usage IA', icon: <TrendingUp className="jd-h-5 jd-w-5" /> },
              { value: 'categories', label: 'Catégories', icon: <Layers className="jd-h-5 jd-w-5" /> },
              { value: 'security', label: 'Sécurité', icon: <Shield className="jd-h-5 jd-w-5" /> },
              { value: 'environment', label: 'Environnement', icon: <Leaf className="jd-h-5 jd-w-5" /> },
              { value: 'reports', label: 'Rapports', icon: <FileText className="jd-h-5 jd-w-5" /> }
            ].map((tab, index) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value} 
                className="jd-flex-1 jd-flex jd-items-center jd-justify-center jd-gap-2 jd-py-3 jd-px-4 jd-rounded-lg jd-text-sm jd-font-medium jd-transition-all jd-duration-300 jd-data-[state=active]:jd-bg-gradient-to-r jd-data-[state=active]:jd-from-blue-500 jd-data-[state=active]:jd-to-purple-600 jd-data-[state=active]:jd-text-white jd-data-[state=active]:jd-shadow-lg hover:jd-bg-gray-100 dark:hover:jd-bg-gray-800 jd-animate-in jd-fade-in jd-duration-300"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="jd-space-y-8">
          {/* KPIs */}
          <div className="jd-grid jd-gap-6 md:jd-grid-cols-2 lg:jd-grid-cols-4">
            <PremiumKPICard 
              title="Utilisateurs Actifs"
              value={mockData.usageStats.active_users}
              subtitle={`${mockData.usageStats.total_users} au total`}
              trend={`+${mockData.usageStats.growth_rate}%`}
              icon={<Users className="jd-h-6 jd-w-6" />}
              gradient={PREMIUM_COLORS.primary}
              delay={0}
            />
            <PremiumKPICard 
              title="Interactions IA"
              value={mockData.usageStats.total_interactions.toLocaleString()}
              subtitle="Ce mois-ci"
              trend="+18.7%"
              icon={<MessageSquare className="jd-h-6 jd-w-6" />}
              gradient={PREMIUM_COLORS.secondary}
              delay={100}
            />
            <PremiumKPICard 
              title="Score de Maturité IA"
              value="8.2 / 10"
              subtitle="Moyenne entreprise"
              trend="+0.5 pts"
              icon={<Star className="jd-h-6 jd-w-6" />}
              gradient={PREMIUM_COLORS.accent}
              delay={200}
            />
            <PremiumKPICard 
              title="Score de Sécurité"
              value={`${mockData.securityMetrics.security_score}%`}
              subtitle="Conformité & Risques"
              trend="+3%"
              icon={<Shield className="jd-h-6 jd-w-6" />}
              gradient={PREMIUM_COLORS.warning}
              delay={300}
            />
          </div>

          {/* Charts */}
          <div className="jd-grid jd-gap-6 lg:jd-grid-cols-2">
            <PremiumChartCard
              title="Distribution des Niveaux de Maturité"
              subtitle="Répartition des employés par compétence IA"
              delay={400}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.maturityDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" className="jd-text-xs" />
                  <YAxis dataKey="name" type="category" width={100} className="jd-text-xs" />
                  <Tooltip />
                  <Bar dataKey="count" name="Nombre d'employés" radius={[0, 8, 8, 0]}>
                    {mockData.maturityDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </PremiumChartCard>

            <PremiumChartCard
              title="Comparaison Interdépartementale"
              subtitle="Performance IA par département (score global)"
              delay={500}
            >
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockData.departmentComparison}>
                  <PolarGrid opacity={0.3} />
                  <PolarAngleAxis dataKey="name" className="jd-text-xs" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} className="jd-text-xs" />
                  <Radar name="Usage" dataKey="usage" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                  <Radar name="Sécurité" dataKey="security" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </PremiumChartCard>
          </div>

          {/* Sector Comparison */}
          <div className="jd-grid jd-gap-6 lg:jd-grid-cols-2">
            <PremiumChartCard
              title="Positionnement Sectoriel"
              subtitle="Performance IA comparée au secteur d'activité"
              delay={500}
            >
              <div className="jd-space-y-6 jd-p-4">
                <div className="jd-text-center jd-mb-6">
                  <ProgressRing
                    progress={mockData.sectorComparison.company_score}
                    size={160}
                    strokeWidth={14}
                    gradient={PREMIUM_COLORS.primary}
                  >
                    <div className="jd-text-center">
                      <div className="jd-text-3xl jd-font-bold jd-text-blue-600">
                        {mockData.sectorComparison.company_score}
                      </div>
                      <div className="jd-text-sm jd-text-gray-500">Score IA Entreprise</div>
                    </div>
                  </ProgressRing>
                </div>
                
                <div className="jd-space-y-3">
                  {[
                    { label: 'Moyenne secteur', score: 78, color: '#9ca3af' },
                    { label: 'Top quartile', score: 92, color: '#10b981' }
                  ].map((item, index) => (
                    <div key={index} className="jd-flex jd-justify-between jd-items-center">
                      <span className="jd-font-medium">{item.label}</span>
                      <div className="jd-flex jd-items-center jd-gap-3">
                        <div className="jd-w-32 jd-bg-gray-200 jd-rounded-full jd-h-3 jd-overflow-hidden">
                          <div 
                            className="jd-h-full jd-rounded-full jd-transition-all jd-duration-1000 jd-ease-out"
                            style={{ 
                              width: `${item.score}%`,
                              backgroundColor: item.color,
                              animationDelay: `${index * 200}ms`
                            }}
                          />
                        </div>
                        <span className="jd-font-bold jd-text-lg">{item.score}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </PremiumChartCard>

            <PremiumChartCard
              title="Leaders du Marché"
              subtitle="Comparaison avec les entreprises leaders"
              delay={600}
            >
              <div className="jd-space-y-4">
                {mockData.sectorComparison.market_leaders.map((leader, index) => (
                  <div 
                    key={index} 
                    className="jd-flex jd-items-center jd-justify-between jd-p-4 jd-bg-gradient-to-r jd-from-gray-50 jd-to-blue-50 jd-rounded-xl jd-border jd-hover:jd-shadow-md jd-transition-all"
                  >
                    <div className="jd-flex jd-items-center jd-gap-4">
                      <div className="jd-text-2xl">{leader.logo}</div>
                      <div>
                        <div className="jd-font-semibold">{leader.name}</div>
                        <div className="jd-text-sm jd-text-gray-500">Leader technologique</div>
                      </div>
                    </div>
                    <div className="jd-text-right">
                      <div className="jd-text-2xl jd-font-bold jd-text-blue-600">{leader.score}</div>
                      <div className="jd-text-xs jd-text-gray-500">Score IA</div>
                    </div>
                  </div>
                ))}
              </div>
            </PremiumChartCard>
          </div>

          {/* Productivity Insights */}
          <PremiumChartCard
            title="Impact Productivité"
            subtitle="Gains mesurés grâce à l'IA"
            delay={700}
          >
            <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 lg:jd-grid-cols-4 jd-gap-6">
              {mockData.productivityInsights.map((insight, index) => (
                <div 
                  key={index}
                  className="jd-text-center jd-p-6 jd-bg-gradient-to-br jd-from-white jd-to-gray-50 jd-rounded-xl jd-border jd-shadow-sm hover:jd-shadow-md jd-transition-all"
                >
                  <div className="jd-flex jd-justify-center jd-mb-4">
                    <div className="jd-p-3 jd-bg-blue-100 jd-rounded-xl jd-text-blue-600">
                      {insight.icon}
                    </div>
                  </div>
                  <div className="jd-text-lg jd-font-semibold jd-mb-2">{insight.category}</div>
                  <div className="jd-text-3xl jd-font-bold jd-text-blue-600 jd-mb-1">{insight.hours_saved}h</div>
                  <div className="jd-text-sm jd-text-gray-500 jd-mb-3">économisées</div>
                  <div className="jd-text-xs jd-text-gray-600">{insight.description}</div>
                  <div className="jd-mt-3">
                    <div className="jd-bg-gray-200 jd-rounded-full jd-h-2 jd-overflow-hidden">
                      <div 
                        className="jd-bg-gradient-to-r jd-from-blue-500 jd-to-purple-500 jd-h-full jd-rounded-full jd-transition-all jd-duration-1000"
                        style={{ width: `${insight.impact}%` }}
                      />
                    </div>
                    <div className="jd-text-xs jd-text-gray-500 jd-mt-1">{insight.impact}% d'impact</div>
                  </div>
                </div>
              ))}
            </div>
          </PremiumChartCard>
        </TabsContent>

        {/* Enhanced Usage Tab */}
        <TabsContent value="usage" className="jd-space-y-8">
          <div className="jd-grid jd-grid-cols-1 lg:jd-grid-cols-2 jd-gap-6">
            <PremiumChartCard
              title="Répartition des Utilisateurs"
              subtitle="Classification par niveau d'engagement"
              delay={0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Non-utilisateurs', value: 20, color: '#ef4444' },
                      { name: 'Occasionnels', value: 27, color: '#f59e0b' },
                      { name: 'Réguliers', value: 33, color: '#3b82f6' },
                      { name: 'Intensifs', value: 20, color: '#10b981' }
                    ]}
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {[0, 1, 2, 3].map((index) => (
                      <Cell key={`cell-${index}`} fill={['#ef4444', '#f59e0b', '#3b82f6', '#10b981'][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </PremiumChartCard>

            <PremiumChartCard
              title="Évolution de l'Adoption"
              subtitle="Croissance de l'utilisation IA (30 derniers jours)"
              delay={100}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={Array.from({ length: 30 }, (_, i) => ({
                    day: i + 1,
                    sessions: Math.floor(120 + Math.random() * 80 + Math.sin(i / 5) * 30),
                    users: Math.floor(70 + Math.random() * 20 + Math.sin(i / 7) * 15)
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="day" className="jd-text-xs" />
                  <YAxis className="jd-text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="sessions" stackId="1" stroke="#6366f1" fill="url(#sessionsGradient)" />
                  <Area type="monotone" dataKey="users" stackId="2" stroke="#06d6a0" fill="url(#usersGradient)" />
                  <defs>
                    <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="usersGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06d6a0" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#06d6a0" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </PremiumChartCard>
          </div>

          {/* Enhanced Usage Metrics */}
          <PremiumChartCard
            title="Métriques d'Usage Avancées"
            subtitle="Indicateurs de performance détaillés"
            delay={200}
          >
            <div className="jd-grid jd-grid-cols-2 lg:jd-grid-cols-5 jd-gap-6">
              {[
                { 
                  label: 'Interactions Totales',
                  value: mockData.usageStats.total_interactions.toLocaleString(),
                  change: '+28%',
                  icon: <MessageSquare className="jd-h-6 jd-w-6" />,
                  gradient: PREMIUM_COLORS.primary
                },
                {
                  label: 'Sessions/Jour',
                  value: mockData.usageStats.avg_sessions_per_day,
                  change: '+15%',
                  icon: <Activity className="jd-h-6 jd-w-6" />,
                  gradient: PREMIUM_COLORS.secondary
                },
                {
                  label: 'Taux de Croissance',
                  value: `${mockData.usageStats.growth_rate}%`,
                  change: '+5.2%',
                  icon: <TrendingUp className="jd-h-6 jd-w-6" />,
                  gradient: PREMIUM_COLORS.success
                },
                {
                  label: 'Sessions/Utilisateur',
                  value: '4.7',
                  change: '+12%',
                  icon: <User className="jd-h-6 jd-w-6" />,
                  gradient: PREMIUM_COLORS.warning
                },
                {
                  label: 'Temps Moyen/Session',
                  value: '8.4min',
                  change: '+3%',
                  icon: <Clock className="jd-h-6 jd-w-6" />,
                  gradient: PREMIUM_COLORS.accent
                }
              ].map((metric, index) => (
                <div 
                  key={index}
                  className="jd-text-center jd-p-6 jd-bg-white jd-rounded-xl jd-shadow-sm jd-border hover:jd-shadow-md jd-transition-all"
                >
                  <div 
                    className="jd-inline-flex jd-p-3 jd-rounded-full jd-bg-gradient-to-br jd-mb-4"
                    style={{ backgroundImage: `linear-gradient(135deg, ${metric.gradient[0]}, ${metric.gradient[1]})` }}
                  >
                    <div className="jd-text-white">{metric.icon}</div>
                  </div>
                  <div className="jd-text-2xl jd-font-bold jd-text-gray-900">{metric.value}</div>
                  <div className="jd-text-sm jd-text-gray-500 jd-mt-1">{metric.label}</div>
                  <div className="jd-flex jd-items-center jd-justify-center jd-gap-1 jd-mt-2">
                    <ArrowUpRight className="jd-h-4 jd-w-4 jd-text-green-500" />
                    <span className="jd-text-sm jd-font-medium jd-text-green-600">{metric.change}</span>
                  </div>
                </div>
              ))}
            </div>
          </PremiumChartCard>
        </TabsContent>

        {/* Enhanced Categories Tab */}
        <TabsContent value="categories" className="jd-space-y-8">
          <div className="jd-grid jd-grid-cols-1 lg:jd-grid-cols-2 jd-gap-6">
            <PremiumChartCard
              title="Usage par Catégorie"
              subtitle="Répartition des interactions par domaine"
              delay={0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockData.usageByCategory} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis type="number" className="jd-text-xs" />
                  <YAxis dataKey="name" type="category" width={120} className="jd-text-xs" />
                  <Tooltip />
                  <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                    {mockData.usageByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </PremiumChartCard>

            <PremiumChartCard
              title="Tendances par Catégorie"
              subtitle="Évolution des usages (30 derniers jours)"
              delay={100}
            >
              <div className="jd-space-y-4">
                {mockData.usageByCategory.slice(0, 6).map((category, index) => (
                  <div 
                    key={index}
                    className="jd-flex jd-items-center jd-justify-between jd-p-4 jd-bg-gray-50 jd-rounded-xl jd-hover:jd-bg-gray-100 jd-transition-colors"
                  >
                    <div className="jd-flex jd-items-center jd-gap-4">
                      <div 
                        className="jd-w-4 jd-h-4 jd-rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <div className="jd-font-medium">{category.name}</div>
                        <div className="jd-text-sm jd-text-gray-500">{category.value.toLocaleString()} interactions</div>
                      </div>
                    </div>
                    <div className="jd-text-right">
                      <div className="jd-flex jd-items-center jd-gap-1">
                        <ArrowUpRight className="jd-h-4 jd-w-4 jd-text-green-500" />
                        <span className="jd-font-bold jd-text-green-600">{category.trend}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PremiumChartCard>
          </div>

          {/* Enhanced Use Cases */}
          <PremiumChartCard
            title="Classification des Cas d'Usage"
            subtitle="Détection automatique des intentions et patterns"
            delay={200}
          >
            <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-3 jd-gap-6">
              {[
                {
                  category: 'Automatisation',
                  percentage: 35,
                  description: 'Automatisation de tâches répétitives et workflows',
                  icon: <Cpu className="jd-h-8 jd-w-8" />,
                  color: '#6366f1',
                  examples: ['Scripts automatisés', 'Processus RH', 'Génération de rapports']
                },
                {
                  category: 'Analyse & Insights',
                  percentage: 28,
                  description: 'Analyse de données et extraction d\'insights',
                  icon: <BarChart3 className="jd-h-8 jd-w-8" />,
                  color: '#06d6a0',
                  examples: ['Analytics avancées', 'Détection patterns', 'Prédictions']
                },
                {
                  category: 'Créativité & Innovation',
                  percentage: 24,
                  description: 'Support créatif et génération d\'idées',
                  icon: <Lightbulb className="jd-h-8 jd-w-8" />,
                  color: '#f72585',
                  examples: ['Brainstorming', 'Design thinking', 'Innovation produit']
                },
                {
                  category: 'Formation & Support',
                  percentage: 13,
                  description: 'Formation, apprentissage et assistance',
                  icon: <BookOpen className="jd-h-8 jd-w-8" />,
                  color: '#ffbe0b',
                  examples: ['Tutoriels personnalisés', 'FAQ intelligente', 'Coaching']
                }
              ].map((useCase, index) => (
                <div 
                  key={index}
                  className="jd-p-6 jd-bg-white jd-rounded-xl jd-border jd-shadow-sm hover:jd-shadow-md jd-transition-all"
                >
                  <div className="jd-flex jd-items-center jd-gap-4 jd-mb-4">
                    <div 
                      className="jd-p-3 jd-rounded-xl"
                      style={{ backgroundColor: `${useCase.color}20` }}
                    >
                      <div style={{ color: useCase.color }}>
                        {useCase.icon}
                      </div>
                    </div>
                    <div>
                      <div className="jd-font-semibold jd-text-lg">{useCase.category}</div>
                      <div className="jd-text-sm jd-text-gray-500">{useCase.percentage}% des usages</div>
                    </div>
                  </div>
                  <p className="jd-text-xs jd-text-gray-600 jd-mb-3 jd-h-10">{useCase.description}</p>
                  <div className="jd-space-y-1">
                    {useCase.examples.map((example, exIndex) => (
                      <div key={exIndex} className="jd-flex jd-items-center jd-gap-2 jd-text-xs jd-text-gray-500">
                        <CheckCircle className="jd-h-3 jd-w-3 jd-text-green-500" />
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </PremiumChartCard>
        </TabsContent>

        {/* Enhanced Security Tab */}
        <TabsContent value="security" className="jd-space-y-8">
          <div className="jd-grid jd-grid-cols-1 lg:jd-grid-cols-2 jd-gap-6">
            <PremiumChartCard
              title="Aperçu Sécurité"
              subtitle="Indicateurs clés de sécurité et conformité"
              delay={0}
            >
              <div className="jd-grid jd-grid-cols-1 sm:jd-grid-cols-2 jd-gap-4">
                {[
                  {
                    label: 'Détections sensibles',
                    value: mockData.securityMetrics.sensitive_data_detected,
                    total: mockData.securityMetrics.total_scans,
                    percentage: Math.round((mockData.securityMetrics.sensitive_data_detected / mockData.securityMetrics.total_scans) * 100),
                    color: '#ef4444',
                    icon: <AlertTriangle className="jd-h-5 jd-w-5" />
                  },
                  {
                    label: 'Requêtes bloquées',
                    value: mockData.securityMetrics.blocked_requests,
                    total: mockData.securityMetrics.total_scans,
                    percentage: Math.round((mockData.securityMetrics.blocked_requests / mockData.securityMetrics.total_scans) * 100),
                    color: '#f59e0b',
                    icon: <XCircle className="jd-h-5 jd-w-5" />
                  },
                  {
                    label: 'Violations charte IA',
                    value: mockData.securityMetrics.charter_violations,
                    total: mockData.securityMetrics.total_scans,
                    percentage: Math.round((mockData.securityMetrics.charter_violations / mockData.securityMetrics.total_scans) * 100),
                    color: '#f97316',
                    icon: <AlertTriangle className="jd-h-5 jd-w-5" />
                  },
                  {
                    label: 'Faux positifs',
                    value: mockData.securityMetrics.false_positives,
                    total: mockData.securityMetrics.total_scans,
                    percentage: Math.round((mockData.securityMetrics.false_positives / mockData.securityMetrics.total_scans) * 100),
                    color: '#10b981',
                    icon: <CheckCircle className="jd-h-5 jd-w-5" />
                  }
                ].map((metric, index) => (
                  <div 
                    key={index}
                    className="jd-flex jd-items-center jd-justify-between jd-p-4 jd-bg-white jd-rounded-xl jd-border jd-shadow-sm jd-w-full jd-min-w-0"
                  >
                    <div className="jd-flex jd-items-center jd-gap-3 jd-flex-1 jd-min-w-0">
                      <div 
                        className="jd-p-2 jd-rounded-lg jd-flex-shrink-0"
                        style={{ backgroundColor: `${metric.color}20` }}
                      >
                        <div style={{ color: metric.color }}>
                          {metric.icon}
                        </div>
                      </div>
                      <div className="jd-min-w-0 jd-flex-1">
                        <div className="jd-font-medium jd-text-sm jd-truncate">{metric.label}</div>
                        <div className="jd-text-xs jd-text-gray-500 jd-truncate">
                          {metric.value} sur {metric.total.toLocaleString()} scans
                        </div>
                      </div>
                    </div>
                    <div className="jd-text-right jd-flex-shrink-0 jd-ml-4">
                      <div className="jd-text-lg jd-font-bold" style={{ color: metric.color }}>
                        {metric.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </PremiumChartCard>

            <PremiumChartCard
              title="Évolution des Incidents"
              subtitle="Tendances sécuritaires sur 6 mois"
              delay={100}
            >
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={[
                    { month: 'Août', detections: 95, violations: 38, blocked: 15, score: 78 },
                    { month: 'Sept', detections: 112, violations: 42, blocked: 18, score: 81 },
                    { month: 'Oct', detections: 89, violations: 28, blocked: 23, score: 85 },
                    { month: 'Nov', detections: 76, violations: 31, blocked: 19, score: 86 },
                    { month: 'Déc', detections: 68, violations: 25, blocked: 21, score: 88 },
                    { month: 'Jan', detections: 59, violations: 18, blocked: 16, score: 91 }
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" className="jd-text-xs" />
                  <YAxis yAxisId="left" className="jd-text-xs" />
                  <YAxis yAxisId="right" orientation="right" className="jd-text-xs" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="detections" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="violations" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} />
                  <Legend />
                </ComposedChart>
              </ResponsiveContainer>
            </PremiumChartCard>
          </div>

          {/* Enhanced User Risk Assessment with Real Avatars */}
          <PremiumChartCard
            title="Évaluation des Risques Utilisateurs"
            subtitle="Identification proactive des employés nécessitant une attention"
            delay={200}
          >
            <div className="jd-space-y-3 jd-max-w-full jd-overflow-hidden">
              {mockData.userRiskData.map((user, index) => (
                <div 
                  key={index} 
                  className="jd-flex jd-items-center jd-justify-between jd-p-4 jd-bg-white jd-rounded-xl jd-border jd-shadow-sm hover:jd-shadow-md jd-transition-all jd-w-full jd-min-w-0"
                >
                  <div className="jd-flex jd-items-center jd-gap-4 jd-flex-1 jd-min-w-0">
                    <div className="jd-flex-shrink-0">
                      <img 
                        src={user.avatar_url} 
                        alt={user.name}
                        className="jd-w-12 jd-h-12 jd-rounded-full jd-object-cover jd-border-2 jd-border-gray-200"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGM0Y0RjYiLz4KPHBhdGggZD0iTTIwIDIwQzIyLjc2MTQgMjAgMjUgMTcuNzYxNCAyNSAxNUMyNSAxMi4yMzg2IDIyLjc2MTQgMTAgMjAgMTBDMTcuMjM4NiAxMCAxNSAxMi4yMzg2IDE1IDE1QzE1IDE3Ljc2MTQgMTcuMjM4NiAyMCAyMCAyMFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTEwIDM1QzEwIDI5LjQ3NzEgMTQuNDc3MSAyNSAyMCAyNUMyNS41MjI5IDI1IDMwIDI5LjQ3NzEgMzAgMzVIMTBaIiBmaWxsPSIjOUNBM0FGIi8+Cjwvc3ZnPg==';
                        }}
                      />
                    </div>
                    <div className="jd-min-w-0 jd-flex-1">
                      <div className="jd-font-medium jd-text-sm jd-truncate">{user.name}</div>
                      <div className="jd-text-xs jd-text-gray-500 jd-truncate">{user.dept}</div>
                    </div>
                  </div>
                  <div className="jd-flex jd-items-center jd-gap-4 jd-flex-shrink-0">
                    <div className="jd-text-center jd-hidden md:jd-block">
                      <div className="jd-text-lg jd-font-bold jd-text-gray-900">{user.score}/100</div>
                      <div className="jd-text-xs jd-text-gray-500">Score sécurité</div>
                    </div>
                    <Badge 
                      variant={user.risk === 'high' ? 'destructive' : user.risk === 'medium' ? 'default' : 'secondary'}
                      className="jd-px-3 jd-py-1 jd-whitespace-nowrap"
                    >
                      {user.violations} violations
                    </Badge>
                    <div className="jd-flex jd-gap-2">
                      <Button size="sm" variant="outline" className="jd-gap-2 jd-px-3">
                        <Mail className="jd-h-4 jd-w-4" />
                        <span className="jd-hidden lg:jd-inline">Rappel</span>
                      </Button>
                      <Button size="sm" variant="outline" className="jd-gap-2 jd-px-3">
                        <BookOpen className="jd-h-4 jd-w-4" />
                        <span className="jd-hidden lg:jd-inline">Formation</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </PremiumChartCard>
        </TabsContent>

        {/* Enhanced Environment Tab */}
        <TabsContent value="environment" className="jd-space-y-8">
          <div className="jd-grid jd-grid-cols-1 lg:jd-grid-cols-2 jd-gap-6">
            <PremiumChartCard
              title="Consommation Énergétique vs Secteur"
              subtitle="Performance environnementale mensuelle (kWh)"
              delay={0}
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockData.energyConsumption}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="month" className="jd-text-xs" />
                  <YAxis className="jd-text-xs" />
                  <Tooltip />
                  <Area type="monotone" dataKey="sector_avg" stackId="1" stroke="#ef4444" fill="url(#sectorGradient)" />
                  <Area type="monotone" dataKey="company" stackId="2" stroke="#10b981" fill="url(#companyGradient)" />
                  <defs>
                    <linearGradient id="sectorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="companyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </PremiumChartCard>

            <PremiumChartCard
              title="Efficience Énergétique"
              subtitle="Optimisation continue de la consommation"
              delay={100}
            >
              <div className="jd-space-y-6">
                <div className="jd-text-center">
                  <ProgressRing
                    progress={76}
                    size={140}
                    strokeWidth={12}
                    gradient={PREMIUM_COLORS.success}
                  >
                    <div className="jd-text-center">
                      <div className="jd-text-2xl jd-font-bold jd-text-green-600">76%</div>
                      <div className="jd-text-sm jd-text-gray-500">Efficience</div>
                    </div>
                  </ProgressRing>
                </div>
                
                <div className="jd-grid jd-grid-cols-2 jd-gap-4">
                  <div className="jd-text-center jd-p-4 jd-bg-green-50 jd-rounded-xl">
                    <div className="jd-text-2xl jd-font-bold jd-text-green-600">-24%</div>
                    <div className="jd-text-sm jd-text-gray-600">vs secteur</div>
                  </div>
                  <div className="jd-text-center jd-p-4 jd-bg-blue-50 jd-rounded-xl">
                    <div className="jd-text-2xl jd-font-bold jd-text-blue-600">+16%</div>
                    <div className="jd-text-sm jd-text-gray-600">amélioration</div>
                  </div>
                </div>
              </div>
            </PremiumChartCard>
          </div>

          {/* Enhanced Environmental Insights */}
          <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-3 jd-gap-6">
            {mockData.energyConsumption.slice(-3).map((item, index) => (
              <PremiumChartCard
                key={index}
                title={`${item.month} 2024`}
                subtitle={`${item.company} kWh consommés`}
                delay={index * 100}
              >
                <div className="jd-text-center jd-space-y-4">
                  <div className="jd-text-3xl jd-font-bold jd-text-green-600">
                    {item.equivalent}
                  </div>
                  <div className="jd-text-sm jd-text-gray-500">équivalent énergétique</div>
                  
                  <div className="jd-bg-gray-200 jd-rounded-full jd-h-3 jd-overflow-hidden">
                    <div 
                      className="jd-bg-gradient-to-r jd-from-green-400 jd-to-blue-500 jd-h-full jd-rounded-full jd-transition-all jd-duration-1000"
                      style={{ width: `${item.efficiency}%` }}
                    />
                  </div>
                  <div className="jd-text-xs jd-text-gray-500">{item.efficiency}% d'efficience</div>
                  
                  <div className="jd-text-2xl jd-font-bold">
                    <span className="jd-text-red-500">{item.sector_avg}</span>
                    <span className="jd-text-gray-400 jd-mx-2">vs</span>
                    <span className="jd-text-green-500">{item.company}</span>
                  </div>
                </div>
              </PremiumChartCard>
            ))}
          </div>

          {/* Enhanced Recommendations */}
          <PremiumChartCard
            title="Stratégie d'Optimisation Énergétique"
            subtitle="Recommandations pour améliorer l'efficience"
            delay={300}
          >
            <div className="jd-grid jd-grid-cols-1 md:jd-grid-cols-2 jd-gap-8">
              <div className="jd-space-y-4">
                <h4 className="jd-font-semibold jd-text-green-600 jd-flex jd-items-center jd-gap-2">
                  <CheckCircle className="jd-h-5 jd-w-5" />
                  Points Forts
                </h4>
                <div className="jd-space-y-3">
                  {[
                    'Consommation 24% inférieure au secteur',
                    'Optimisation automatique des modèles',
                    'Formation utilisateurs efficace',
                    'Surveillance temps réel active'
                  ].map((point, index) => (
                    <div key={index} className="jd-flex jd-items-center jd-gap-3">
                      <div className="jd-w-2 jd-h-2 jd-rounded-full jd-bg-green-500" />
                      <div className="jd-text-sm">{point}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="jd-space-y-4">
                <h4 className="jd-font-semibold jd-text-blue-600 jd-flex jd-items-center jd-gap-2">
                  <Lightbulb className="jd-h-5 jd-w-5" />
                  Optimisations Recommandées
                </h4>
                <div className="jd-space-y-3">
                  {[
                    'Implémenter des quotas intelligents',
                    'Développer une promptothèque optimisée',
                    'Formation avancée prompt engineering',
                    'Cache prédictif pour requêtes fréquentes'
                  ].map((recommendation, index) => (
                    <div key={index} className="jd-flex jd-items-center jd-gap-3">
                      <div className="jd-w-2 jd-h-2 jd-rounded-full jd-bg-blue-500" />
                      <div className="jd-text-sm">{recommendation}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </PremiumChartCard>
        </TabsContent>
      </Tabs>

      {/* Enhanced Action Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent className="jd-max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="jd-flex jd-items-center jd-gap-2">
              <div className="jd-p-2 jd-bg-blue-100 jd-rounded-full">
                <MessageSquare className="jd-h-5 jd-w-5 jd-text-blue-600" />
              </div>
              Confirmer l'action
            </AlertDialogTitle>
            <AlertDialogDescription className="jd-text-sm jd-text-gray-600">
              {selectedAction === 'send-reminder' && 'Envoyer un rappel personnalisé sur la charte IA à cet employé ?'}
              {selectedAction === 'schedule-training' && 'Programmer une session de formation IA pour cet employé ?'}
              {selectedAction === 'bulk-reminder' && 'Envoyer un rappel groupé sur la charte IA à tous les membres concernés ?'}
              {selectedAction === 'audit-report' && 'Générer un rapport d\'audit détaillé pour cette vue ?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="jd-mt-6">
            <AlertDialogCancel className="jd-w-full">Annuler</AlertDialogCancel>
            <AlertDialogAction 
              className="jd-w-full jd-bg-blue-600 hover:jd-bg-blue-700"
              onClick={() => console.log('Action confirmée:', selectedAction)}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default EnterpriseAnalyticsDashboard;
