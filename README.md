# Obsidian Kanban Calendar Plugin

A calendar view plugin for Obsidian that displays tasks from Kanban boards with dates and times in a beautiful calendar interface.

## Features

- **Multiple Calendar Views**: Week, Month, and Year views
- **Kanban Integration**: Automatically parses tasks from Kanban board markdown files
- **Date & Time Support**: Displays tasks with dates (`@{YYYY-MM-DD}`) and optional times (`@@{HH:MM}`)
- **Tag Support**: Shows task tags with color-coded labels
- **Task Details**: Click on tasks to view detailed information in a modal
- **File Navigation**: Click on tasks to open the source Kanban board file
- **Theme Integration**: Seamlessly integrates with Obsidian's light and dark themes
- **Responsive Design**: Works on desktop and mobile devices

## Installation

### Manual Installation

1. Download the latest release from the GitHub releases page
2. Extract the files to your Obsidian vault's plugins folder: `VaultFolder/.obsidian/plugins/kanban-calendar/`
3. Reload Obsidian
4. Enable the plugin in Settings → Community Plugins

### Development Installation

1. Clone this repository into your vault's plugins folder:
   ```bash
   cd VaultFolder/.obsidian/plugins/
   git clone https://github.com/yourusername/obsidian-kanban-calendar.git
   cd obsidian-kanban-calendar
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Reload Obsidian and enable the plugin

## Usage

### Kanban Board Format

The plugin reads tasks from markdown files that follow this format:

```markdown
## Doing

- [ ] **Task with date**
  #tag1 #tag2 @{2025-06-15}
- [ ] **Task with date and time**
  #urgent @{2025-06-16} @@{14:30}
- [x] **Completed task**
  @{2025-06-14}

## To Do

- [ ] **Another task**
  @{2025-06-20}
```

### Date and Time Format

- **Dates**: Use `@{YYYY-MM-DD}` format
- **Times**: Use `@@{HH:MM}` format (24-hour)
- **Tags**: Use standard hashtag format `#tagname`

### Opening the Calendar

- Click the calendar icon in the ribbon
- Use the command palette: "Open Kanban Calendar"
- Use the hotkey (if configured)

### Settings

Access plugin settings through Settings → Plugin Options → Kanban Calendar:

- **Default Kanban Board**: Specify a default file to read tasks from (leave empty to scan all files)
- **Default Calendar View**: Choose between Week, Month, or Year view
- **Show Completed Tasks**: Toggle visibility of completed tasks
- **Date Format**: Configure the date format used in your Kanban boards

## Development

### Project Structure

```
├── main.ts                 # Main plugin class
├── calendar-view.ts        # Obsidian view integration
├── calendar-component.tsx  # React calendar component
├── kanban-parser.ts        # Kanban board parser
├── types.ts               # TypeScript type definitions
├── styles.css             # Plugin styles
├── manifest.json          # Plugin manifest
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript configuration
└── esbuild.config.mjs     # Build configuration
```

### Building

```bash
# Development build with watch mode
npm run dev

# Production build
npm run build
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Compatibility

- **Obsidian**: Requires Obsidian v0.15.0 or higher
- **Platforms**: Desktop and mobile
- **Themes**: Compatible with all Obsidian themes

## License

MIT License - see LICENSE file for details

## Support

If you encounter any issues or have feature requests, please:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Include your Obsidian version and plugin version

## Roadmap

- [ ] Drag & drop to reschedule tasks
- [ ] Recurring task support
- [ ] Calendar export functionality
- [ ] Integration with other task management plugins
- [ ] Custom date formats
- [ ] Task filtering and search

## Acknowledgments

- Built with React and TypeScript
- Uses Obsidian's plugin API
- Inspired by the Kanban plugin by mgmeyers
