import React, { useState, useEffect, useMemo } from 'react';
import { KanbanTask } from './types';

interface CalendarComponentProps {
  tasks: KanbanTask[];
  onTaskClick?: (task: KanbanTask) => void;
  onDateChange?: (date: string) => void;
  initialView?: 'week' | 'month' | 'year';
  initialDate?: string;
}

export const CalendarComponent: React.FC<CalendarComponentProps> = ({
  tasks,
  onTaskClick,
  onDateChange,
  initialView = 'month',
  initialDate = new Date().toISOString()
}) => {
  const [view, setView] = useState<'week' | 'month' | 'year'>(initialView);
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);

  // Helper function to format date as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Task Modal Component
  const TaskModal = () => {
    if (!selectedTask || !showTaskModal) return null;
    
    const handleClose = () => {
      setShowTaskModal(false);
      setSelectedTask(null);
    };
    
    // Generate tag colors based on tag name
    const getTagColor = (tag: string) => {
      const hash = tag.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      
      const hue = hash % 360;
      return `hsl(${hue}, 70%, 50%)`;
    };
    
    return (
      <div className="kanban-calendar-modal-overlay" onClick={handleClose}>
        <div className="kanban-calendar-modal-content" onClick={e => e.stopPropagation()}>
          <div className="kanban-calendar-modal-header">
            <h3>Task Details</h3>
            <button className="kanban-calendar-modal-close" onClick={handleClose}>×</button>
          </div>
          <div className="kanban-calendar-modal-body">
            <div className={`kanban-calendar-task-status ${selectedTask.completed ? 'completed' : ''}`}>
              {selectedTask.completed ? 'Completed' : 'In Progress'}
            </div>
            
            <div className="kanban-calendar-task-description">
              {selectedTask.description}
            </div>
            
            <div className="kanban-calendar-task-meta">
              <div><strong>Date:</strong> {selectedTask.date}</div>
              {selectedTask.time && (
                <div><strong>Time:</strong> {selectedTask.time}</div>
              )}
            </div>
            
            {selectedTask.tags.length > 0 && (
              <div className="kanban-calendar-task-tags">
                <strong>Tags:</strong>
                <div className="kanban-calendar-tags-container">
                  {selectedTask.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="kanban-calendar-tag"
                      style={{ backgroundColor: getTagColor(tag) }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            <div className="kanban-calendar-task-source">
              <strong>Source:</strong> {selectedTask.source.split('/').pop()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Task Item Component
  const TaskItem: React.FC<{ task: KanbanTask; compact?: boolean }> = ({ task, compact = false }) => {
    const handleTaskClick = () => {
      setSelectedTask(task);
      setShowTaskModal(true);
      onTaskClick?.(task);
    };
    
    if (compact) {
      return (
        <div 
          className={`kanban-calendar-task-compact ${task.completed ? 'completed' : ''}`}
          title={`${task.time ? task.time + ' - ' : ''}${task.description}`}
          onClick={handleTaskClick}
        >
          {task.time && <span className="kanban-calendar-task-time">{task.time}</span>}
          <span>{task.description.length > 20 
            ? task.description.substring(0, 20) + '...' 
            : task.description}
          </span>
        </div>
      );
    }
    
    return (
      <div 
        className={`kanban-calendar-task ${task.completed ? 'completed' : ''}`}
        onClick={handleTaskClick}
      >
        {task.time && <div className="kanban-calendar-task-time">{task.time}</div>}
        <div className="kanban-calendar-task-description">{task.description}</div>
        <div className="kanban-calendar-task-tags">
          {task.tags.map(tag => (
            <span key={tag} className="kanban-calendar-tag">{tag}</span>
          ))}
        </div>
      </div>
    );
  };

  // Calendar Header Component
  const CalendarHeader = () => {
    const date = new Date(currentDate);
    
    const navigatePrevious = () => {
      const newDate = new Date(date);
      switch (view) {
        case 'week':
          newDate.setDate(date.getDate() - 7);
          break;
        case 'month':
          newDate.setMonth(date.getMonth() - 1);
          break;
        case 'year':
          newDate.setFullYear(date.getFullYear() - 1);
          break;
      }
      const newDateString = newDate.toISOString();
      setCurrentDate(newDateString);
      onDateChange?.(newDateString);
    };
    
    const navigateNext = () => {
      const newDate = new Date(date);
      switch (view) {
        case 'week':
          newDate.setDate(date.getDate() + 7);
          break;
        case 'month':
          newDate.setMonth(date.getMonth() + 1);
          break;
        case 'year':
          newDate.setFullYear(date.getFullYear() + 1);
          break;
      }
      const newDateString = newDate.toISOString();
      setCurrentDate(newDateString);
      onDateChange?.(newDateString);
    };
    
    const navigateToday = () => {
      const newDateString = new Date().toISOString();
      setCurrentDate(newDateString);
      onDateChange?.(newDateString);
    };
    
    const getHeaderTitle = () => {
      switch (view) {
        case 'week': {
          const weekStart = new Date(date);
          const day = weekStart.getDay();
          const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
          weekStart.setDate(diff);
          
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          return `${weekStart.toLocaleDateString('de-DE')} - ${weekEnd.toLocaleDateString('de-DE')}`;
        }
        case 'month':
          return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' });
        case 'year':
          return date.getFullYear().toString();
        default:
          return '';
      }
    };
    
    return (
      <div className="kanban-calendar-header">
        <div className="kanban-calendar-navigation">
          <button onClick={navigatePrevious}>←</button>
          <button onClick={navigateToday}>Heute</button>
          <button onClick={navigateNext}>→</button>
        </div>
        <div className="kanban-calendar-title">{getHeaderTitle()}</div>
        <div className="kanban-calendar-view-selector">
          <button 
            className={view === 'week' ? 'active' : ''} 
            onClick={() => setView('week')}
          >
            Woche
          </button>
          <button 
            className={view === 'month' ? 'active' : ''} 
            onClick={() => setView('month')}
          >
            Monat
          </button>
          <button 
            className={view === 'year' ? 'active' : ''} 
            onClick={() => setView('year')}
          >
            Jahr
          </button>
        </div>
      </div>
    );
  };

  // Week View Component
  const WeekView = () => {
    const date = new Date(currentDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    
    const startOfWeek = new Date(date);
    startOfWeek.setDate(diff);
    
    const days = Array(7).fill(null).map((_, i) => {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      return day;
    });
    
    return (
      <div className="kanban-calendar-week-view">
        {days.map(day => {
          const formattedDate = formatDate(day);
          const dayTasks = tasks.filter(task => task.date === formattedDate);
          
          return (
            <div key={formattedDate} className="kanban-calendar-day-column">
              <div className="kanban-calendar-day-header">
                <div>{day.toLocaleDateString('de-DE', { weekday: 'short' })}</div>
                <div className="kanban-calendar-day-number">{day.getDate()}</div>
              </div>
              <div className="kanban-calendar-day-tasks">
                {dayTasks.length === 0 ? (
                  <div className="kanban-calendar-no-tasks">Keine Aufgaben</div>
                ) : (
                  dayTasks.map(task => (
                    <TaskItem key={task.id} task={task} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Month View Component
  const MonthView = () => {
    const date = new Date(currentDate);
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    let startDay = firstDayOfMonth.getDay() - 1;
    if (startDay === -1) startDay = 6;
    
    const daysToShow: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Add days from previous month
    const prevMonthLastDay = new Date(date.getFullYear(), date.getMonth(), 0).getDate();
    for (let i = startDay; i > 0; i--) {
      const day = new Date(date.getFullYear(), date.getMonth() - 1, prevMonthLastDay - i + 1);
      daysToShow.push({ date: day, isCurrentMonth: false });
    }
    
    // Add days from current month
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const day = new Date(date.getFullYear(), date.getMonth(), i);
      daysToShow.push({ date: day, isCurrentMonth: true });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - daysToShow.length;
    for (let i = 1; i <= remainingDays; i++) {
      const day = new Date(date.getFullYear(), date.getMonth() + 1, i);
      daysToShow.push({ date: day, isCurrentMonth: false });
    }
    
    return (
      <div className="kanban-calendar-month-view">
        <div className="kanban-calendar-weekday-headers">
          {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
            <div key={day} className="kanban-calendar-weekday-header">{day}</div>
          ))}
        </div>
        <div className="kanban-calendar-month-grid">
          {daysToShow.map(({ date, isCurrentMonth }) => {
            const formattedDate = formatDate(date);
            const dayTasks = tasks.filter(task => task.date === formattedDate);
            const isToday = formatDate(new Date()) === formattedDate;
            
            return (
              <div 
                key={formattedDate} 
                className={`kanban-calendar-day-cell ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
              >
                <div className="kanban-calendar-day-number">{date.getDate()}</div>
                <div className="kanban-calendar-day-cell-tasks">
                  {dayTasks.slice(0, 3).map(task => (
                    <TaskItem key={task.id} task={task} compact={true} />
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="kanban-calendar-more-tasks">+{dayTasks.length - 3} mehr</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Year View Component
  const YearView = () => {
    const date = new Date(currentDate);
    const year = date.getFullYear();
    
    const months = Array(12).fill(null).map((_, i) => {
      return new Date(year, i, 1);
    });
    
    return (
      <div className="kanban-calendar-year-view">
        {months.map(month => {
          const monthTasks = tasks.filter(task => {
            const taskDate = new Date(task.date);
            return taskDate.getFullYear() === year && taskDate.getMonth() === month.getMonth();
          });
          
          return (
            <div 
              key={month.toISOString()} 
              className="kanban-calendar-month-cell"
              onClick={() => {
                const newDateString = month.toISOString();
                setCurrentDate(newDateString);
                setView('month');
                onDateChange?.(newDateString);
              }}
            >
              <div className="kanban-calendar-month-header">
                {month.toLocaleDateString('de-DE', { month: 'long' })}
              </div>
              <div className="kanban-calendar-month-summary">
                {monthTasks.length > 0 ? (
                  <div className="kanban-calendar-task-count">{monthTasks.length} Aufgaben</div>
                ) : (
                  <div className="kanban-calendar-no-tasks">Keine Aufgaben</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render the appropriate view
  const renderView = () => {
    switch (view) {
      case 'week': return <WeekView />;
      case 'month': return <MonthView />;
      case 'year': return <YearView />;
      default: return <MonthView />;
    }
  };

  return (
    <div className="kanban-calendar-container">
      <CalendarHeader />
      {renderView()}
      <TaskModal />
    </div>
  );
};
