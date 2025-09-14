# Game7 - Game Development Workspace

A comprehensive Python workspace for game development with modular architecture and organized structure.

## 🎮 Features

- **Modular Architecture**: Organized into core engine, entities, systems, and utilities
- **Asset Management**: Structured directories for images, sounds, fonts, and data
- **Example Games**: Ready-to-run examples demonstrating the workspace
- **Testing Suite**: Comprehensive tests for all components
- **Configuration**: Flexible JSON-based game configuration
- **Documentation**: Complete development guides and API documentation

## 📁 Project Structure

```
game7/
├── src/               # Source code
│   ├── game/         # Core game modules
│   │   ├── core/     # Game engine (GameEngine)
│   │   ├── entities/ # Game objects (Entity, Player)
│   │   └── systems/  # Game systems (RenderSystem, InputSystem)
│   └── utils/        # Utility functions (Vector2, math helpers)
├── assets/           # Game assets
│   ├── images/       # Graphics and sprites
│   ├── sounds/       # Audio files
│   ├── fonts/        # Custom fonts
│   └── data/         # Game data files
├── tests/            # Test suite
├── configs/          # Configuration files
├── docs/             # Documentation
├── examples/         # Example games
├── main.py           # Basic game entry point
└── requirements.txt  # Python dependencies
```

## 🚀 Quick Start

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/A1kush/game7.git
   cd game7
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

### Running Examples

Basic console game:
```bash
python main.py
```

Pygame example (requires pygame):
```bash
python examples/pygame_example.py
```

### Development

Run tests:
```bash
pytest tests/
```

Format code:
```bash
black src/ tests/
```

## 🛠 Usage

### Creating a Basic Game

```python
from src.game.core import GameEngine
from src.game.entities import Player

class MyGame(GameEngine):
    def __init__(self):
        super().__init__(800, 600, "My Game")
        self.player = Player(400, 300)
    
    def update(self):
        # Update game logic
        self.player.update()
    
    def render(self):
        # Render game
        print(f"Player at ({self.player.x}, {self.player.y})")

game = MyGame()
game.run()
```

### Using Utilities

```python
from src.utils import Vector2, distance, clamp

# Vector math
pos = Vector2(10, 20)
velocity = Vector2(1, -1).normalize()

# Helper functions
dist = distance(0, 0, 10, 10)  # Calculate distance
value = clamp(150, 0, 100)     # Clamp to range
```

## 📖 Documentation

- See `docs/README.md` for detailed development guide
- Check `examples/` for practical usage examples
- Review `tests/` for component specifications

## 🎯 Components

### Core Engine
- **GameEngine**: Main game loop and state management
- **Entity**: Base class for all game objects
- **Player**: Extended entity with game-specific features

### Systems
- **RenderSystem**: Handles graphics rendering
- **InputSystem**: Manages user input

### Utilities
- **Vector2**: 2D vector mathematics
- **Math helpers**: Distance, clamping, interpolation functions

## 🔧 Configuration

Game settings can be customized in `configs/game_config.json`:

```json
{
    "window": {
        "width": 800,
        "height": 600,
        "title": "Game7"
    },
    "graphics": {
        "fps": 60
    },
    "controls": {
        "move_up": "w",
        "move_down": "s"
    }
}
```

## 🧪 Testing

The workspace includes comprehensive tests for all components:

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_core.py

# Run with coverage
pytest tests/ --cov=src
```

## 📦 Dependencies

- **pygame**: For graphics and input (optional)
- **numpy**: For advanced mathematical operations
- **pytest**: For testing
- **black**: For code formatting

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is open source. Feel free to use and modify for your game development needs.

---

**Ready to build your next game? Start with the examples and build upon the modular foundation!** 🎮✨
