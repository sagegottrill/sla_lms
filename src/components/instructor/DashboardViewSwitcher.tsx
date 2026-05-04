import { LayoutGrid, List, Activity } from 'lucide-react';

interface DashboardViewSwitcherProps {
  currentView: 'card' | 'list' | 'activity';
  onViewChange: (view: 'card' | 'list' | 'activity') => void;
  isUpdating?: boolean;
}

export default function DashboardViewSwitcher({ 
  currentView,
  onViewChange,
  isUpdating = false,
}: DashboardViewSwitcherProps) {
  const views = [
    { value: 'card' as const, icon: LayoutGrid, label: 'Card View' },
    { value: 'list' as const, icon: List, label: 'List View' },
    { value: 'activity' as const, icon: Activity, label: 'Activity View' },
  ];

  return (
    <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
      {views.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => onViewChange(value)}
          disabled={isUpdating}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            currentView === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
          title={label}
        >
          <Icon className="w-4 h-4" />
          <span className="hidden sm:inline">{label.replace(' View', '')}</span>
        </button>
      ))}
    </div>
  );
}
