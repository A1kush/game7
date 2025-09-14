"""
Utility functions and helpers
"""

import math


def distance(x1, y1, x2, y2):
    """Calculate distance between two points"""
    return math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)


def clamp(value, min_val, max_val):
    """Clamp value between min and max"""
    return max(min_val, min(value, max_val))


def lerp(a, b, t):
    """Linear interpolation between a and b by factor t"""
    return a + t * (b - a)


class Vector2:
    """2D vector class"""
    
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y
        
    def __add__(self, other):
        return Vector2(self.x + other.x, self.y + other.y)
        
    def __sub__(self, other):
        return Vector2(self.x - other.x, self.y - other.y)
        
    def magnitude(self):
        return math.sqrt(self.x ** 2 + self.y ** 2)
        
    def normalize(self):
        mag = self.magnitude()
        if mag > 0:
            return Vector2(self.x / mag, self.y / mag)
        return Vector2(0, 0)