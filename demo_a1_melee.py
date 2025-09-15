#!/usr/bin/env python3
"""
Game7 - A1 Melee Combat Demo

This demo showcases A1's melee-only combat system with bullet reflection
and visual slash effects as specified in the requirements.
"""

from game_engine import GameEngine, SkillType
from game_bridge import create_game_server
import time


def demo_a1_melee_combat():
    """Demonstrate A1's melee combat capabilities"""
    print("=" * 60)
    print("GAME7 - A1 MELEE COMBAT DEMO")
    print("=" * 60)
    
    # Initialize game engine
    engine = GameEngine()
    a1 = engine.get_character('A1')
    
    print(f"\n🗡️  {a1.name}")
    print(f"   Class: {a1.character_class.value}")
    print(f"   HP: {a1.stats.hp}/{a1.stats.max_hp}")
    print(f"   Attack: {a1.stats.attack}")
    print(f"   Melee Attacker: {a1.stats.is_melee_attacker}")
    print(f"   Can Reflect Bullets: {a1.stats.can_reflect_bullets}")
    
    print("\n" + "=" * 60)
    print("BASIC ATTACK DEMONSTRATION")
    print("=" * 60)
    
    # Demonstrate basic melee attack
    print(f"\n🔥 Executing A1's 5-hit melee combo...")
    attack_result = engine.use_basic_attack('A1')
    
    if attack_result['success']:
        print(f"\n✅ Attack successful!")
        print(f"   Skill: {attack_result['skill_name']}")
        print(f"   Combat Type: {'MELEE' if attack_result['is_melee'] else 'RANGED'}")
        print(f"   Hit Count: {attack_result['hit_count']}")
        print(f"   Total Damage: {attack_result['total_damage']:.1f}")
        print(f"   Bullet Reflection: {attack_result['bullet_reflect_count']} bullets")
        
        print(f"\n⚔️  Visual Effects (Slash VFX):")
        for i, effect in enumerate(attack_result['visual_effects']):
            direction_symbol = "🔺" if effect['direction'] == 'left' else "🔻"
            print(f"   Hit {effect['hit_number']}: {direction_symbol} {effect['damage']:.1f} damage ({effect['direction']} slash)")
    
    print("\n" + "=" * 60)
    print("BULLET REFLECTION DEMONSTRATION")
    print("=" * 60)
    
    # Demonstrate bullet reflection
    incoming_bullets = 8
    print(f"\n🎯 {incoming_bullets} enemy bullets incoming...")
    reflection_result = engine.reflect_bullets('A1', incoming_bullets)
    
    if reflection_result['success']:
        print(f"🛡️  A1 reflects {reflection_result['reflected_bullets']} bullets!")
        print(f"   Character: {reflection_result['character']}")
        print(f"   VFX: {reflection_result['visual_effect']}")
    
    print("\n" + "=" * 60)
    print("SPECIAL SKILLS DEMONSTRATION")
    print("=" * 60)
    
    # Demonstrate S1 skill (projectile exception)
    print(f"\n🌙 Using S1: Umbral Crescent (Projectile Exception)")
    s1_skill = a1.skills[SkillType.S1]
    print(f"   Type: {'PROJECTILE' if s1_skill.is_projectile else 'MELEE'}")
    print(f"   Description: {s1_skill.description}")
    
    if a1.use_skill(SkillType.S1):
        damage = a1.calculate_damage(SkillType.S1)
        print(f"   ✅ S1 cast successful! Damage: {damage:.1f}")
    
    # Demonstrate S3 parry skill
    print(f"\n🪞 Using S3: Mirror Reversal (Enhanced Reflection)")
    s3_skill = a1.skills[SkillType.S3]
    print(f"   Type: {'MELEE' if s3_skill.is_melee else 'RANGED'}")
    print(f"   Bullet Reflection: {s3_skill.bullet_reflect_count} bullets")
    print(f"   Description: {s3_skill.description}")
    
    if a1.use_skill(SkillType.S3):
        damage = a1.calculate_damage(SkillType.S3)
        print(f"   ✅ S3 cast successful! Damage: {damage:.1f}")
    
    print("\n" + "=" * 60)
    print("RAGE & SECRET SKILL DEMONSTRATION")
    print("=" * 60)
    
    # Demonstrate Rage skill with invulnerability
    print(f"\n🔥 Activating Rage: Nocturne Ascendance")
    a1.stats.rage = 60  # Ensure enough rage
    
    if a1.use_skill(SkillType.R1):
        print(f"   ✅ Rage activated!")
        print(f"   Rage Active: {a1.stats.rage_active}")
        print(f"   Invulnerable: {a1.is_invulnerable()}")
        print(f"   Invulnerability Time: {a1.stats.invulnerable_time:.1f}s")
    
    # Demonstrate Secret skill
    print(f"\n💫 Preparing Secret Skill: Astral Sever EX")
    a1.stats.secret_gauge = 100  # Full gauge
    original_hp = a1.stats.hp
    
    if a1.use_skill(SkillType.X1):
        damage = a1.calculate_damage(SkillType.X1)
        hp_cost = original_hp - a1.stats.hp
        print(f"   ✅ Secret skill unleashed!")
        print(f"   Damage: {damage:.1f}")
        print(f"   HP Cost: {hp_cost:.1f} (20% of max HP)")
        print(f"   Invulnerable: {a1.is_invulnerable()}")
        print(f"   Invulnerability Time: {a1.stats.invulnerable_time:.1f}s")
    
    print("\n" + "=" * 60)
    print("TEAM SURVIVAL SYSTEM")
    print("=" * 60)
    
    # Demonstrate team status
    team_status = engine.get_team_status()
    print(f"\n👥 Team Status:")
    for char_id, status in team_status.items():
        char = engine.get_character(char_id)
        emoji = "🗡️" if char_id == "A1" else ("🔮" if char_id == "Unique" else "🍀")
        defeated_status = "💀 DEFEATED" if status['is_defeated'] else "✅ ALIVE"
        print(f"   {emoji} {char.name}: {defeated_status} - HP: {status['hp']:.1f}/{status['max_hp']:.1f}")
    
    # Demonstrate defeat and revival
    print(f"\n💥 Simulating A1 defeat...")
    engine.defeat_character('A1')
    a1_status = engine.get_team_status()['A1']
    
    print(f"   A1 Status: {'💀 DEFEATED' if a1_status['is_defeated'] else '✅ ALIVE'}")
    print(f"   Revival Time: {a1_status['revive_time']:.1f}s")
    print(f"   Active Character: {engine.active_character} (auto-switched)")
    
    # Instant revival
    print(f"\n🔄 Using revival token for instant revival...")
    engine.revive_character('A1', instant=True)
    a1_status = engine.get_team_status()['A1']
    print(f"   A1 Status: {'✅ REVIVED' if not a1_status['is_defeated'] else '💀 STILL DEFEATED'}")
    
    print("\n" + "=" * 60)
    print("DEMO COMPLETE")
    print("=" * 60)
    
    print(f"\n🎮 Key Features Demonstrated:")
    print(f"   ✅ A1's melee-only basic attack (5-hit combo)")
    print(f"   ✅ No beam/projectile attacks for A1 (except S1)")
    print(f"   ✅ Bullet reflection system (2-5 bullets per swing)")
    print(f"   ✅ Visible slash VFX for each melee hit")
    print(f"   ✅ 0.4s invulnerability for R1 and X1 skills")
    print(f"   ✅ Team survival system with auto-revival")
    print(f"   ✅ Character switching and defeat handling")
    
    print(f"\n🌐 HTML Integration Available:")
    print(f"   Run 'python3 game_bridge.py' to start web server")
    print(f"   Navigate to http://localhost:8080/game")
    print(f"   Full integration with existing HTML game")


