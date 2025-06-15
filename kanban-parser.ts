import { TFile, Vault } from 'obsidian';
import { KanbanTask } from './types';

export class KanbanParser {
  private vault: Vault;

  constructor(vault: Vault) {
    this.vault = vault;
  }

  async parseKanbanFile(file: TFile): Promise<KanbanTask[]> {
    const content = await this.vault.read(file);
    return this.parseKanbanContent(content, file.path);
  }

  parseKanbanContent(content: string, filePath: string): KanbanTask[] {
    const tasks: KanbanTask[] = [];
    const lines = content.split('\n');

    // Helper function to find a date in a line
    const findDateInLine = (line: string): string | null => {
      const dateMatch = line.match(/@\{(\d{4}-\d{2}-\d{2})\}/);
      return dateMatch ? dateMatch[1] : null;
    };

    // Helper function to find tags in a line
    const findTagsInLine = (line: string): string[] => {
      const tags: string[] = [];
      const tagMatches = line.match(/#[a-zA-Z0-9]+/g);
      if (tagMatches) {
        tagMatches.forEach(tag => {
          tags.push(tag);
        });
      }
      return tags;
    };

    // Helper function to check if a line is a task
    const isTaskLine = (line: string): boolean => {
      return line.includes('- [ ]') || line.includes('- [x]');
    };

    // Helper function to check if a line is indented (subtask)
    const isIndented = (line: string): boolean => {
      return line.startsWith('\t') || line.startsWith('    ');
    };

    // Track parent task information for subtasks
    let currentParentDate: string | null = null;
    let currentParentTags: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Skip empty lines
      if (!line.trim()) continue;

      // Check if line contains a task
      if (isTaskLine(line)) {
        // Check if task is completed
        const completed = line.includes('- [x]');

        // Check if this is a subtask (indented)
        const isSubtask = isIndented(line);

        // Extract task description
        let description = line.replace(/- \[ \]|- \[x\]/, '').trim();

        // Look for date in current line
        let date = findDateInLine(line);
        let tags = findTagsInLine(line);
        let time: string | null = null;

        // If this is a subtask, use parent task's date and tags if available
        if (isSubtask && currentParentDate) {
          if (!date) date = currentParentDate;
          tags = [...tags, ...currentParentTags];
        } else if (!isSubtask) {
          // This is a parent task, store its info for potential subtasks
          currentParentDate = date;
          currentParentTags = [...tags];
        }

        // If date not found in current line, look ahead up to 3 lines
        if (!date) {
          for (let j = 1; j <= 3 && i + j < lines.length; j++) {
            const nextLine = lines[i + j];

            // Skip if next line is another task
            if (isTaskLine(nextLine) && !isIndented(nextLine)) {
              break;
            }

            // Check for date in next line
            const nextLineDate = findDateInLine(nextLine);
            if (nextLineDate) {
              date = nextLineDate;

              // Also look for tags in this line
              const nextLineTags = findTagsInLine(nextLine);
              tags = [...tags, ...nextLineTags];

              // Extract time if available
              const timeMatch = nextLine.match(/@@(\d{2}:\d{2})/);
              if (timeMatch) {
                time = timeMatch[1];
              }

              // Update parent date and tags if this is a parent task
              if (!isSubtask) {
                currentParentDate = date;
                currentParentTags = [...currentParentTags, ...nextLineTags];
              }

              break;
            }
          }
        } else {
          // Extract time if available on same line as date
          const timeMatch = line.match(/@@(\d{2}:\d{2})/);
          if (timeMatch) {
            time = timeMatch[1];
          }
        }

        // Only add task if it has a date
        if (date) {
          // Clean up description
          description = description.replace(/@\{\d{4}-\d{2}-\d{2}\}/, '').trim();
          if (time) description = description.replace(/@@\d{2}:\d{2}/, '').trim();

          // Remove tags from description
          tags.forEach(tag => {
            description = description.replace(tag, '').trim();
          });

          // Remove markdown formatting (bold, italic, etc.)
          description = description.replace(/\*\*(.*?)\*\*/g, '$1').trim(); // Remove bold
          description = description.replace(/\*(.*?)\*/g, '$1').trim(); // Remove italic
          description = description.replace(/__(.*?)__/g, '$1').trim(); // Remove underline

          // Add task to parsed tasks
          tasks.push({
            id: `task-${Date.now()}-${Math.random()}`,
            description,
            date,
            time: time || undefined,
            tags,
            completed,
            source: filePath
          });
        }
      }
    }

    return tasks;
  }

  async getAllKanbanTasks(kanbanFilePath?: string): Promise<KanbanTask[]> {
    const allTasks: KanbanTask[] = [];

    if (kanbanFilePath) {
      // Read specific file
      const file = this.vault.getAbstractFileByPath(kanbanFilePath);
      if (file instanceof TFile) {
        const tasks = await this.parseKanbanFile(file);
        allTasks.push(...tasks);
      }
    } else {
      // Read all markdown files
      const markdownFiles = this.vault.getMarkdownFiles();
      for (const file of markdownFiles) {
        const tasks = await this.parseKanbanFile(file);
        allTasks.push(...tasks);
      }
    }

    return allTasks;
  }
}
