#!/usr/bin/env python3
"""
Main entry point for Game7
"""

import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from game.core import GameEngine


def main():
    """Main function"""
    game = GameEngine(
        width=800,
        height=600,
        title="Game7 - Basic Example"
    )
    
    try:
        game.run()
    except KeyboardInterrupt:
        print("\nGame interrupted by user")
    finally:
        game.quit()


if __name__ == "__main__":
    main()