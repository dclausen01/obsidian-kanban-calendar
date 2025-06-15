# Testing the Obsidian Kanban Calendar Plugin

## Quick Test Setup

### 1. Install the Plugin in Obsidian

1. Copy the plugin files to your Obsidian vault:
   ```bash
   cp -r /home/alarm/Projekte/obsidian-kanban-calendar /path/to/your/vault/.obsidian/plugins/
   ```

2. Restart Obsidian

3. Go to Settings → Community Plugins → Enable "Kanban Calendar"

### 2. Create Test Data

Create a test markdown file in your vault with this content:

```markdown
---
kanban-plugin: board
---

## Doing

- [ ] **Abi-Prüfungen finalisieren**
  #Unterricht @{2025-06-20}
- [ ] **Nachbereitung FoBi systemische Beratung**
  - [x] Evaluation verschicken
  - [x] TaskCards aktualisieren 
  - [ ] TN-Zertifikate drucken
  #Fortbildungen @{2025-06-18} @@{14:30}
- [ ] **Wintergartendachreinigung anrufen**
  #privat @{2025-05-26}

## To Do

- [ ] **Hausaufgaben-Abgaben Forms**
  - [ ] BGG24 (mit Aufg. 1)
  - [ ] BGWT24 
  #Unterricht @{2025-05-20}
- [ ] **Foto für Website**
  #AL @{2025-03-24}
- [ ] **Bewertung Sartre Essenz&Existenz BGG24**
  - [ ] Livanur Cig
  #Unterricht @{2025-06-25}

## Done

- [x] **Medikamente bei der Apotheke abholen**
  #privat @{2025-06-05}
- [x] **Blockungen Abiturprüfungen**
  #Unterricht @{2025-06-03}
```

### 3. Test the Plugin

1. **Open the Calendar**:
   - Click the calendar icon in the ribbon, OR
   - Use Cmd/Ctrl+P and search for "Open Kanban Calendar"

2. **Test Different Views**:
   - Switch between Week, Month, and Year views
   - Navigate between different time periods

3. **Test Task Interaction**:
   - Click on tasks to see the detail modal
   - Verify that task information is displayed correctly
   - Check that tags are color-coded

4. **Test Settings**:
   - Go to Settings → Plugin Options → Kanban Calendar
   - Try different default views
   - Test the default Kanban board setting

### 4. Expected Behavior

- **Tasks with dates** should appear in the calendar on the correct dates
- **Tasks with times** should show the time in the task display
- **Completed tasks** should appear with strikethrough and different styling
- **Tags** should be displayed with color-coded labels
- **Task modal** should show all task details when clicked
- **Navigation** should work smoothly between different views and time periods

### 5. Common Issues and Solutions

**Plugin doesn't appear in settings:**
- Make sure you copied all files including `manifest.json`
- Restart Obsidian completely
- Check that the plugin folder is named correctly

**No tasks showing in calendar:**
- Verify your markdown file has the correct date format: `@{YYYY-MM-DD}`
- Check that tasks are properly formatted with `- [ ]` or `- [x]`
- Try setting a specific file in the plugin settings

**Build errors during development:**
- Run `npm install` to ensure all dependencies are installed
- Check that you're in the correct directory
- Verify TypeScript and Node.js versions are compatible

**Calendar not displaying correctly:**
- Check browser console for JavaScript errors
- Verify that React components are loading properly
- Test in different Obsidian themes

### 6. Development Testing

If you're developing the plugin:

```bash
# Start development mode with hot reload
npm run dev

# Build for production
npm run build

# Check for TypeScript errors
npx tsc --noEmit
```

### 7. Performance Testing

- Test with large numbers of tasks (100+)
- Test with multiple Kanban files
- Test calendar navigation speed
- Monitor memory usage during extended use

## Feedback

If you encounter any issues during testing, please note:
- Your Obsidian version
- Operating system
- Specific steps to reproduce the issue
- Any error messages in the console
