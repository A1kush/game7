#!/usr/bin/env python3
"""
Tests for graphics generation module
"""
from graphics_gen import GraphicsGenerator, AsciiSprite, Color, IconStyle, ItemRarity


def test_color_creation():
    """Test color creation and conversion"""
    color = Color(255, 128, 64, 200)
    assert color.r == 255
    assert color.g == 128
    assert color.b == 64
    assert color.a == 200

    hex_color = color.to_hex()
    assert hex_color == "#ff8040"

    rgba_color = color.to_rgba()
    assert "255" in rgba_color
    assert "128" in rgba_color
    assert "64" in rgba_color


def test_ascii_sprite_creation():
    """Test ASCII sprite creation"""
    frames = [["ABC", "DEF", "GHI"]]
    colors = {"A": Color(255, 0, 0), "B": Color(0, 255, 0)}

    sprite = AsciiSprite(
        width=3, height=3, frames=frames, colors=colors, animation_speed=2.0
    )

    assert sprite.width == 3
    assert sprite.height == 3
    assert len(sprite.frames) == 1
    assert sprite.animation_speed == 2.0

    frame = sprite.get_frame(0)
    assert frame == ["ABC", "DEF", "GHI"]


def test_graphics_generator_initialization():
    """Test graphics generator initializes correctly"""
    generator = GraphicsGenerator()

    assert "chibi" in generator.color_palettes
    assert "anime_aura" in generator.color_palettes
    assert "rarity" in generator.color_palettes

    assert "sword" in generator.sprite_templates
    assert "character_a1" in generator.sprite_templates
    assert "aura_power" in generator.sprite_templates


def test_item_icon_generation():
    """Test item icon generation"""
    generator = GraphicsGenerator()

    # Test different item types and rarities
    sword_icon = generator.generate_item_icon("sword", ItemRarity.COMMON)
    assert isinstance(sword_icon, AsciiSprite)
    assert sword_icon.width > 0
    assert sword_icon.height > 0
    assert len(sword_icon.frames) == 1

    legendary_gem = generator.generate_item_icon("gem", ItemRarity.LEGENDARY)
    assert isinstance(legendary_gem, AsciiSprite)
    # Legendary should have different colors than common
    assert len(legendary_gem.colors) > 0


def test_character_sprite_generation():
    """Test character sprite generation"""
    generator = GraphicsGenerator()

    # Test basic character sprite
    a1_sprite = generator.generate_character_sprite("a1")
    assert isinstance(a1_sprite, AsciiSprite)
    assert len(a1_sprite.frames) == 1
    assert a1_sprite.animation_speed == 1.0

    # Test character with aura
    a1_aura = generator.generate_character_sprite("a1", with_aura=True)
    assert len(a1_aura.frames) == 2  # Base + aura frame
    assert a1_aura.animation_speed == 2.0


def test_skill_effect_generation():
    """Test skill effect generation"""
    generator = GraphicsGenerator()

    effect = generator.generate_skill_effect("Umbral Crescent", "a1")
    assert isinstance(effect, AsciiSprite)
    assert effect.width > 0
    assert effect.height > 0
    assert len(effect.colors) > 0

    # Test different character class effects
    unique_effect = generator.generate_skill_effect("Scatter Bloom", "unique")
    assert isinstance(unique_effect, AsciiSprite)


def test_ui_element_generation():
    """Test UI element generation"""
    generator = GraphicsGenerator()

    # Test button generation
    button = generator.generate_ui_element("button", 10, 3)
    assert isinstance(button, AsciiSprite)
    assert button.width == 10
    assert button.height == 3

    # Test health bar
    health_bar = generator.generate_ui_element("health_bar", 20, 1)
    assert isinstance(health_bar, AsciiSprite)
    assert health_bar.width == 20


def test_aura_effect_generation():
    """Test aura effect generation"""
    generator = GraphicsGenerator()

    # Test power aura
    power_aura = generator.generate_aura_effect("power")
    assert isinstance(power_aura, AsciiSprite)
    assert len(power_aura.frames) >= 2  # Should be animated
    assert power_aura.animation_speed > 1.0

    # Test rage aura
    rage_aura = generator.generate_aura_effect("rage")
    assert isinstance(rage_aura, AsciiSprite)
    assert len(rage_aura.frames) >= 2


