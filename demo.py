#!/usr/bin/env python3
"""
Game7 - Complete Feature Demo

This demo showcases all the implemented features:
- Game engine with 6-skill combat system
- Procedural graphics generation
- Web server integration
- Character progression
- Visual effects and animations
"""

import time
import json
from game_engine import GameEngine, SkillType
from graphics_gen import GraphicsGenerator, ItemRarity, IconStyle


def demo_game_engine():
    """Demonstrate the game engine features"""
    print("🎮 Game Engine Demo")
    print("=" * 50)
    
    # Initialize game
    engine = GameEngine()
    
    # Show team
    print(f"Team: {', '.join(engine.current_team)}")
    print(f"Active: {engine.get_active_character().name}")
    
    # Character stats
    for char_id in engine.current_team:
        char = engine.get_character(char_id)
        print(f"\n{char.name} (Level {char.stats.level})")
        print(f"  HP: {char.stats.hp:.0f}/{char.stats.max_hp:.0f}")
        print(f"  ATK: {char.stats.attack:.1f} | DEF: {char.stats.defense:.1f}")
        print(f"  Rage: {char.stats.rage:.0f}/{char.stats.max_rage:.0f}")
        
        # Show skills
        print("  Skills:")
        for skill_type, skill in char.skills.items():
            print(f"    {skill_type.value}: {skill.name} ({skill.base_damage:.0f}% ATK)")
    
    # Demo skill usage
    print(f"\n⚔️ Using A1's skills...")
    a1 = engine.get_character("A1")
    
    # Use S1
    if a1.use_skill(SkillType.S1):
        damage = a1.calculate_damage(SkillType.S1)
        print(f"  S1 - {a1.skills[SkillType.S1].name}: {damage:.1f} damage!")
    
    # Gain experience and level up
    print(f"\n📈 Gaining experience...")
    if a1.gain_experience(150):
        print(f"  A1 leveled up to {a1.stats.level}!")
        print(f"  New stats - HP: {a1.stats.max_hp:.0f}, ATK: {a1.stats.attack:.1f}")
    
    # Switch characters
    print(f"\n🔄 Switching to Unique...")
    if engine.switch_character("Unique"):
        unique = engine.get_active_character()
        print(f"  Now controlling: {unique.name}")
        
        # Use Unique's S2 (Drone Command)
        if unique.use_skill(SkillType.S2):
            print(f"  S2 - {unique.skills[SkillType.S2].name}: Drones summoned!")


def demo_graphics_generation():
    """Demonstrate the graphics generation system"""
    print("\n\n🎨 Graphics Generation Demo")
    print("=" * 50)
    
    generator = GraphicsGenerator()
    
    # Generate item icons
    print("📦 Item Icons:")
    items = [
        ("sword", ItemRarity.COMMON),
        ("sword", ItemRarity.LEGENDARY),
        ("potion", ItemRarity.RARE),
        ("gem", ItemRarity.EPIC)
    ]
    
    for item_type, rarity in items:
        icon = generator.generate_item_icon(item_type, rarity, IconStyle.CHIBI)
        print(f"\n{rarity.value.title()} {item_type.title()}:")
        for line in icon.frames[0]:
            print(f"  {line}")
    
    # Generate character sprites
    print(f"\n👤 Character Sprites:")
    characters = ["a1", "unique", "missy"]
    
    for char in characters:
        sprite = generator.generate_character_sprite(char)
        print(f"\n{char.upper()}:")
        for line in sprite.frames[0]:
            print(f"  {line}")
    
    # Generate with aura
    print(f"\nA1 with Power Aura:")
    a1_aura = generator.generate_character_sprite("a1", with_aura=True)
    for line in a1_aura.frames[1]:  # Aura frame
        print(f"  {line}")
    
    # Generate skill effects
    print(f"\n✨ Skill Effects:")
    effects = [
        ("Umbral Crescent", "a1"),
        ("Scatter Bloom", "unique"),
        ("Lucky Charm Volley", "missy")
    ]
    
    for skill_name, char_class in effects:
        effect = generator.generate_skill_effect(skill_name, char_class)
        print(f"\n{skill_name} ({char_class}):")
        for line in effect.frames[0]:
            print(f"  {line}")
    
    # Generate complete asset pack
    print(f"\n📊 Asset Statistics:")
    assets = generator.generate_complete_asset_pack()
    print(f"  Total assets generated: {len(assets)}")
    
    asset_types = {}
    for name in assets.keys():
        category = name.split('_')[0]
        asset_types[category] = asset_types.get(category, 0) + 1
    
    for category, count in asset_types.items():
        print(f"  {category.title()}: {count}")


