"""
Game entities and objects
"""

class Entity:
    """Base entity class"""
    
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y
        self.active = True
        
    def update(self):
        """Update entity logic"""
        pass
        
    def render(self):
        """Render entity"""
        pass


class Player(Entity):
    """Player entity"""
    
    def __init__(self, x=0, y=0):
        super().__init__(x, y)
        self.health = 100
        self.score = 0
        
    def move(self, dx, dy):
        """Move player by dx, dy"""
        self.x += dx
        self.y += dy