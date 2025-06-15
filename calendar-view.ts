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
      onOpenFile: (task: KanbanTask) => {
        this.openTaskSource(task);
      },
      onTaskMove: async (task: KanbanTask, newDate: string) => {
        console.log("Moving task", task.id, "from", task.date, "to", newDate);
        
        try {
          // Update the task in the file first
          const success = await this.parser.updateTaskDateInFile(task, newDate);
          
          if (success) {
            // Update the task's date in the local tasks array
            const taskIndex = this.tasks.findIndex(t => t.id === task.id);
            if (taskIndex !== -1) {
              this.tasks[taskIndex].date = newDate;
              
              // Re-render the component with updated tasks
              this.renderComponent();
              
              console.log("Task moved successfully and saved to file");
            }
          } else {
            console.error("Failed to update task in file");
            // Optionally show user notification
          }
        } catch (error) {
          console.error("Error moving task:", error);
        }
      },
      onTaskCreate: async (taskData: { description: string; date: string; time?: string; tags: string[] }) => {
        console.log("Creating new task:", taskData);
        
        try {
          const settings = this.plugin.settings;
          const targetFile = settings.defaultKanbanBoard || 'ToDo.md';
          
          // Add task to file
          const success = await this.parser.addNewTaskToFile(
            targetFile,
            taskData.description,
            taskData.date,
            taskData.time,
            taskData.tags
          );
          
          if (success) {
            // Reload tasks to include the new one
            await this.loadTasks();
            
            // Force a complete re-render
            this.renderComponent();
            
            console.log("Task created successfully and saved to file. Tasks reloaded:", this.tasks.length);
          } else {
            console.error("Failed to create task in file");
          }
        } catch (error) {
          console.error("Error creating task:", error);
        }
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
      console.log("Attempting to open file:", task.source);
      
      const file = this.app.vault.getAbstractFileByPath(task.source);
      console.log("Found file:", file);
      
      if (file instanceof TFile) {
        console.log("Opening file in new leaf");
        const leaf = this.app.workspace.getLeaf(false);
        await leaf.openFile(file);
        
        // Focus the leaf
        this.app.workspace.setActiveLeaf(leaf);
        console.log("File opened successfully");
      } else {
        console.error("File not found or not a TFile:", task.source);
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
