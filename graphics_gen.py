#!/usr/bin/env python3
"""
Game7 - Graphics Generation Module

This module generates procedural graphics for the game including:
- Item icons with chibi vibes
- Character sprites and animations
- UI elements and effects
- Aura effects for solo leveling style

Note: Using ASCII art and text-based graphics due to PIL dependency issues.
We'll implement a fallback system that can work without external image libraries.
"""

import json
import math
import random
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum


class IconStyle(Enum):
    """Different icon styles available"""

    CHIBI = "chibi"
    PIXEL = "pixel"
    FLAT = "flat"
    ANIME = "anime"


class ItemRarity(Enum):
    """Item rarity levels"""

    COMMON = "common"
    UNCOMMON = "uncommon"
    RARE = "rare"
    EPIC = "epic"
    LEGENDARY = "legendary"


@dataclass
class Color:
    """RGB color representation"""

    r: int
    g: int
    b: int
    a: int = 255

    def to_hex(self) -> str:
        """Convert to hex color string"""
        return f"#{self.r:02x}{self.g:02x}{self.b:02x}"

    def to_rgba(self) -> str:
        """Convert to RGBA string"""
        return f"rgba({self.r},{self.g},{self.b},{self.a/255:.2f})"


@dataclass
class AsciiSprite:
    """ASCII-based sprite representation"""

    width: int
    height: int
    frames: List[List[str]]  # List of frames, each frame is list of lines
    colors: Dict[str, Color]  # Character to color mapping
    animation_speed: float = 1.0

    def get_frame(self, frame_index: int) -> List[str]:
        """Get a specific frame"""
        if not self.frames:
            return []
        return self.frames[frame_index % len(self.frames)]

    def to_svg(self, frame_index: int = 0, scale: int = 1) -> str:
        """Convert ASCII sprite to SVG"""
        frame = self.get_frame(frame_index)
        if not frame:
            return ""

        svg_lines = [
            f'<svg width="{self.width * scale * 8}" height="{self.height * scale * 12}" '
            f'xmlns="http://www.w3.org/2000/svg">'
        ]

        for y, line in enumerate(frame):
            for x, char in enumerate(line):
                if char != " " and char in self.colors:
                    color = self.colors[char]
                    svg_lines.append(
                        f'<rect x="{x * scale * 8}" y="{y * scale * 12}" '
                        f'width="{scale * 8}" height="{scale * 12}" '
                        f'fill="{color.to_hex()}" />'
                    )
                    # Add character text
                    svg_lines.append(
                        f'<text x="{x * scale * 8 + scale * 4}" y="{y * scale * 12 + scale * 8}" '
                        f'fill="white" font-family="monospace" font-size="{scale * 10}" '
                        f'text-anchor="middle">{char}</text>'
                    )

        svg_lines.append("</svg>")
        return "\n".join(svg_lines)


