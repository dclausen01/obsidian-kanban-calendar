import { Plugin, PluginSettingTab, Setting } from 'obsidian';
import { KanbanCalendarView, VIEW_TYPE_KANBAN_CALENDAR } from './calendar-view';
import { KanbanCalendarSettings, DEFAULT_SETTINGS } from './types';

export default class KanbanCalendarPlugin extends Plugin {
  settings!: KanbanCalendarSettings;

  async onload() {
    await this.loadSettings();

    // Register the calendar view
    this.registerView(
      VIEW_TYPE_KANBAN_CALENDAR,
      (leaf) => new KanbanCalendarView(leaf, this)
    );

    // Add ribbon icon
    this.addRibbonIcon('calendar-days', 'Open Kanban Calendar', () => {
      this.activateView();
    });

    // Add command
    this.addCommand({
      id: 'open-kanban-calendar',
      name: 'Open Kanban Calendar',
      callback: () => {
        this.activateView();
      }
    });

    // Add settings tab
    this.addSettingTab(new KanbanCalendarSettingTab(this.app, this));
  }

  onunload() {
    // Clean up
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf = workspace.getLeavesOfType(VIEW_TYPE_KANBAN_CALENDAR)[0];

    if (!leaf) {
      leaf = workspace.getRightLeaf(false)!;
      await leaf.setViewState({
        type: VIEW_TYPE_KANBAN_CALENDAR,
        active: true,
      });
    }

    workspace.revealLeaf(leaf);
  }
}

class KanbanCalendarSettingTab extends PluginSettingTab {
  plugin: KanbanCalendarPlugin;

  constructor(app: any, plugin: KanbanCalendarPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl('h2', { text: 'Kanban Calendar Settings' });

    new Setting(containerEl)
      .setName('Default Kanban Board')
      .setDesc('Path to the default Kanban board file (leave empty to scan all files)')
      .addText(text => text
        .setPlaceholder('path/to/kanban-board.md')
        .setValue(this.plugin.settings.defaultKanbanBoard)
        .onChange(async (value) => {
          this.plugin.settings.defaultKanbanBoard = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Default Calendar View')
      .setDesc('Choose the default view when opening the calendar')
      .addDropdown(dropdown => dropdown
        .addOption('week', 'Week')
        .addOption('month', 'Month')
        .addOption('year', 'Year')
        .setValue(this.plugin.settings.calendarView)
        .onChange(async (value) => {
          this.plugin.settings.calendarView = value as 'week' | 'month' | 'year';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Show Completed Tasks')
      .setDesc('Whether to show completed tasks in the calendar')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showCompletedTasks)
        .onChange(async (value) => {
          this.plugin.settings.showCompletedTasks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Date Format')
      .setDesc('Date format used in Kanban boards (default: YYYY-MM-DD)')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD')
        .setValue(this.plugin.settings.dateFormat)
        .onChange(async (value) => {
          this.plugin.settings.dateFormat = value;
          await this.plugin.saveSettings();
        }));
  }
}
