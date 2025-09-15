# Game7 - Enhanced Action RPG

Game7 is an enhanced action RPG featuring a comprehensive Python backend, procedural graphics generation, and an advanced combat system with solo leveling-style visual effects.

## 🎮 Features

### Core Game Engine
- **6-Skill Combat System**: S1-S4 core skills, R1 Rage mode, X1 Secret skills
- **Character Classes**: A1 (Boss Slayer), Unique (Mob Slayer), Missy (Support/Loot)
- **Team Management**: Team HP system with revival mechanics
- **Character Progression**: Experience, leveling, and skill point system
- **Advanced Combat**: Damage calculation, critical hits, status effects

### S5 Ultimate Skills
- **A1 - Void Impale**: 35% HP cost, devastating single-target attack
- **Unique - Drone Overdrive**: 30% HP cost, kamikaze drone explosion
- **Missy - Sacrificial Gambit**: 25% team HP cost, team invulnerability + 100% crit

### Procedural Graphics
- **ASCII Art System**: Chibi-style item icons and character sprites
- **Dynamic Aura Effects**: Solo leveling-style power visualization
- **Skill Effects**: Visual representations of character abilities
- **Rarity-Based Coloring**: Items change appearance based on rarity
- **Animation Support**: Multi-frame sprite animations

### Web Integration
- **Python HTTP Server**: RESTful API for game state management
- **Real-time Sync**: Live synchronization between backend and frontend
- **Asset Serving**: Procedural asset generation and delivery
- **Enhanced HTML Client**: Improved game UI with new combat features

## 🚀 Quick Start

### Prerequisites
- Python 3.12.3+
- Modern web browser

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   pip3 install --user -r requirements.txt
   ```

### Running the Game
1. Start the web server:
   ```bash
   python3 web_server.py --port 8080
   ```
2. Open your browser to: `http://localhost:8080/`
3. Enjoy the enhanced combat system!

### Testing
Run the test suite:
```bash
python3 -m pytest -v
```

Run the feature demo:
```bash
python3 demo.py
```

## 🎯 Combat System

### Character Roles
- **🗡️ A1 (Boss Slayer)**: High single-target damage, sword combat with bullet deflection
- **🔫 Unique (Mob Slayer)**: Area damage, drone summons, piercing projectiles
- **⭐ Missy (Support/Loot)**: Team buffs, healing, loot bonuses

### Skill Types
- **S1-S4**: Core combat abilities with unique cooldowns
- **R1 (Rage)**: Manual activation for enhanced combat state
- **X1 (Secret)**: Ultimate abilities requiring special conditions
- **S5 (New)**: High-cost super skills with devastating effects

### Combat Mechanics
- **Crescendo System**: S5/X1 usage resets S1 & S2 cooldowns
- **Team HP**: Individual character health with revival system
- **Aura Effects**: Visual power indicators with anime-style presentation
- **Enhanced Attacks**: Character-specific combat animations

## 🎨 Graphics & Visual Effects

### Procedural Generation
- Dynamic item icon creation based on type and rarity
- Character sprites with customizable aura effects
- Skill effect visualizations
- UI element generation

### Solo Leveling Style Features
- Pulsing power auras (golden, flame effects)
- Dynamic visual feedback for character states
- Dramatic skill effect presentations
- Screen shake and particle effects

## 🌐 API Endpoints

### Game State
- `GET /api/game-state` - Complete game state
- `GET /api/team-status` - Team member status
- `GET /api/character-info?id=<char>` - Character details

### Actions
- `POST /api/use-skill` - Execute character skills
- `POST /api/switch-character` - Change active character
- `POST /api/gain-experience` - Add character experience
- `POST /api/defeat-character` - Handle character defeat
- `POST /api/revive-character` - Revive defeated characters

### Assets
- `GET /api/assets?type=<type>` - Procedural game assets
  - Types: `all`, `characters`, `items`, `effects`

## 🧪 Development

### Project Structure
```
game7/
├── main.py              # Original main application
├── game_engine.py       # Core game logic and character system
├── graphics_gen.py      # Procedural graphics generation
├── web_server.py        # HTTP server and API endpoints
├── test_game.html       # Enhanced HTML game client
├── demo.py              # Feature demonstration script
├── test_*.py            # Comprehensive test suite
└── requirements.txt     # Python dependencies
```

### Testing Strategy
- **Unit Tests**: Individual module functionality
- **Integration Tests**: API endpoint testing
- **Feature Tests**: Complete workflow validation
- **Demo Script**: Interactive feature showcase

## 🎉 Usage Examples

### Browser Console Commands
```javascript
// Test S5 skills for all characters
game.testS5()

// Manually use A1's S5 skill
game.useS5('A1')

// Show character aura effect
game.showAura('A1')

// Add experience to active character
game.api.useSkill(game.st.players[game.st.leader].id, 's1')
```

### Python API Usage
```python
from game_engine import GameEngine
from graphics_gen import GraphicsGenerator

# Initialize game
engine = GameEngine()
graphics = GraphicsGenerator()

# Use character skills
a1 = engine.get_character('A1')
a1.use_skill(SkillType.S1)

# Generate assets
assets = graphics.generate_complete_asset_pack()
```

## 📊 Performance

- **36 passing tests** with comprehensive coverage
- **40+ procedural assets** generated on demand
- **Real-time synchronization** between Python backend and JavaScript frontend
- **Minimal dependencies** for easy deployment

## 🎯 Future Enhancements

- [ ] Add WebSocket support for real-time multiplayer
- [ ] Implement more sophisticated AI enemy behaviors
- [ ] Expand procedural generation to include sound effects
- [ ] Add character customization and equipment systems
- [ ] Create mobile-responsive UI improvements

---

**Game7** - Where strategy meets style! 🎮✨
a1 7 stuff
