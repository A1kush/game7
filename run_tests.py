#!/usr/bin/env python3
"""
Simple test runner for Game7 workspace (no pytest required)
"""

import sys
import os

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from game.core import GameEngine
from game.entities import Entity, Player
from utils import Vector2, distance, clamp, lerp


def test_game_engine():
    """Test the GameEngine class"""
    print("Testing GameEngine...")
    
    # Test initialization
    engine = GameEngine(1024, 768, "Test Game")
    assert engine.width == 1024
    assert engine.height == 768
    assert engine.title == "Test Game"
    assert engine.running == False
    print("  ✓ Engine initialization")
    
    # Test defaults
    engine2 = GameEngine()
    assert engine2.width == 800
    assert engine2.height == 600
    assert engine2.title == "Game7"
    print("  ✓ Engine defaults")


def test_entity():
    """Test the Entity class"""
    print("Testing Entity...")
    
    # Test creation
    entity = Entity(10, 20)
    assert entity.x == 10
    assert entity.y == 20
    assert entity.active == True
    print("  ✓ Entity creation")
    
    # Test defaults
    entity2 = Entity()
    assert entity2.x == 0
    assert entity2.y == 0
    assert entity2.active == True
    print("  ✓ Entity defaults")


def test_player():
    """Test the Player class"""
    print("Testing Player...")
    
    # Test creation
    player = Player(50, 100)
    assert player.x == 50
    assert player.y == 100
    assert player.health == 100
    assert player.score == 0
    print("  ✓ Player creation")
    
    # Test movement
    player.move(10, 5)
    assert player.x == 60
    assert player.y == 105
    print("  ✓ Player movement")


def test_utils():
    """Test utility functions"""
    print("Testing Utils...")
    
    # Test distance
    dist = distance(0, 0, 3, 4)
    assert dist == 5.0
    print("  ✓ Distance calculation")
    
    # Test clamp
    assert clamp(5, 0, 10) == 5
    assert clamp(-5, 0, 10) == 0
    assert clamp(15, 0, 10) == 10
    print("  ✓ Clamp function")
    
    # Test lerp
    assert lerp(0, 10, 0.5) == 5.0
    assert lerp(0, 10, 0.0) == 0.0
    assert lerp(0, 10, 1.0) == 10.0
    print("  ✓ Lerp function")
    
    # Test Vector2
    vec = Vector2(3, 4)
    assert vec.x == 3
    assert vec.y == 4
    assert vec.magnitude() == 5.0
    print("  ✓ Vector2 creation and magnitude")
    
    # Test Vector2 operations
    vec1 = Vector2(1, 2)
    vec2 = Vector2(3, 4)
    result = vec1 + vec2
    assert result.x == 4
    assert result.y == 6
    print("  ✓ Vector2 operations")


def run_all_tests():
    """Run all tests"""
    print("🧪 Running Game7 Workspace Tests\n")
    
    try:
        test_game_engine()
        test_entity()
        test_player()
        test_utils()
        
        print("\n✅ All tests passed!")
        print("🎮 Game7 Workspace is ready for development!")
        return True
        
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return False
    except Exception as e:
        print(f"\n💥 Error running tests: {e}")
        return False


if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)