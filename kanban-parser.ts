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

              // Extract time if available (single time or time range)
              const timeRangeMatch = nextLine.match(/@@(\d{2}:\d{2})-(\d{2}:\d{2})/);
              const singleTimeMatch = nextLine.match(/@@(\d{2}:\d{2})/);
              
              if (timeRangeMatch) {
                // Time range format: @@09:00-11:30
                const startTime = timeRangeMatch[1];
                const endTime = timeRangeMatch[2];
                time = `${startTime}-${endTime}`;
              } else if (singleTimeMatch) {
                // Single time format: @@09:30
                time = singleTimeMatch[1];
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

          // Parse time into startTime and endTime if it's a range
          let startTime: string | undefined;
          let endTime: string | undefined;
          let displayTime: string | undefined;
          
          if (time) {
            if (time.includes('-')) {
              // Time range: "09:00-11:30"
              const [start, end] = time.split('-');
              startTime = start;
              endTime = end;
              displayTime = time; // Keep original format for display
            } else {
              // Single time: "09:30"
              displayTime = time;
              startTime = time;
            }
          }

          // Generate a more stable ID based on content
          const taskId = `task-${filePath.replace(/[^a-zA-Z0-9]/g, '_')}-${description.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '_')}-${date}`;
          
          // Add task to parsed tasks
          tasks.push({
            id: taskId,
            description,
            date,
            time: displayTime,
            startTime,
            endTime,
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

  async updateTaskDateInFile(task: KanbanTask, newDate: string): Promise<boolean> {
    try {
      console.log(`Updating task "${task.description}" from ${task.date} to ${newDate} in file ${task.source}`);
      
      const file = this.vault.getAbstractFileByPath(task.source);
      if (!(file instanceof TFile)) {
        console.error('File not found:', task.source);
        return false;
      }

      const content = await this.vault.read(file);
      const lines = content.split('\n');
      
      // Find the task line by matching the description
      let taskLineIndex = -1;
      let foundTask = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line contains a task with our description
        if ((line.includes('- [ ]') || line.includes('- [x]')) && 
            line.includes(task.description)) {
          
          // Additional verification: check if this line or nearby lines contain the old date
          const checkLines = [line];
          // Check up to 3 lines ahead for date information
          for (let j = 1; j <= 3 && i + j < lines.length; j++) {
            const nextLine = lines[i + j];
            // Stop if we hit another task
            if (nextLine.includes('- [ ]') || nextLine.includes('- [x]')) {
              break;
            }
            checkLines.push(nextLine);
          }
          
          // Check if any of these lines contain the old date
          const combinedText = checkLines.join(' ');
          if (combinedText.includes(`@{${task.date}}`)) {
            taskLineIndex = i;
            foundTask = true;
            break;
          }
        }
      }
      
      if (!foundTask) {
        console.error('Task not found in file:', task.description);
        return false;
      }
      
      // Update the date in the found line and subsequent lines
      let updated = false;
      for (let i = taskLineIndex; i < Math.min(taskLineIndex + 4, lines.length); i++) {
        const oldDatePattern = new RegExp(`@\\{${task.date.replace(/[-]/g, '\\-')}\\}`, 'g');
        if (oldDatePattern.test(lines[i])) {
          lines[i] = lines[i].replace(oldDatePattern, `@{${newDate}}`);
          updated = true;
          console.log(`Updated line ${i}: ${lines[i]}`);
          break;
        }
      }
      
      if (!updated) {
        console.error('Date pattern not found in task vicinity');
        return false;
      }
      
      // Write the updated content back to the file
      const updatedContent = lines.join('\n');
      await this.vault.modify(file, updatedContent);
      
      console.log('Task date updated successfully in file');
      return true;
      
    } catch (error) {
      console.error('Error updating task date in file:', error);
      return false;
    }
  }

  async updateTaskInFile(task: KanbanTask, updates: { description?: string; date?: string; time?: string; completed?: boolean }): Promise<boolean> {
    try {
      console.log(`Updating task "${task.description}" in file ${task.source}`);
      
      const file = this.vault.getAbstractFileByPath(task.source);
      if (!(file instanceof TFile)) {
        console.error('File not found:', task.source);
        return false;
      }

      const content = await this.vault.read(file);
      const lines = content.split('\n');
      
      // Find the task line by matching the description
      let taskLineIndex = -1;
      let foundTask = false;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Check if this line contains a task with our description
        if ((line.includes('- [ ]') || line.includes('- [x]')) && 
            line.includes(task.description)) {
          
          // Additional verification: check if this line or nearby lines contain the old date
          const checkLines = [line];
          // Check up to 3 lines ahead for date information
          for (let j = 1; j <= 3 && i + j < lines.length; j++) {
            const nextLine = lines[i + j];
            // Stop if we hit another task
            if (nextLine.includes('- [ ]') || nextLine.includes('- [x]')) {
              break;
            }
            checkLines.push(nextLine);
          }
          
          // Check if any of these lines contain the old date
          const combinedText = checkLines.join(' ');
          if (combinedText.includes(`@{${task.date}}`)) {
            taskLineIndex = i;
            foundTask = true;
            break;
          }
        }
      }
      
      if (!foundTask) {
        console.error('Task not found in file:', task.description);
        return false;
      }
      
      // Update the task line and subsequent lines
      let updated = false;
      
      // Update completion status
      if (updates.completed !== undefined) {
        const newStatus = updates.completed ? '- [x]' : '- [ ]';
        const oldStatus = task.completed ? '- [x]' : '- [ ]';
        lines[taskLineIndex] = lines[taskLineIndex].replace(oldStatus, newStatus);
        updated = true;
      }
      
      // Update description
      if (updates.description && updates.description !== task.description) {
        lines[taskLineIndex] = lines[taskLineIndex].replace(task.description, updates.description);
        updated = true;
      }
      
      // Update date and time in subsequent lines
      for (let i = taskLineIndex; i < Math.min(taskLineIndex + 4, lines.length); i++) {
        // Update date
        if (updates.date && updates.date !== task.date) {
          const oldDatePattern = new RegExp(`@\\{${task.date.replace(/[-]/g, '\\-')}\\}`, 'g');
          if (oldDatePattern.test(lines[i])) {
            lines[i] = lines[i].replace(oldDatePattern, `@{${updates.date}}`);
            updated = true;
          }
        }
        
        // Update time
        if (updates.time !== undefined) {
          if (task.time) {
            // Replace existing time
            const oldTimePattern = new RegExp(`@@\\{${task.time.replace(/[-:]/g, '\\$&')}\\}`, 'g');
            if (updates.time) {
              lines[i] = lines[i].replace(oldTimePattern, `@@{${updates.time}}`);
            } else {
              lines[i] = lines[i].replace(oldTimePattern, '');
            }
            updated = true;
          } else if (updates.time) {
            // Add new time
            if (lines[i].includes(`@{${task.date}}`)) {
              lines[i] = lines[i] + ` @@{${updates.time}}`;
              updated = true;
            }
          }
        }
      }
      
      if (!updated) {
        console.error('No updates were applied');
        return false;
      }
      
      // Write the updated content back to the file
      const updatedContent = lines.join('\n');
      await this.vault.modify(file, updatedContent);
      
      console.log('Task updated successfully in file');
      return true;
      
    } catch (error) {
      console.error('Error updating task in file:', error);
      return false;
    }
  }

  async addNewTaskToFile(filePath: string, taskDescription: string, date: string, time?: string, tags: string[] = []): Promise<boolean> {
    try {
      console.log(`Adding new task "${taskDescription}" to file ${filePath}`);
      
      const file = this.vault.getAbstractFileByPath(filePath);
      if (!(file instanceof TFile)) {
        console.error('File not found:', filePath);
        return false;
      }

      const content = await this.vault.read(file);
      const lines = content.split('\n');
      
      // Find the first column (usually "## Doing" or similar)
      let insertIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('## ') && !lines[i].includes('done') && !lines[i].includes('Done')) {
          // Find the end of this section to insert the new task
          for (let j = i + 1; j < lines.length; j++) {
            if (lines[j].startsWith('## ')) {
              insertIndex = j;
              break;
            }
          }
          if (insertIndex === -1) {
            insertIndex = lines.length;
          }
          break;
        }
      }
      
      if (insertIndex === -1) {
        console.error('No suitable column found to add task');
        return false;
      }
      
      // Create the new task line
      let newTaskLine = `- [ ] **${taskDescription}**`;
      
      // Add tags and date on the next line
      let metaLine = '';
      if (tags.length > 0) {
        metaLine += tags.map(tag => tag.startsWith('#') ? tag : `#${tag}`).join(' ') + ' ';
      }
      metaLine += `@{${date}}`;
      if (time) {
        metaLine += ` @@{${time}}`;
      }
      
      // Insert the new task
      lines.splice(insertIndex, 0, newTaskLine, `\t${metaLine}`);
      
      // Write back to file
      const updatedContent = lines.join('\n');
      await this.vault.modify(file, updatedContent);
      
      console.log('New task added successfully to file');
      return true;
      
    } catch (error) {
      console.error('Error adding new task to file:', error);
      return false;
    }
  }
}