class GraphicsGenerator:
    """Main graphics generation system"""

    def __init__(self):
        self.color_palettes = self._init_color_palettes()
        self.sprite_templates = self._init_sprite_templates()

    def _init_color_palettes(self) -> Dict[str, Dict[str, Color]]:
        """Initialize color palettes for different themes"""
        return {
            "chibi": {
                "primary": Color(255, 182, 193),  # Light pink
                "secondary": Color(255, 218, 185),  # Peach
                "accent": Color(173, 216, 230),  # Light blue
                "dark": Color(105, 105, 105),  # Dim gray
                "highlight": Color(255, 255, 255),  # White
            },
            "anime_aura": {
                "power": Color(255, 215, 0),  # Gold
                "energy": Color(138, 43, 226),  # Blue violet
                "rage": Color(255, 69, 0),  # Red orange
                "secret": Color(75, 0, 130),  # Indigo
                "heal": Color(50, 205, 50),  # Lime green
            },
            "rarity": {
                ItemRarity.COMMON.value: Color(128, 128, 128),  # Gray
                ItemRarity.UNCOMMON.value: Color(30, 144, 255),  # Dodger blue
                ItemRarity.RARE.value: Color(148, 0, 211),  # Dark violet
                ItemRarity.EPIC.value: Color(255, 140, 0),  # Dark orange
                ItemRarity.LEGENDARY.value: Color(255, 215, 0),  # Gold
            },
        }

    def _init_sprite_templates(self) -> Dict[str, List[str]]:
        """Initialize ASCII sprite templates"""
        return {
            "sword": [
                "  /|  ",
                " / |  ",
                "/  |  ",
                "   |  ",
                "   |  ",
                "  /+\\ ",
                " /___\\",
            ],
            "gun": [
                "======",
                " ||||  ",
                "======",
                "   ||  ",
                "  (##) ",
                "   ||  ",
                "       ",
            ],
            "potion": [
                "  ()  ",
                " /--\\ ",
                "|    |",
                "|~~~~|",
                "|~~~~|",
                " \\__/ ",
                "      ",
            ],
            "gem": [
                "  /\\  ",
                " /  \\ ",
                "/____\\",
                "\\    /",
                " \\  / ",
                "  \\/  ",
                "      ",
            ],
            "shield": [
                "  /\\  ",
                " /  \\ ",
                "|    |",
                "|    |",
                " \\  / ",
                "  \\/  ",
                "      ",
            ],
            "character_a1": [
                "  (O)  ",
                " /||\\ ",
                "  ||   ",
                " /||\\  ",
                "/    \\ ",
                "|    | ",
                "L    J ",
            ],
            "character_unique": [
                "  (*)  ",
                " <||>  ",
                "  ||   ",
                " ≈||≈  ",
                "≈    ≈ ",
                "|    | ",
                "L    J ",
            ],
            "character_missy": [
                "  (♥)  ",
                " ~||~  ",
                "  ||   ",
                " ♪||♪  ",
                "♪    ♪ ",
                "|    | ",
                "L    J ",
            ],
            "aura_power": [
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
            ],
            "aura_rage": [
                "!!!!!!!!",
                "!!!!!!!!",
                "!!!!!!!!",
                "!!!!!!!!",
                "!!!!!!!!",
                "!!!!!!!!",
                "!!!!!!!!",
            ],
        }

    def generate_item_icon(
        self,
        item_type: str,
        rarity: ItemRarity = ItemRarity.COMMON,
        style: IconStyle = IconStyle.CHIBI,
    ) -> AsciiSprite:
        """Generate an item icon"""
        template = self.sprite_templates.get(item_type, self.sprite_templates["gem"])

        # Create color mapping based on rarity and style
        colors = {}
        rarity_color = self.color_palettes["rarity"][rarity.value]

        if style == IconStyle.CHIBI:
            base_colors = self.color_palettes["chibi"]
            colors = {
                "/": rarity_color,
                "\\": rarity_color,
                "|": base_colors["primary"],
                "-": base_colors["secondary"],
                "=": rarity_color,
                "#": base_colors["dark"],
                "~": base_colors["accent"],
                "+": base_colors["highlight"],
                "_": base_colors["dark"],
                "(": rarity_color,
                ")": rarity_color,
                "O": base_colors["highlight"],
                "*": rarity_color,
                "♥": Color(255, 20, 147),  # Deep pink
                "♪": Color(138, 43, 226),  # Blue violet
            }

        return AsciiSprite(
            width=len(template[0]) if template else 7,
            height=len(template),
            frames=[template],
            colors=colors,
        )

    def generate_character_sprite(
        self, character_class: str, with_aura: bool = False
    ) -> AsciiSprite:
        """Generate a character sprite"""
        char_key = f"character_{character_class.lower()}"
        template = self.sprite_templates.get(
            char_key, self.sprite_templates["character_a1"]
        )

        # Base character colors
        colors = {
            "(": Color(255, 218, 185),  # Skin tone
            ")": Color(255, 218, 185),
            "O": Color(0, 0, 0),  # Eyes
            "*": Color(138, 43, 226),  # Unique eyes
            "♥": Color(255, 20, 147),  # Missy eyes
            "|": Color(139, 69, 19),  # Brown clothing
            "/": Color(139, 69, 19),
            "\\": Color(139, 69, 19),
            "<": Color(70, 130, 180),  # Blue details
            ">": Color(70, 130, 180),
            "≈": Color(138, 43, 226),  # Purple effects
            "~": Color(255, 20, 147),  # Pink effects
            "♪": Color(255, 215, 0),  # Gold notes
            "L": Color(101, 67, 33),  # Brown boots
            "J": Color(101, 67, 33),
        }

        frames = [template]

        # Add aura frames if requested
        if with_aura:
            aura_template = self.sprite_templates["aura_power"]
            aura_colors = self.color_palettes["anime_aura"]

            # Combine character with aura
            combined_frame = []
            for i in range(max(len(template), len(aura_template))):
                char_line = template[i] if i < len(template) else " " * len(template[0])
                aura_line = (
                    aura_template[i]
                    if i < len(aura_template)
                    else " " * len(aura_template[0])
                )

                # Merge lines (aura as background)
                combined_line = ""
                for j in range(max(len(char_line), len(aura_line))):
                    char_char = char_line[j] if j < len(char_line) else " "
                    aura_char = aura_line[j] if j < len(aura_line) else " "

                    # Character takes priority over aura
                    combined_line += char_char if char_char != " " else aura_char

                combined_frame.append(combined_line)

            frames.append(combined_frame)

            # Add aura colors
            colors.update(
                {
                    "≈": aura_colors["power"],
                    "!": aura_colors["rage"],
                }
            )

        return AsciiSprite(
            width=max(len(line) for line in template) if template else 7,
            height=len(template),
            frames=frames,
            colors=colors,
            animation_speed=2.0 if with_aura else 1.0,
        )

    def generate_skill_effect(
        self, skill_name: str, character_class: str
    ) -> AsciiSprite:
        """Generate visual effect for a skill"""
        effects = {
            "umbral_crescent": [
                "   /~~~\\   ",
                "  /     \\  ",
                " (       ) ",
                "  \\     /  ",
                "   \\___/   ",
            ],
            "vortex_cross": [
                " \\ | / ",
                "  \\|/  ",
                "--( )--",
                "  /|\\  ",
                " / | \\ ",
            ],
            "mirror_reversal": [
                "|||||||",
                "|||||||",
                "|||||||",
                "|||||||",
                "|||||||",
            ],
            "scatter_bloom": [
                " * * * ",
                "* * * *",
                " * * * ",
                "* * * *",
                " * * * ",
            ],
            "drone_command": [
                "[===]",
                " ||| ",
                "[===]",
                "     ",
                "[===]",
                " ||| ",
                "[===]",
            ],
        }

        effect_key = skill_name.lower().replace(" ", "_")
        template = effects.get(effect_key, effects["vortex_cross"])

        # Colors based on character class
        if character_class.lower() == "a1":
            colors = {
                "/": Color(138, 43, 226),  # Purple
                "\\": Color(138, 43, 226),
                "~": Color(75, 0, 130),  # Indigo
                "_": Color(75, 0, 130),
                "(": Color(255, 255, 255),  # White
                ")": Color(255, 255, 255),
                "|": Color(138, 43, 226),
                "-": Color(255, 255, 255),
            }
        elif character_class.lower() == "unique":
            colors = {
                "*": Color(0, 255, 255),  # Cyan
                "[": Color(0, 191, 255),  # Deep sky blue
                "]": Color(0, 191, 255),
                "=": Color(0, 191, 255),
                "|": Color(135, 206, 235),  # Sky blue
            }
        else:  # Missy
            colors = {
                "♪": Color(255, 215, 0),  # Gold
                "♥": Color(255, 20, 147),  # Deep pink
                "~": Color(255, 182, 193),  # Light pink
                "*": Color(255, 215, 0),
            }

        return AsciiSprite(
            width=max(len(line) for line in template),
            height=len(template),
            frames=[template],
            colors=colors,
        )

    def generate_ui_element(
        self, element_type: str, width: int = 10, height: int = 3
    ) -> AsciiSprite:
        """Generate UI elements like buttons, bars, etc."""
        if element_type == "button":
            template = [
                "+" + "-" * (width - 2) + "+",
                "|" + " " * (width - 2) + "|",
                "+" + "-" * (width - 2) + "+",
            ]
        elif element_type == "health_bar":
            template = [
                "[" + "=" * (width - 2) + "]",
            ]
        elif element_type == "skill_cooldown":
            template = []
            for i in range(height):
                if i == 0 or i == height - 1:
                    template.append("+" + "-" * (width - 2) + "+")
                else:
                    template.append("|" + " " * (width - 2) + "|")
        else:
            template = ["?" * width for _ in range(height)]

        colors = {
            "+": Color(128, 128, 128),
            "-": Color(128, 128, 128),
            "|": Color(128, 128, 128),
            "=": Color(0, 255, 0),  # Green for health
            "[": Color(64, 64, 64),
            "]": Color(64, 64, 64),
            "?": Color(255, 0, 0),
        }

        return AsciiSprite(width=width, height=height, frames=[template], colors=colors)

    def generate_aura_effect(self, aura_type: str = "power") -> AsciiSprite:
        """Generate anime-style aura effects"""
        aura_frames = []

        if aura_type == "power":
            # Pulsing golden aura
            frame1 = [
                " ≈≈≈≈≈ ",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                " ≈≈≈≈≈ ",
            ]
            frame2 = [
                "  ≈≈≈  ",
                " ≈≈≈≈≈ ",
                "≈≈≈≈≈≈≈",
                "≈≈≈≈≈≈≈",
                " ≈≈≈≈≈ ",
                "  ≈≈≈  ",
            ]
            aura_frames = [frame1, frame2]

        elif aura_type == "rage":
            # Intense red flame aura
            frame1 = [
                " !!! ",
                "!!!!!",
                "!!!!!",
                " !!! ",
            ]
            frame2 = [
                "  !  ",
                " !!! ",
                " !!! ",
                "  !  ",
            ]
            aura_frames = [frame1, frame2]

        colors = {
            "≈": self.color_palettes["anime_aura"]["power"],
            "!": self.color_palettes["anime_aura"]["rage"],
        }

        return AsciiSprite(
            width=max(len(line) for line in aura_frames[0]) if aura_frames else 7,
            height=len(aura_frames[0]) if aura_frames else 4,
            frames=aura_frames,
            colors=colors,
            animation_speed=3.0,
        )

    def export_sprite_sheet(
        self, sprites: Dict[str, AsciiSprite], filename: str = "sprites.json"
    ):
        """Export sprites to JSON format"""
        sprite_data = {}

        for name, sprite in sprites.items():
            sprite_data[name] = {
                "width": sprite.width,
                "height": sprite.height,
                "frames": sprite.frames,
                "colors": {
                    char: {"r": color.r, "g": color.g, "b": color.b, "a": color.a}
                    for char, color in sprite.colors.items()
                },
                "animation_speed": sprite.animation_speed,
            }

        with open(filename, "w") as f:
            json.dump(sprite_data, f, indent=2)

    def generate_complete_asset_pack(self) -> Dict[str, AsciiSprite]:
        """Generate a complete set of game assets"""
        assets = {}

        # Item icons
        item_types = ["sword", "gun", "potion", "gem", "shield"]
        rarities = list(ItemRarity)

        for item_type in item_types:
            for rarity in rarities:
                key = f"{item_type}_{rarity.value}"
                assets[key] = self.generate_item_icon(item_type, rarity)

        # Character sprites
        characters = ["a1", "unique", "missy"]
        for char in characters:
            assets[f"char_{char}"] = self.generate_character_sprite(char)
            assets[f"char_{char}_aura"] = self.generate_character_sprite(
                char, with_aura=True
            )

        # Skill effects
        skills = ["umbral_crescent", "vortex_cross", "scatter_bloom", "drone_command"]
        for skill in skills:
            assets[f"effect_{skill}"] = self.generate_skill_effect(skill, "a1")

        # UI elements
        assets["button"] = self.generate_ui_element("button")
        assets["health_bar"] = self.generate_ui_element("health_bar", 20, 1)
        assets["skill_cd"] = self.generate_ui_element("skill_cooldown", 8, 3)

        # Aura effects
        assets["aura_power"] = self.generate_aura_effect("power")
        assets["aura_rage"] = self.generate_aura_effect("rage")

        return assets


def main():
    """Demo function showing graphics generation"""
    print("Game7 Graphics Generator Demo")
    print("============================")

    generator = GraphicsGenerator()

    # Generate some sample assets
    print("\nGenerating item icons...")
    sword_icon = generator.generate_item_icon("sword", ItemRarity.LEGENDARY)
    print("Legendary Sword:")
    for line in sword_icon.frames[0]:
        print(line)

    print("\nGenerating character sprite...")
    a1_sprite = generator.generate_character_sprite("a1", with_aura=True)
    print("A1 with Power Aura:")
    for line in a1_sprite.frames[1]:  # Aura frame
        print(line)

    print("\nGenerating skill effect...")
    skill_effect = generator.generate_skill_effect("Umbral Crescent", "a1")
    print("Umbral Crescent Effect:")
    for line in skill_effect.frames[0]:
        print(line)

    # Generate complete asset pack
    print("\nGenerating complete asset pack...")
    assets = generator.generate_complete_asset_pack()
    print(f"Generated {len(assets)} assets")

    # Export to JSON
    generator.export_sprite_sheet(assets, "game_assets.json")
    print("Assets exported to game_assets.json")

    print("\nDemo complete!")


if __name__ == "__main__":
    main()