def demo_s5_skills():
    """Demonstrate the new S5 skill system"""
    print("\n\n🌟 S5 Skills Demo")
    print("=" * 50)
    
    engine = GameEngine()
    
    print("S5 Skills Overview:")
    skills_info = {
        "A1": {
            "name": "Void Impale",
            "cost": "35% Current HP",
            "effect": "Devastating single-target impale for 1500% ATK"
        },
        "Unique": {
            "name": "Drone Overdrive", 
            "cost": "30% Current HP",
            "effect": "Kamikaze drones seek strongest enemy"
        },
        "Missy": {
            "name": "Sacrificial Gambit",
            "cost": "25% Team HP",
            "effect": "Team invulnerability + 100% crit for 5s"
        }
    }
    
    for char_id, info in skills_info.items():
        char = engine.get_character(char_id)
        print(f"\n{char.name}:")
        print(f"  S5: {info['name']}")
        print(f"  Cost: {info['cost']}")
        print(f"  Effect: {info['effect']}")
        
        # Simulate S5 usage
        original_hp = char.stats.hp
        if char_id == "A1":
            hp_cost = original_hp * 0.35
        elif char_id == "Unique":
            hp_cost = original_hp * 0.30
        else:  # Missy
            hp_cost = original_hp * 0.25
            
        print(f"  HP Before: {original_hp:.0f}")
        print(f"  HP Cost: {hp_cost:.0f}")
        print(f"  HP After: {original_hp - hp_cost:.0f}")


def demo_web_integration():
    """Demonstrate web server integration"""
    print("\n\n🌐 Web Integration Demo")
    print("=" * 50)
    
    print("Web Server Features:")
    print("  • Python backend with HTTP API")
    print("  • Real-time game state synchronization")
    print("  • RESTful endpoints for all game actions")
    print("  • Procedural asset serving")
    print("  • Enhanced HTML game client")
    
    print("\nAPI Endpoints:")
    endpoints = [
        "GET /api/game-state - Complete game state",
        "GET /api/team-status - Team member status", 
        "GET /api/character-info?id=<char> - Character details",
        "GET /api/assets?type=<type> - Game assets",
        "POST /api/use-skill - Use character skill",
        "POST /api/switch-character - Switch active character",
        "POST /api/gain-experience - Add experience",
        "POST /api/defeat-character - Defeat character",
        "POST /api/revive-character - Revive character"
    ]
    
    for endpoint in endpoints:
        print(f"  • {endpoint}")
    
    print("\nTo start the web server:")
    print("  python3 web_server.py --port 8080")
    print("  Open http://localhost:8080/ in your browser")


def demo_anime_features():
    """Demonstrate solo leveling style features"""
    print("\n\n⭐ Solo Leveling Style Features")
    print("=" * 50)
    
    generator = GraphicsGenerator()
    
    print("Aura Effects:")
    
    # Power aura
    power_aura = generator.generate_aura_effect("power")
    print(f"\n🌟 Power Aura (Golden):")
    for line in power_aura.frames[0]:
        print(f"  {line}")
    
    # Rage aura
    rage_aura = generator.generate_aura_effect("rage")
    print(f"\n🔥 Rage Aura (Flame):")
    for line in rage_aura.frames[0]:
        print(f"  {line}")
    
    print(f"\nAura System Features:")
    print("  • Dynamic pulsing effects")
    print("  • Character-specific aura colors")
    print("  • Rage mode visual feedback")
    print("  • Power level indicators")
    print("  • Animated particle effects")
    print("  • Screen shake on powerful skills")
    print("  • Crescendo cooldown resets")


def demo_combat_enhancements():
    """Demonstrate enhanced combat system"""
    print("\n\n⚔️ Enhanced Combat System")
    print("=" * 50)
    
    print("6-Skill Combat System:")
    print("  S1-S4: Core combat skills")
    print("  R1: Manual Rage mode activation") 
    print("  X1: Secret skill with special conditions")
    
    print("\nCombat Mechanics:")
    print("  • A1 sword attacks deflect 2-5 bullets per swing")
    print("  • Unique fires piercing projectiles with DoT")
    print("  • Missy combines sword swings + homing pistol shots")
    print("  • Team HP system with revival mechanics")
    print("  • Rage provides 25% ATK bonus + enhanced abilities")
    print("  • Secret skills cost 20% Max HP over 2 seconds")
    print("  • S5/X1 usage grants 0.4s invulnerability")
    print("  • Crescendo effect resets S1/S2 cooldowns")
    
    print("\nCharacter Roles:")
    print("  🗡️  A1: Boss Slayer - High single-target damage")
    print("  🔫 Unique: Mob Slayer - Area damage and summons")  
    print("  ⭐ Missy: Support/Loot - Team buffs and utility")


def main():
    """Run complete demo"""
    print("🎉 Game7 - Complete Feature Demonstration")
    print("=" * 60)
    print("Showcasing all implemented features...")
    
    try:
        demo_game_engine()
        demo_graphics_generation()
        demo_s5_skills()
        demo_anime_features()
        demo_combat_enhancements()
        demo_web_integration()
        
        print("\n\n🏆 Demo Complete!")
        print("=" * 60)
        print("All features successfully demonstrated.")
        print("\nNext steps:")
        print("1. Start the web server: python3 web_server.py")
        print("2. Open the game: http://localhost:8080/")
        print("3. Test S5 skills: game.testS5() in browser console")
        print("4. View assets: http://localhost:8080/api/assets")
        
    except Exception as e:
        print(f"\n❌ Demo failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()