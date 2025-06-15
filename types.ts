export interface KanbanTask {
  id: string;
  description: string;
  date: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  tags: string[];
  completed: boolean;
  source: string;
  linkedNote?: string; // Extracted from [[...]] pattern
}

export interface TaskColorConfig {
  tag?: string;
  status: 'completed' | 'in-progress';
  color: string;
}

export interface KanbanCalendarSettings {
  defaultKanbanBoard: string;
  calendarView: 'week' | 'month' | 'year';
  showCompletedTasks: boolean;
  dateFormat: string;
  taskColors: TaskColorConfig[];
}

export const DEFAULT_SETTINGS: KanbanCalendarSettings = {
  defaultKanbanBoard: '',
  calendarView: 'month',
  showCompletedTasks: true,
  dateFormat: 'YYYY-MM-DD',
  taskColors: [
    { status: 'completed', color: '#4caf50' },
    { status: 'in-progress', color: '#2196f3' }
  ]
};
