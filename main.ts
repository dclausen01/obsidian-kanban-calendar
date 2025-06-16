import { Plugin, PluginSettingTab, Setting } from 'obsidian';
import { KanbanCalendarView, VIEW_TYPE_KANBAN_CALENDAR } from './calendar-view';
import { KanbanCalendarSettings, DEFAULT_SETTINGS, TaskColorConfig } from './types';

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
    this.addRibbonIcon('calendar-days', 'Kanban-Kalender öffnen', () => {
      this.activateView();
    });

    // Add command
    this.addCommand({
      id: 'open-kanban-calendar',
      name: 'Kanban-Kalender öffnen',
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
      if (this.settings.openLocation === 'tab') {
        // Open in new tab
        leaf = workspace.getLeaf('tab');
      } else {
        // Open in sidebar (default)
        leaf = workspace.getRightLeaf(false)!;
      }
      
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

    containerEl.createEl('h2', { text: 'Kanban-Kalender Einstellungen' });

    new Setting(containerEl)
      .setName('Standard Kanban-Board')
      .setDesc('Pfad zur Standard Kanban-Board Datei (leer lassen um alle Dateien zu scannen)')
      .addText(text => text
        .setPlaceholder('pfad/zum/kanban-board.md')
        .setValue(this.plugin.settings.defaultKanbanBoard)
        .onChange(async (value) => {
          this.plugin.settings.defaultKanbanBoard = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Standard Kalender-Ansicht')
      .setDesc('Wähle die Standard-Ansicht beim Öffnen des Kalenders')
      .addDropdown(dropdown => dropdown
        .addOption('week', 'Woche')
        .addOption('month', 'Monat')
        .addOption('year', 'Jahr')
        .setValue(this.plugin.settings.calendarView)
        .onChange(async (value) => {
          this.plugin.settings.calendarView = value as 'week' | 'month' | 'year';
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Erledigte Aufgaben anzeigen')
      .setDesc('Ob erledigte Aufgaben im Kalender angezeigt werden sollen')
      .addToggle(toggle => toggle
        .setValue(this.plugin.settings.showCompletedTasks)
        .onChange(async (value) => {
          this.plugin.settings.showCompletedTasks = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Datumsformat')
      .setDesc('Datumsformat für Kanban-Boards (Standard: YYYY-MM-DD)')
      .addText(text => text
        .setPlaceholder('YYYY-MM-DD')
        .setValue(this.plugin.settings.dateFormat)
        .onChange(async (value) => {
          this.plugin.settings.dateFormat = value;
          await this.plugin.saveSettings();
        }));

    new Setting(containerEl)
      .setName('Öffnungsort')
      .setDesc('Wähle wo der Kanban-Kalender geöffnet werden soll')
      .addDropdown(dropdown => dropdown
        .addOption('sidebar', 'Seitenleiste (rechts)')
        .addOption('tab', 'Neuer Tab')
        .setValue(this.plugin.settings.openLocation)
        .onChange(async (value) => {
          this.plugin.settings.openLocation = value as 'sidebar' | 'tab';
          await this.plugin.saveSettings();
        }));

    // List Filter Section
    containerEl.createEl('h3', { text: 'Listen-Filter' });
    containerEl.createEl('p', { 
      text: 'Wähle aus, welche Kanban-Listen im Kalender angezeigt werden sollen.',
      cls: 'setting-item-description'
    });

    // Load available lists button and display
    new Setting(containerEl)
      .setName('Verfügbare Listen laden')
      .setDesc('Lade alle verfügbaren Listen aus den Kanban-Dateien')
      .addButton(button => button
        .setButtonText('Listen laden')
        .onClick(async () => {
          await this.loadAndDisplayAvailableLists(containerEl);
        }));

    // Display current filter settings
    this.displayListFilterSettings(containerEl);

    // Task Colors Section
    containerEl.createEl('h3', { text: 'Task Farben' });
    containerEl.createEl('p', { 
      text: 'Konfiguriere Farben für Tasks basierend auf Tags und Status.',
      cls: 'setting-item-description'
    });

    // Add color configuration for each existing config
    this.plugin.settings.taskColors.forEach((colorConfig, index) => {
      this.createColorConfigSetting(containerEl, colorConfig, index);
    });

    // Add new color config button
    new Setting(containerEl)
      .setName('Neue Farbkonfiguration hinzufügen')
      .setDesc('Füge eine neue Regel für Task-Farben hinzu')
      .addButton(button => button
        .setButtonText('Hinzufügen')
        .onClick(async () => {
          this.plugin.settings.taskColors.push({
            status: 'in-progress',
            color: '#2196f3'
          });
          await this.plugin.saveSettings();
          this.display(); // Refresh the settings display
        }));
  }

  private async loadAndDisplayAvailableLists(containerEl: HTMLElement): Promise<void> {
    try {
      // Import KanbanParser
      const { KanbanParser } = await import('./kanban-parser');
      const parser = new KanbanParser(this.app.vault);
      
      const availableLists = await parser.getAllAvailableLists(
        this.plugin.settings.defaultKanbanBoard || undefined
      );
      
      // Find or create the lists container
      let listsContainer = containerEl.querySelector('.available-lists-container') as HTMLElement;
      if (!listsContainer) {
        listsContainer = containerEl.createDiv('available-lists-container');
      } else {
        listsContainer.empty();
      }
      
      if (availableLists.length === 0) {
        listsContainer.createEl('p', { text: 'Keine Listen gefunden. Stelle sicher, dass deine Kanban-Dateien ## Überschriften haben.' });
        return;
      }
      
      listsContainer.createEl('h4', { text: 'Verfügbare Listen:' });
      
      availableLists.forEach(listName => {
        const listSetting = new Setting(listsContainer)
          .setName(listName)
          .setDesc('Wähle aus, ob diese Liste im Kalender angezeigt werden soll');
        
        // Include checkbox
        listSetting.addToggle(toggle => {
          const isIncluded = this.plugin.settings.includedLists.includes(listName);
          const isExcluded = this.plugin.settings.excludedLists.includes(listName);
          
          // If neither included nor excluded, default to included
          const shouldBeChecked = isIncluded || (!isIncluded && !isExcluded);
          
          toggle
            .setValue(shouldBeChecked)
            .onChange(async (value) => {
              if (value) {
                // Include this list
                if (!this.plugin.settings.includedLists.includes(listName)) {
                  this.plugin.settings.includedLists.push(listName);
                }
                // Remove from excluded if it was there
                const excludedIndex = this.plugin.settings.excludedLists.indexOf(listName);
                if (excludedIndex > -1) {
                  this.plugin.settings.excludedLists.splice(excludedIndex, 1);
                }
              } else {
                // Exclude this list
                if (!this.plugin.settings.excludedLists.includes(listName)) {
                  this.plugin.settings.excludedLists.push(listName);
                }
                // Remove from included if it was there
                const includedIndex = this.plugin.settings.includedLists.indexOf(listName);
                if (includedIndex > -1) {
                  this.plugin.settings.includedLists.splice(includedIndex, 1);
                }
              }
              await this.plugin.saveSettings();
            });
        });
      });
      
    } catch (error) {
      console.error('Error loading available lists:', error);
      const errorContainer = containerEl.createDiv();
      errorContainer.createEl('p', { text: 'Fehler beim Laden der Listen. Siehe Konsole für Details.' });
    }
  }

  private displayListFilterSettings(containerEl: HTMLElement): void {
    const { includedLists, excludedLists } = this.plugin.settings;
    
    if (includedLists.length > 0 || excludedLists.length > 0) {
      const filterContainer = containerEl.createDiv('list-filter-summary');
      filterContainer.createEl('h4', { text: 'Aktuelle Filter-Einstellungen:' });
      
      if (includedLists.length > 0) {
        const includedEl = filterContainer.createEl('p');
        includedEl.createEl('strong', { text: 'Eingeschlossene Listen: ' });
        includedEl.createSpan({ text: includedLists.join(', ') });
      }
      
      if (excludedLists.length > 0) {
        const excludedEl = filterContainer.createEl('p');
        excludedEl.createEl('strong', { text: 'Ausgeschlossene Listen: ' });
        excludedEl.createSpan({ text: excludedLists.join(', ') });
      }
      
      // Clear filters button
      new Setting(filterContainer)
        .setName('Filter zurücksetzen')
        .setDesc('Alle Listen-Filter entfernen')
        .addButton(button => button
          .setButtonText('Zurücksetzen')
          .onClick(async () => {
            this.plugin.settings.includedLists = [];
            this.plugin.settings.excludedLists = [];
            await this.plugin.saveSettings();
            this.display(); // Refresh the settings display
          }));
    }
  }

  private createColorConfigSetting(containerEl: HTMLElement, colorConfig: any, index: number): void {
    const setting = new Setting(containerEl)
      .setName(`Farbkonfiguration ${index + 1}`)
      .setDesc('Tag (optional), Status und Farbe für Tasks');

    // Tag input (optional)
    setting.addText(text => text
      .setPlaceholder('Tag (optional, z.B. #Unterricht)')
      .setValue(colorConfig.tag || '')
      .onChange(async (value) => {
        if (value.trim()) {
          this.plugin.settings.taskColors[index].tag = value.trim();
        } else {
          delete this.plugin.settings.taskColors[index].tag;
        }
        await this.plugin.saveSettings();
      }));

    // Status dropdown
    setting.addDropdown(dropdown => dropdown
      .addOption('in-progress', 'In Bearbeitung')
      .addOption('completed', 'Erledigt')
      .setValue(colorConfig.status)
      .onChange(async (value) => {
        this.plugin.settings.taskColors[index].status = value as 'completed' | 'in-progress';
        await this.plugin.saveSettings();
      }));

    // Color input
    setting.addColorPicker(colorPicker => colorPicker
      .setValue(colorConfig.color)
      .onChange(async (value) => {
        this.plugin.settings.taskColors[index].color = value;
        await this.plugin.saveSettings();
      }));

    // Delete button
    setting.addButton(button => button
      .setButtonText('Löschen')
      .setWarning()
      .onClick(async () => {
        this.plugin.settings.taskColors.splice(index, 1);
        await this.plugin.saveSettings();
        this.display(); // Refresh the settings display
      }));
  }
}