def test_svg_conversion():
    """Test SVG conversion"""
    frames = [["AB", "CD"]]
    colors = {"A": Color(255, 0, 0), "B": Color(0, 255, 0)}

    sprite = AsciiSprite(width=2, height=2, frames=frames, colors=colors)
    svg = sprite.to_svg(0, 1)

    assert "<svg" in svg
    assert "</svg>" in svg
    assert "fill=" in svg
    assert "rect" in svg


def test_complete_asset_pack_generation():
    """Test complete asset pack generation"""
    generator = GraphicsGenerator()

    assets = generator.generate_complete_asset_pack()

    assert len(assets) > 0
    assert isinstance(assets, dict)

    # Check for expected asset types
    sword_assets = [k for k in assets.keys() if "sword" in k]
    assert len(sword_assets) > 0

    char_assets = [k for k in assets.keys() if "char_" in k]
    assert len(char_assets) > 0

    effect_assets = [k for k in assets.keys() if "effect_" in k]
    assert len(effect_assets) > 0

    ui_assets = [k for k in assets.keys() if k in ["button", "health_bar", "skill_cd"]]
    assert len(ui_assets) > 0


def test_sprite_export():
    """Test sprite export functionality"""
    generator = GraphicsGenerator()

    # Create a simple sprite
    test_sprite = generator.generate_item_icon("sword", ItemRarity.RARE)
    sprites = {"test_sword": test_sprite}

    # Export should not raise any errors
    try:
        generator.export_sprite_sheet(sprites, "/tmp/test_sprites.json")
        export_success = True
    except Exception:
        export_success = False

    assert export_success


def test_rarity_colors():
    """Test that different rarities produce different colors"""
    generator = GraphicsGenerator()

    common_sword = generator.generate_item_icon("sword", ItemRarity.COMMON)
    legendary_sword = generator.generate_item_icon("sword", ItemRarity.LEGENDARY)

    # Should have same structure but different colors
    assert common_sword.width == legendary_sword.width
    assert common_sword.height == legendary_sword.height
    # Colors should be different (at least some keys should differ)
    common_colors = set(common_sword.colors.keys())
    legendary_colors = set(legendary_sword.colors.keys())
    assert common_colors == legendary_colors  # Same characters used

    # But actual color values should differ for at least one character
    color_diff_found = False
    for char in common_colors:
        if char in legendary_colors:
            common_color = common_sword.colors[char]
            legendary_color = legendary_sword.colors[char]
            if (
                common_color.r != legendary_color.r
                or common_color.g != legendary_color.g
                or common_color.b != legendary_color.b
            ):
                color_diff_found = True
                break

    assert color_diff_found


def test_character_class_differences():
    """Test that different character classes produce different sprites"""
    generator = GraphicsGenerator()

    a1_sprite = generator.generate_character_sprite("a1")
    unique_sprite = generator.generate_character_sprite("unique")
    missy_sprite = generator.generate_character_sprite("missy")

    # Should all be sprites but with different content
    assert isinstance(a1_sprite, AsciiSprite)
    assert isinstance(unique_sprite, AsciiSprite)
    assert isinstance(missy_sprite, AsciiSprite)

    # Frames should be different
    a1_frame = a1_sprite.get_frame(0)
    unique_frame = unique_sprite.get_frame(0)
    missy_frame = missy_sprite.get_frame(0)

    assert a1_frame != unique_frame
    assert unique_frame != missy_frame
    assert a1_frame != missy_frame


if __name__ == "__main__":
    test_color_creation()
    test_ascii_sprite_creation()
    test_graphics_generator_initialization()
    test_item_icon_generation()
    test_character_sprite_generation()
    test_skill_effect_generation()
    test_ui_element_generation()
    test_aura_effect_generation()
    test_svg_conversion()
    test_complete_asset_pack_generation()
    test_sprite_export()
    test_rarity_colors()
    test_character_class_differences()
    print("All graphics generation tests passed!")
