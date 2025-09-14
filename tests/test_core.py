"""
Test suite for Game7 core functionality
"""

import sys
import os
import pytest

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from game.core import GameEngine
from game.entities import Entity, Player
from utils import Vector2, distance, clamp, lerp


class TestGameEngine:
    """Test the GameEngine class"""
    
    def test_engine_initialization(self):
        """Test engine creates with correct parameters"""
        engine = GameEngine(1024, 768, "Test Game")
        assert engine.width == 1024
        assert engine.height == 768
        assert engine.title == "Test Game"
        assert engine.running == False
        
    def test_engine_defaults(self):
        """Test engine uses default parameters"""
        engine = GameEngine()
        assert engine.width == 800
        assert engine.height == 600
        assert engine.title == "Game7"


class TestEntity:
    """Test the Entity class"""
    
    def test_entity_creation(self):
        """Test entity creates with correct position"""
        entity = Entity(10, 20)
        assert entity.x == 10
        assert entity.y == 20
        assert entity.active == True
        
    def test_entity_defaults(self):
        """Test entity uses default values"""
        entity = Entity()
        assert entity.x == 0
        assert entity.y == 0
        assert entity.active == True


class TestPlayer:
    """Test the Player class"""
    
    def test_player_creation(self):
        """Test player creates with correct attributes"""
        player = Player(50, 100)
        assert player.x == 50
        assert player.y == 100
        assert player.health == 100
        assert player.score == 0
        
    def test_player_movement(self):
        """Test player movement"""
        player = Player(0, 0)
        player.move(10, 5)
        assert player.x == 10
        assert player.y == 5


class TestUtils:
    """Test utility functions"""
    
    def test_distance_calculation(self):
        """Test distance function"""
        dist = distance(0, 0, 3, 4)
        assert dist == 5.0
        
    def test_clamp_function(self):
        """Test clamp function"""
        assert clamp(5, 0, 10) == 5
        assert clamp(-5, 0, 10) == 0
        assert clamp(15, 0, 10) == 10
        
    def test_lerp_function(self):
        """Test linear interpolation"""
        assert lerp(0, 10, 0.5) == 5.0
        assert lerp(0, 10, 0.0) == 0.0
        assert lerp(0, 10, 1.0) == 10.0
        
    def test_vector2_creation(self):
        """Test Vector2 creation"""
        vec = Vector2(3, 4)
        assert vec.x == 3
        assert vec.y == 4
        
    def test_vector2_magnitude(self):
        """Test Vector2 magnitude calculation"""
        vec = Vector2(3, 4)
        assert vec.magnitude() == 5.0
        
    def test_vector2_addition(self):
        """Test Vector2 addition"""
        vec1 = Vector2(1, 2)
        vec2 = Vector2(3, 4)
        result = vec1 + vec2
        assert result.x == 4
        assert result.y == 6


if __name__ == "__main__":
    pytest.main([__file__])