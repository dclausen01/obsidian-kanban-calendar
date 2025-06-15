import { ItemView, WorkspaceLeaf, TFile } from 'obsidian';
import React from 'react';
import { Root, createRoot } from 'react-dom/client';
import { CalendarComponent } from './calendar-component';
import { KanbanParser } from './kanban-parser';
import { KanbanTask, KanbanCalendarSettings } from './types';
import KanbanCalendarPlugin from './main';

export const VIEW_TYPE_KANBAN_CALENDAR = 'kanban-calendar-view';

export class KanbanCalendarView extends ItemView {
  private root: Root | null = null;
  private parser: KanbanParser;
  private plugin: KanbanCalendarPlugin;
  private tasks: KanbanTask[] = [];

  constructor(leaf: WorkspaceLeaf, plugin: KanbanCalendarPlugin) {
    super(leaf);
    this.plugin = plugin;
    this.parser = new KanbanParser(this.app.vault);
  }

  getViewType(): string {
    return VIEW_TYPE_KANBAN_CALENDAR;
  }

  getDisplayText(): string {
    return 'Kanban Calendar';
  }

  getIcon(): string {
    return 'calendar-days';
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1];
    container.empty();
    container.addClass('kanban-calendar-view');

    // Create React root
    this.root = createRoot(container);

    // Load initial tasks
    await this.loadTasks();

    // Render React component
    this.renderComponent();

    // Set up file watcher
    this.registerEvent(
      this.app.vault.on('modify', async (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          await this.loadTasks();
          this.renderComponent();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('create', async (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          await this.loadTasks();
          this.renderComponent();
        }
      })
    );

    this.registerEvent(
      this.app.vault.on('delete', async (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          await this.loadTasks();
          this.renderComponent();
        }
      })
    );
  }

  async onClose(): Promise<void> {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }

  private async loadTasks(): Promise<void> {
    try {
      const settings = this.plugin.settings;
      this.tasks = await this.parser.getAllKanbanTasks(
        settings.defaultKanbanBoard || undefined
      );
    } catch (error) {
      console.log("Loaded tasks:", this.tasks.length, "tasks");
      console.error('Error loading Kanban tasks:', error);
      this.tasks = [];
    }
  }

  private renderComponent(): void {
    console.log("Rendering calendar with", this.tasks.length, "tasks");
    if (!this.root) return;

    const settings = this.plugin.settings;

    this.root.render(React.createElement(CalendarComponent, {
      tasks: this.tasks,
      onTaskClick: (task: KanbanTask) => {
        // Only show modal, don't open file
      },
      onDateChange: (date: string) => {
        console.log("Date changed to:", date);
      },
      initialView: settings.calendarView,
      initialDate: new Date().toISOString()
    }));
  }

  private async openTaskSource(task: KanbanTask): Promise<void> {
    try {
      const file = this.app.vault.getAbstractFileByPath(task.source);
      if (file) {
        await this.app.workspace.openLinkText(task.source, '', true);
      }
    } catch (error) {
      console.error('Error opening task source:', error);
    }
  }

  async refresh(): Promise<void> {
    await this.loadTasks();
    this.renderComponent();
  }
}
