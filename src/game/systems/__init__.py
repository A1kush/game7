"""
Game systems (physics, rendering, audio, etc.)
"""

class System:
    """Base system class"""
    
    def __init__(self):
        self.enabled = True
        
    def update(self):
        """Update system"""
        pass


class RenderSystem(System):
    """Rendering system"""
    
    def __init__(self):
        super().__init__()
        
    def render(self, entities):
        """Render all entities"""
        for entity in entities:
            if entity.active:
                entity.render()


class InputSystem(System):
    """Input handling system"""
    
    def __init__(self):
        super().__init__()
        self.keys_pressed = set()
        
    def handle_input(self):
        """Handle input events"""
        pass