export interface AppTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'social' | 'health' | 'commerce' | 'lifestyle' | 'utility';
  icon: string; // Lucide icon name
  color: string; // Tailwind color token (e.g. 'violet', 'emerald')
  prompt: string; // Full prompt sent to AI agent
}

export const APP_TEMPLATES: AppTemplate[] = [
  {
    id: 'todo-app',
    name: 'Task Manager',
    description: 'Todo list with categories, due dates, and priority levels',
    category: 'productivity',
    icon: 'CheckSquare',
    color: 'emerald',
    prompt: `Build a task manager mobile app with the following features:

1. **Home screen** showing tasks grouped by category (Work, Personal, Shopping, Health) with color-coded labels
2. **Add task** screen with fields for: title, description, category picker, due date picker, priority level (Low/Medium/High with color indicators)
3. **Task detail** screen showing full info with edit and delete options
4. **Completed tasks** tab showing finished items with completion timestamps
5. **Bottom tab navigation**: Tasks, Add, Completed

Design requirements:
- Clean minimal UI with card-based task items
- Swipe-to-complete gesture on task items
- Empty state illustrations when no tasks exist
- Use AsyncStorage for persistence
- Priority badges: green for Low, orange for Medium, red for High
- Smooth animations when adding/completing tasks
- Search bar at top of task list to filter tasks`,
  },
  {
    id: 'weather-app',
    name: 'Weather Dashboard',
    description: 'Beautiful weather app with forecasts and location search',
    category: 'utility',
    icon: 'CloudSun',
    color: 'sky',
    prompt: `Build a beautiful weather dashboard mobile app with the following features:

1. **Main screen** showing current weather with large temperature display, weather condition icon, humidity, wind speed, and "feels like" temperature
2. **Hourly forecast** horizontal scroll showing next 24 hours with icons and temps
3. **7-day forecast** section with daily high/low temps and weather icons
4. **Location search** screen where users can search for cities and save favorites
5. **Settings** screen for temperature unit toggle (Celsius/Fahrenheit) and saved locations

Design requirements:
- Dynamic gradient background that changes based on weather condition (sunny=warm gradient, rainy=cool gradient, night=dark gradient)
- Use LinearGradient for backgrounds
- Weather icons using Ionicons (sunny, cloudy, rainy, snowy, etc.)
- Card-based layout for forecast sections with glassmorphism effect using BlurView
- Use mock data (don't call any real API) with realistic weather values
- Smooth pull-to-refresh animation
- Store preferred locations and units in AsyncStorage`,
  },
  {
    id: 'fitness-tracker',
    name: 'Fitness Tracker',
    description: 'Workout logging with exercise library and progress charts',
    category: 'health',
    icon: 'Dumbbell',
    color: 'orange',
    prompt: `Build a fitness tracker mobile app with the following features:

1. **Dashboard** screen showing today's stats: calories burned, workouts completed, active minutes, with circular progress rings
2. **Workout log** screen with a list of completed workouts, each showing exercise name, duration, and calories
3. **Start workout** screen where users can pick from exercise categories (Strength, Cardio, Flexibility, HIIT) and log sets/reps or duration
4. **Exercise library** screen with searchable list of exercises, each with description and target muscle group icons
5. **Progress** screen showing weekly/monthly stats with bar charts for workouts per week
6. **Bottom tab navigation**: Dashboard, Workouts, Start, Library, Progress

Design requirements:
- Motivational color scheme (dark background with orange/amber accent colors)
- Circular progress indicators for daily goals
- Card-based workout items with exercise type icons
- Timer component for active workouts with start/pause/stop controls
- Use AsyncStorage to persist workout history
- Empty states with encouraging messages
- Animated progress rings using react-native-reanimated`,
  },
  {
    id: 'recipe-book',
    name: 'Recipe Book',
    description: 'Save and organize recipes with ingredients and step-by-step instructions',
    category: 'lifestyle',
    icon: 'ChefHat',
    color: 'amber',
    prompt: `Build a recipe book mobile app with the following features:

1. **Home screen** showing featured recipes in a horizontal carousel and categorized recipe grid (Breakfast, Lunch, Dinner, Desserts, Snacks)
2. **Recipe detail** screen with hero image, title, cook time, servings, difficulty badge, ingredients list with checkboxes, and numbered step-by-step instructions
3. **Add recipe** screen with form fields for: name, category, cook time, servings, difficulty, ingredients (dynamic add/remove), steps (dynamic add/remove)
4. **Favorites** screen showing bookmarked recipes in a masonry-style grid
5. **Search** screen with category filter chips and text search across recipe names
6. **Bottom tab navigation**: Home, Search, Add, Favorites

Design requirements:
- Warm color palette (cream, amber, brown tones)
- Large food placeholder images using colored gradient backgrounds (no real images needed)
- Card-based recipe items with cook time and difficulty badges
- Ingredient checkboxes that users can tick off while cooking
- Expandable instruction steps
- Use AsyncStorage for saving recipes and favorites
- Pull-to-refresh on home screen
- Smooth card press animations`,
  },
  {
    id: 'expense-tracker',
    name: 'Expense Tracker',
    description: 'Track spending with categories, budgets, and monthly reports',
    category: 'productivity',
    icon: 'Wallet',
    color: 'violet',
    prompt: `Build an expense tracker mobile app with the following features:

1. **Dashboard** screen showing: total spending this month, budget remaining (with progress bar), spending by category as a breakdown list, and recent transactions
2. **Add expense** screen with: amount (large number input), category picker (Food, Transport, Shopping, Bills, Entertainment, Health, Other), date picker, optional note
3. **Transaction history** screen with filterable list by date range and category, showing daily totals
4. **Budget settings** screen where users set monthly budget and per-category limits with visual indicators
5. **Monthly report** screen showing spending trends, top categories, and comparison with budget
6. **Bottom tab navigation**: Dashboard, Add, History, Budget, Report

Design requirements:
- Clean financial UI with violet/purple accent on dark background
- Large, easy-to-tap number pad for amount input
- Color-coded category icons (Food=orange, Transport=blue, Shopping=pink, etc.)
- Progress bars for budget usage (green under 70%, yellow 70-90%, red over 90%)
- Animated counter for total spending
- Use AsyncStorage for all transaction and budget data
- Currency formatting with proper decimal handling
- Swipe to delete transactions`,
  },
  {
    id: 'notes-app',
    name: 'Smart Notes',
    description: 'Rich note-taking with folders, tags, and search',
    category: 'productivity',
    icon: 'FileText',
    color: 'blue',
    prompt: `Build a smart notes mobile app with the following features:

1. **Notes list** screen with all notes displayed as cards showing title, preview text, date, and folder/tag badges. Support grid and list view toggle
2. **Note editor** screen with title input and multiline content area. Show character count, last edited timestamp, and folder/tag selectors
3. **Folders** screen showing user-created folders (Work, Personal, Ideas, Archive) with note counts and color labels
4. **Search** screen with full-text search across note titles and content, with recent searches
5. **Tags** screen showing all tags as chips with note counts, tap to filter
6. **Bottom tab navigation**: Notes, Folders, Add (floating action button), Tags, Search

Design requirements:
- Minimal clean design with subtle blue accents on dark background
- Card-based note items with subtle shadows
- Folder color selection (8 preset colors)
- Tag chips with rounded pill design
- Floating action button for quick note creation
- Pin notes to top of list
- Confirmation dialog before deleting notes
- Use AsyncStorage for all notes, folders, and tags
- Animated list reordering when pinning/unpinning
- Empty states for each section`,
  },
];

export function getTemplate(id: string): AppTemplate | undefined {
  return APP_TEMPLATES.find(t => t.id === id);
}

export function getTemplatesByCategory(category: string): AppTemplate[] {
  return APP_TEMPLATES.filter(t => t.category === category);
}

export const TEMPLATE_CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'health', label: 'Health' },
  { id: 'lifestyle', label: 'Lifestyle' },
  { id: 'utility', label: 'Utility' },
] as const;