def run_interactive_demo():
    """Run an interactive demo with user input"""
    print("\n" + "🎮" * 20)
    print("INTERACTIVE DEMO MODE")
    print("🎮" * 20)
    
    engine = GameEngine()
    
    while True:
        print(f"\n📋 Available Actions:")
        print(f"   1. Execute A1 Basic Attack")
        print(f"   2. Use A1 Skill")
        print(f"   3. Switch Character")
        print(f"   4. View Team Status")
        print(f"   5. Start Web Server")
        print(f"   6. Exit")
        
        try:
            choice = input(f"\n🎯 Enter your choice (1-6): ").strip()
            
            if choice == '1':
                result = engine.use_basic_attack('A1')
                print(f"\n⚔️  A1 executed {result.get('skill_name', 'Unknown')}!")
                print(f"   Total Damage: {result.get('total_damage', 0):.1f}")
                print(f"   Slash Effects: {len(result.get('visual_effects', []))}")
                
            elif choice == '2':
                print(f"\n🌟 A1 Skills: S1, S2, S3, S4, R1, X1")
                skill = input("   Enter skill (e.g., S1): ").strip().upper()
                try:
                    skill_type = SkillType(skill.lower())
                    a1 = engine.get_character('A1')
                    if skill == 'R1':
                        a1.stats.rage = 60
                    elif skill == 'X1':
                        a1.stats.secret_gauge = 100
                    
                    if a1.use_skill(skill_type):
                        damage = a1.calculate_damage(skill_type)
                        print(f"   ✅ {skill} successful! Damage: {damage:.1f}")
                        if a1.is_invulnerable():
                            print(f"   🛡️  Invulnerable for {a1.stats.invulnerable_time:.1f}s")
                    else:
                        print(f"   ❌ {skill} failed!")
                except ValueError:
                    print(f"   ❌ Invalid skill: {skill}")
                    
            elif choice == '3':
                chars = list(engine.characters.keys())
                print(f"\n👥 Characters: {', '.join(chars)}")
                char = input("   Enter character name: ").strip()
                if engine.switch_character(char):
                    print(f"   ✅ Switched to {char}")
                else:
                    print(f"   ❌ Cannot switch to {char}")
                    
            elif choice == '4':
                team = engine.get_team_status()
                print(f"\n👥 Team Status:")
                for name, status in team.items():
                    char = engine.get_character(name)
                    emoji = "🗡️" if name == "A1" else ("🔮" if name == "Unique" else "🍀")
                    active = "👑" if name == engine.active_character else "  "
                    print(f"   {active}{emoji} {char.name}: HP {status['hp']:.0f}/{status['max_hp']:.0f}")
                    
            elif choice == '5':
                print(f"\n🌐 Starting web server...")
                print(f"   Navigate to http://localhost:8080/game")
                print(f"   Press Ctrl+C to stop server")
                
                from game_bridge import main as run_server
                try:
                    run_server()
                except KeyboardInterrupt:
                    print(f"\n🛑 Server stopped")
                    
            elif choice == '6':
                print(f"\n👋 Goodbye!")
                break
                
            else:
                print(f"\n❌ Invalid choice: {choice}")
                
        except KeyboardInterrupt:
            print(f"\n\n👋 Goodbye!")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")


if __name__ == "__main__":
    demo_a1_melee_combat()
    
    print(f"\n🎮 Would you like to try the interactive demo? (y/n): ", end="")
    try:
        if input().lower().startswith('y'):
            run_interactive_demo()
    except KeyboardInterrupt:
        print(f"\n👋 Goodbye!")