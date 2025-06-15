export interface KanbanTask {
  id: string;
  description: string;
  date: string;
  time?: string;
  tags: string[];
  completed: boolean;
  source: string;
}

export interface KanbanCalendarSettings {
  defaultKanbanBoard: string;
  calendarView: 'week' | 'month' | 'year';
  showCompletedTasks: boolean;
  dateFormat: string;
}

export const DEFAULT_SETTINGS: KanbanCalendarSettings = {
  defaultKanbanBoard: '',
  calendarView: 'month',
  showCompletedTasks: true,
  dateFormat: 'YYYY-MM-DD'
};
