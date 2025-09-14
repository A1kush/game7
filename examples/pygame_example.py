#!/usr/bin/env python3
"""
Simple Pygame Example Game
Demonstrates the workspace structure usage
"""

import sys
import os
import pygame

# Add src to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from game.core import GameEngine
from game.entities import Player
from game.systems import RenderSystem, InputSystem
from utils import Vector2


class PygameExample(GameEngine):
    """Example game using Pygame"""
    
    def __init__(self):
        super().__init__(800, 600, "Game7 - Pygame Example")
        self.clock = None
        self.screen = None
        self.player = None
        self.render_system = None
        self.input_system = None
        
    def initialize(self):
        """Initialize Pygame and game objects"""
        pygame.init()
        self.screen = pygame.display.set_mode((self.width, self.height))
        pygame.display.set_caption(self.title)
        self.clock = pygame.time.Clock()
        
        # Initialize game objects
        self.player = Player(self.width // 2, self.height // 2)
        self.render_system = RenderSystem()
        self.input_system = InputSystem()
        
        self.running = True
        print(f"Initialized {self.title}")
        
    def update(self):
        """Update game logic"""
        # Handle events
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False
                
        # Handle input
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT] or keys[pygame.K_a]:
            self.player.move(-5, 0)
        if keys[pygame.K_RIGHT] or keys[pygame.K_d]:
            self.player.move(5, 0)
        if keys[pygame.K_UP] or keys[pygame.K_w]:
            self.player.move(0, -5)
        if keys[pygame.K_DOWN] or keys[pygame.K_s]:
            self.player.move(0, 5)
            
        # Keep player on screen
        self.player.x = max(25, min(self.width - 25, self.player.x))
        self.player.y = max(25, min(self.height - 25, self.player.y))
        
    def render(self):
        """Render game graphics"""
        # Clear screen
        self.screen.fill((20, 20, 40))
        
        # Draw player
        pygame.draw.circle(self.screen, (255, 255, 255), 
                         (int(self.player.x), int(self.player.y)), 25)
        
        # Draw instructions
        if pygame.font.get_init():
            font = pygame.font.Font(None, 36)
            text = font.render("Use WASD or Arrow Keys to Move", True, (255, 255, 255))
            self.screen.blit(text, (10, 10))
        
        pygame.display.flip()
        self.clock.tick(60)
        
    def quit(self):
        """Quit the game"""
        self.running = False
        pygame.quit()


def main():
    """Main function"""
    try:
        import pygame
    except ImportError:
        print("Pygame not installed. Install with: pip install pygame")
        return
        
    game = PygameExample()
    
    try:
        game.run()
    except KeyboardInterrupt:
        print("\nGame interrupted by user")
    finally:
        game.quit()


if __name__ == "__main__":
    main()