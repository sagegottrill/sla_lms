import { useState, useMemo } from 'react';
import { useCalendarEvents } from '@/hooks/useCalendarEvents';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createCalendarEvent, deleteCalendarEvent } from '@/services/studentDashboard';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

interface CalendarWidgetProps {
  userId: string;
}

export default function CalendarWidget({ userId }: CalendarWidgetProps) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    event_date: '',
    event_type: 'personal' as 'personal' | 'study' | 'deadline' | 'other',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const now = new Date();
  const displayDate = new Date(now);
  displayDate.setMonth(displayDate.getMonth() + monthOffset);

  const currentMonth = displayDate.getMonth();
  const currentYear = displayDate.getFullYear();
  const currentMonthLabel = displayDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  const { data: events = [], isLoading } = useCalendarEvents(userId, currentMonth, currentYear);

  // Calendar grid calculations
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstWeekdayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, typeof events>();
    events.forEach(event => {
      const dateKey = format(new Date(event.event_date), 'yyyy-MM-dd');
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.event_date) return;

    setIsSubmitting(true);
    const result = await createCalendarEvent(userId, newEvent);
    
    if (result) {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents', userId, currentMonth, currentYear] });
      setIsAddEventOpen(false);
      setNewEvent({
        title: '',
        description: '',
        event_date: '',
        event_type: 'personal',
      });
    }
    
    setIsSubmitting(false);
  };

  const handleDeleteEvent = async (eventId: string) => {
    const success = await deleteCalendarEvent(eventId);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents', userId, currentMonth, currentYear] });
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'course':
        return 'bg-blue-500';
      case 'deadline':
        return 'bg-red-500';
      case 'study':
        return 'bg-green-500';
      case 'personal':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-card rounded-2xl ring-1 ring-black/5 dark:ring-white/10 border-0 p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display font-semibold text-lg text-foreground">Learning Calendar</h2>
        <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <Plus className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Calendar Event</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <Input
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  placeholder="Study session, deadline, etc."
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description (optional)</label>
                <Textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Date</label>
                <Input
                  type="date"
                  value={newEvent.event_date}
                  onChange={(e) => setNewEvent({ ...newEvent, event_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Type</label>
                <Select
                  value={newEvent.event_type}
                  onValueChange={(value: any) => setNewEvent({ ...newEvent, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="study">Study Session</SelectItem>
                    <SelectItem value="deadline">Deadline</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleAddEvent}
                disabled={!newEvent.title || !newEvent.event_date || isSubmitting}
                className="w-full"
              >
                {isSubmitting ? 'Adding...' : 'Add Event'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-sm text-foreground">{currentMonthLabel}</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMonthOffset((v) => v - 1)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset(0)}
            className="px-2 py-1 rounded-md hover:bg-muted transition-colors text-xs font-medium text-muted-foreground"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setMonthOffset((v) => v + 1)}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
          <div key={day} className="text-center text-[10px] font-semibold text-muted-foreground uppercase py-1">
            {day}
          </div>
        ))}

        {Array.from({ length: 42 }).map((_, idx) => {
          const dayNumber = idx - firstWeekdayIndex + 1;
          const isInMonth = dayNumber >= 1 && dayNumber <= daysInCurrentMonth;
          const isToday =
            isInMonth &&
            dayNumber === now.getDate() &&
            currentMonth === now.getMonth() &&
            currentYear === now.getFullYear();

          const dateKey = isInMonth
            ? format(new Date(currentYear, currentMonth, dayNumber), 'yyyy-MM-dd')
            : '';
          const dayEvents = dateKey ? eventsByDate.get(dateKey) || [] : [];

          return (
            <div
              key={idx}
              className={`min-h-[40px] p-1 rounded-md ${
                isInMonth
                  ? isToday
                    ? 'bg-primary/10 ring-1 ring-primary/30'
                    : 'hover:bg-muted/50'
                  : 'opacity-0'
              }`}
            >
              {isInMonth && (
                <>
                  <div
                    className={`text-xs text-center mb-1 ${
                      isToday ? 'font-bold text-primary' : 'text-foreground/70'
                    }`}
                  >
                    {dayNumber}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <div
                        key={event.id}
                        className={`h-1 rounded-full ${getEventColor(event.event_type)}`}
                        title={event.title}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-[8px] text-center text-muted-foreground">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming Events List */}
      {events.length > 0 && (
        <div className="border-t border-border pt-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">Upcoming Events</h3>
          <div className="space-y-2 max-h-[200px] overflow-y-auto">
            {events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${getEventColor(event.event_type)}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{event.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(event.event_date), 'MMM d, yyyy')} •{' '}
                    {formatDistanceToNow(new Date(event.event_date), { addSuffix: true })}
                  </p>
                  {event.course_title && (
                    <p className="text-xs text-muted-foreground mt-0.5">{event.course_title}</p>
                  )}
                </div>
                {event.source === 'user' && (
                  <button
                    onClick={() => handleDeleteEvent(event.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded transition-all"
                    aria-label="Delete event"
                  >
                    <X className="w-3 h-3 text-destructive" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {events.length === 0 && !isLoading && (
        <div className="text-center py-6 text-sm text-muted-foreground">
          No events this month. Add your first event!
        </div>
      )}
    </div>
  );
}
