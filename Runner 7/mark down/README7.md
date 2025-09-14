# 🗡️ A1 Runner - Enhanced Game Assets 🗡️

## Overview

A1 Runner is an enhanced action RPG runner game featuring DBZ/Solo Leveling style effects and a chibi-themed UI. This version has been completely reorganized and optimized for better performance and maintainability.

## 🚀 Quick Start

1. Open `index.html` in a web browser
2. The game will automatically initialize with the merged JavaScript file
3. Use the controls below to play the game

## 🎮 Controls

### Keyboard Controls

- **1-5**: Use sword skills (S1-S5)
  - **1**: Slash Wave (Ranged attack)
  - **2**: Dark Aura Combo (Combo attack)
  - **3**: Steal Breaker (Counter attack)
  - **4**: Big Aura Slash (Ultimate attack)
  - **5**: Omega Slasher (Rage attack)

### UI Controls

- **I**: Toggle Inventory panel
- **C**: Toggle Character panel
- **S**: Toggle Skills panel
- **F3**: Toggle Debug console

### Mouse Controls

- **Left Click**: Create visual effects at cursor position
- **Right Click**: Context menu (planned feature)

## 📁 New File Structure

```
assets/man/                    # Main working directory
├── assets/                    # Organized game assets
│   └── js/
│       └── a1_runner_merged.js    # Single merged JavaScript file
├── stuff/                     # Old/duplicate files moved here
│   ├── manifest4.json
│   ├── manifest5.json
│   └── manifestassets.json
├── master_manifest.json       # Consolidated manifest with all game data
├── index.html                # Main game HTML file
├── manifest.json             # Original manifest (kept for compatibility)
├── a1_effects_manifest.json  # A1 sword effects data
├── attack_effects_manifest.json # Attack effects data
└── package.json              # Dependencies and scripts
```

## 🔧 Key Improvements

### 1. **Merged JavaScript**

- All JavaScript files combined into `a1_runner_merged.js`
- Reduces HTTP requests and improves loading performance
- Maintains modular structure with clear separation of concerns

### 2. **Consolidated Manifests**

- `master_manifest.json` contains all game configuration
- Eliminates redundancy between multiple manifest files
- Single source of truth for all game assets and settings

### 3. **Organized Asset Structure**

- Clean separation of active assets vs. unused files
- `stuff/` folder contains duplicates and deprecated files
- Better file organization for easier maintenance

### 4. **Enhanced UI System**

- Complete UI overhaul with DBZ/Solo Leveling theme
- Responsive panels for inventory, character, and skills
- Real-time HUD with health, mana, and XP bars

## 🎯 Game Systems

### Combat System

- **5 Sword Skills**: Each with unique effects and cooldowns
- **Visual Effects**: Dynamic particle effects for all attacks
- **Combo System**: Chain attacks for maximum damage

### Character System

- **Stats Tracking**: Level, HP, MP, Attack, Defense, Speed
- **Equipment**: Weapon, Armor, and Accessory slots
- **Progression**: XP system with visual progress bars

### Inventory System

- **20 Slot Grid**: Expandable inventory system
- **Item Categories**: Equipment, consumables, materials, quest items
- **Drag & Drop**: Intuitive item management (planned)

### Effects System

- **Particle Engine**: Custom particle system for visual effects
- **Aura System**: Character auras with multiple styles
- **Animation Framework**: Smooth effect transitions and scaling

## 🛠️ Development Features

### Debug Console (F3)

- Real-time effect monitoring
- Performance metrics display
- Effect spawning tools
- Active effects list

### Performance Optimization

- Single JavaScript file reduces load time
- Efficient asset loading with caching
- Optimized rendering loop
- Memory management for effects

## 🎨 Asset Categories

### Characters

- **A1**: Main character with sword skills
- **Missy**: Mage character with magical abilities
- **Unique**: Special character variant

### Visual Effects

- **Auras**: 20+ different aura effects
- **Attack Effects**: Elemental attacks (Fire, Ice, Lightning, Dark)
- **UI Effects**: Button highlights, panel transitions
- **Background**: Animated backgrounds and environments

### Audio (Planned)

- Skill sound effects
- Background music
- UI interaction sounds

## 🔍 Configuration

The `master_manifest.json` file contains all game configuration:

```json
{
  "game_systems": {
    "sword_skills": {
      /* Skill definitions */
    },
    "attack_effects": {
      /* Effect definitions */
    },
    "inventory": {
      /* Inventory settings */
    },
    "stats": {
      /* Character stats */
    }
  },
  "controls": {
    /* Key bindings */
  },
  "development": {
    /* Debug settings */
  }
}
```

## 🚧 Development Notes

### Building

- No build process required - ready to run
- All assets are referenced with relative paths
- Compatible with local file system and web servers

### Testing

- Playwright tests configured in `package.json`
- Smoke tests available: `npm run test:smoke`
- Debug mode: `npm run test:headed`

### Future Enhancements

- Audio system integration
- Multiplayer functionality
- Save/load system
- More character classes
- Additional skill trees

## 📋 File Cleanup Summary

### Moved to `stuff/` folder:

- `manifest4.json` - Duplicate character assets
- `manifest5.json` - Empty/unused manifest
- `manifestassets.json` - Redundant UI asset definitions

### Kept in main directory:

- `manifest.json` - Core game manifest
- `a1_effects_manifest.json` - A1 sword effects
- `attack_effects_manifest.json` - Attack effect definitions
- `master_manifest.json` - New consolidated manifest

## 🎮 How to Play

1. **Launch Game**: Open `index.html` in your browser
2. **Learn Controls**: Check the controls panel (top-left)
3. **Use Skills**: Press 1-5 to unleash powerful attacks
4. **Manage Character**: Use I, C, S keys to access different panels
5. **Debug**: Press F3 to see behind-the-scenes information
6. **Enjoy Effects**: Click anywhere to create visual effects

## 🌟 Credits

- **Developer**: A1K
- **Version**: 2.7.0 (Merged & Optimized)
- **Theme**: DBZ/Solo Leveling Chibi Style
- **Engine**: Custom HTML5 Canvas with JavaScript

---

**Enjoy your enhanced A1 Runner experience! 🗡️⚡🔥**
