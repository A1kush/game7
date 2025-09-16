#!/usr/bin/env python3
"""
Game7 - Core Game Engine

This module implements the core game logic including:
- Player stats and progression
- Skill system (S1-S4, R1, X1)
- Upgrade mechanics
- Level up system
- Character classes (A1, Unique, Missy)
"""

import json
import math
import random
from dataclasses import dataclass, asdict
from typing import Dict, List, Optional, Any
from enum import Enum


class SkillType(Enum):
    """Skill types for the 6-skill combat system"""

    S1 = "s1"
    S2 = "s2"
    S3 = "s3"
    S4 = "s4"
    R1 = "rage"
    X1 = "secret"


class CharacterClass(Enum):
    """Character classes with specific roles"""

    A1 = "boss_slayer"
    UNIQUE = "mob_slayer"
    MISSY = "support_loot"


@dataclass
class Skill:
    """Represents a character skill"""

    name: str
    skill_type: SkillType
    base_damage: float
    cooldown: float
    hp_cost: float = 0.0
    description: str = ""
    special_effects: Dict[str, Any] = None
    is_melee: bool = False
    is_projectile: bool = False
    hit_count: int = 1
    bullet_reflect_count: int = 0

    def __post_init__(self):
        if self.special_effects is None:
            self.special_effects = {}


@dataclass
class PlayerStats:
    """Core player statistics"""

    level: int = 1
    hp: float = 100.0
    max_hp: float = 100.0
    attack: float = 20.0
    defense: float = 10.0
    speed: float = 100.0
    luck: float = 10.0
    crit_chance: float = 0.05
    crit_damage: float = 1.5

    # Rage system
    rage: float = 0.0
    max_rage: float = 100.0

    # Secret skill gauge
    secret_gauge: float = 0.0
    max_secret_gauge: float = 100.0

    # Status flags
    is_defeated: bool = False
    revive_time: float = 0.0
    rage_active: bool = False
    rage_duration: float = 0.0
    invulnerable_time: float = 0.0

    # Combat attributes
    is_melee_attacker: bool = False
    can_reflect_bullets: bool = False


@dataclass
class Character:
    """Represents a playable character"""

    id: str
    name: str
    character_class: CharacterClass
    stats: PlayerStats
    skills: Dict[SkillType, Skill]
    experience: int = 0
    experience_needed: int = 100
    skill_points: int = 0

    def level_up(self):
        """Handle character level up"""
        if self.experience >= self.experience_needed:
            self.experience -= self.experience_needed
            self.stats.level += 1
            self.skill_points += 1

            # Increase base stats
            self.stats.max_hp += 10 + (self.stats.level * 2)
            self.stats.hp = self.stats.max_hp  # Full heal on level up
            self.stats.attack += 3 + (self.stats.level * 0.5)
            self.stats.defense += 2 + (self.stats.level * 0.3)

            # Calculate next level requirement
            self.experience_needed = int(100 * (1.15**self.stats.level))

            return True
        return False

    def gain_experience(self, amount: int) -> bool:
        """Add experience and check for level up"""
        self.experience += amount
        return self.level_up()

    def use_skill(self, skill_type: SkillType) -> bool:
        """Use a skill if conditions are met"""
        if skill_type not in self.skills:
            return False

        skill = self.skills[skill_type]

        # Check HP cost
        if skill.hp_cost > 0:
            hp_cost = self.stats.max_hp * (skill.hp_cost / 100)
            if self.stats.hp <= hp_cost:
                return False
            self.stats.hp -= hp_cost

        # Special conditions for Secret skill
        if skill_type == SkillType.X1:
            if self.stats.secret_gauge < self.stats.max_secret_gauge:
                return False
            self.stats.secret_gauge = 0
            # Grant 0.4s invulnerability for Secret skill
            self.stats.invulnerable_time = 0.4

        # Special conditions for Rage skill
        if skill_type == SkillType.R1:
            if self.stats.rage < 50:  # Minimum rage requirement
                return False
            self.stats.rage_active = True
            self.stats.rage_duration = 10.0  # 10 seconds
            # Grant 0.4s invulnerability for Rage skill
            self.stats.invulnerable_time = 0.4

        return True

    def use_basic_attack(self) -> Dict[str, Any]:
        """Execute basic attack and return attack details"""
        if "basic" not in self.skills:
            return {"success": False, "reason": "No basic attack defined"}

        basic_skill = self.skills["basic"]
        attack_result = {
            "success": True,
            "skill_name": basic_skill.name,
            "is_melee": basic_skill.is_melee,
            "hit_count": basic_skill.hit_count,
            "total_damage": 0,
            "bullet_reflect_count": basic_skill.bullet_reflect_count,
            "visual_effects": [],
        }

        # Calculate damage for each hit
        for hit in range(basic_skill.hit_count):
            damage = self.calculate_damage_for_skill(basic_skill)
            attack_result["total_damage"] += damage

            # Add visual effect for each melee swing
            if basic_skill.is_melee:
                attack_result["visual_effects"].append(
                    {
                        "type": "slash",
                        "hit_number": hit + 1,
                        "damage": damage,
                        "direction": "left" if hit % 2 == 0 else "right",
                    }
                )

        return attack_result

    def calculate_damage_for_skill(self, skill: Skill) -> float:
        """Calculate damage for a specific skill"""
        base_damage = skill.base_damage * self.stats.attack / 100

        # Apply rage bonus
        if self.stats.rage_active:
            base_damage *= 1.25

        # Apply critical hit
        if random.random() < self.stats.crit_chance:
            base_damage *= self.stats.crit_damage

        return base_damage

    def update_rage(self, delta_time: float):
        """Update rage state and invulnerability"""
        if self.stats.rage_active:
            self.stats.rage_duration -= delta_time
            if self.stats.rage_duration <= 0:
                self.stats.rage_active = False
                self.stats.rage_duration = 0

        # Update invulnerability frames
        if self.stats.invulnerable_time > 0:
            self.stats.invulnerable_time -= delta_time
            if self.stats.invulnerable_time < 0:
                self.stats.invulnerable_time = 0

    def is_invulnerable(self) -> bool:
        """Check if character is currently invulnerable"""
        return self.stats.invulnerable_time > 0

    def calculate_damage(self, skill_type: SkillType) -> float:
        """Calculate damage for a skill"""
        if skill_type not in self.skills:
            return 0.0

        skill = self.skills[skill_type]
        base_damage = skill.base_damage * self.stats.attack / 100

        # Apply rage bonus
        if self.stats.rage_active:
            base_damage *= 1.25

        # Apply critical hit
        if random.random() < self.stats.crit_chance:
            base_damage *= self.stats.crit_damage

        return base_damage


class GameEngine:
    """Core game engine managing all game systems"""

    def __init__(self):
        self.characters: Dict[str, Character] = {}
        self.current_team: List[str] = []
        self.active_character: str = ""
        self.stage: int = 1
        self.wave: int = 1
        self.kills: int = 0
        self.gold: int = 0
        self.silver: int = 0
        self.gems: int = 0

        self._initialize_characters()

    def _initialize_characters(self):
        """Initialize the three main characters"""
        # A1 - Boss Slayer (MELEE ONLY)
        a1_skills = {
            # Basic Attack: 5-hit sword combo, no projectiles, reflects bullets
            "basic": Skill(
                "Void Sword Combo",
                SkillType.S1,  # Using S1 for basic attack categorization
                120.0,  # Base damage per hit (5 hits total)
                0.0,  # No cooldown for basic attack
                description="5-hit melee combo. Each swing reflects 2-5 bullets. No projectiles.",
                is_melee=True,
                is_projectile=False,
                hit_count=5,
                bullet_reflect_count=3,  # Average 2-5 bullets reflected
            ),
            SkillType.S1: Skill(
                "Umbral Crescent",
                SkillType.S1,
                180.0,
                3.0,
                description="Piercing energy wave projectile. Resets on kill.",
                is_projectile=True,
            ),
            SkillType.S2: Skill(
                "Vortex Cross",
                SkillType.S2,
                150.0,
                4.0,
                description="Dashing X-explosion that slows enemies.",
                is_melee=True,
            ),
            SkillType.S3: Skill(
                "Mirror Reversal",
                SkillType.S3,
                200.0,
                6.0,
                description="Parry that reflects almost all bullets and triggers counter.",
                is_melee=True,
                bullet_reflect_count=10,  # Can parry almost all incoming bullets
            ),
            SkillType.S4: Skill(
                "Riftfall Impact",
                SkillType.S4,
                250.0,
                8.0,
                description="Leap shockwave that shreds armor.",
                is_melee=True,
            ),
            SkillType.R1: Skill(
                "Nocturne Ascendance",
                SkillType.R1,
                0.0,
                60.0,
                description="Rage mode: +ATK, +attack speed. Grants 0.4s invulnerability.",
            ),
            SkillType.X1: Skill(
                "Astral Sever EX",
                SkillType.X1,
                1000.0,
                0.0,
                20.0,
                description="Full-screen cross-slash. 20% max HP cost. Grants 0.4s invulnerability.",
                is_melee=True,
            ),
        }

        a1 = Character(
            "A1",
            "A1 - Boss Slayer",
            CharacterClass.A1,
            PlayerStats(
                attack=25.0,
                defense=15.0,
                max_hp=120.0,
                hp=120.0,
                is_melee_attacker=True,
                can_reflect_bullets=True,
            ),
            a1_skills,
        )

        # Unique - Mob Slayer
        unique_skills = {
            SkillType.S1: Skill(
                "Scatter Bloom",
                SkillType.S1,
                120.0,
                2.5,
                description="5 ricocheting shards that spawn shardlings on kill.",
            ),
            SkillType.S2: Skill(
                "Drone Command",
                SkillType.S2,
                100.0,
                5.0,
                description="Summons 2 persistent drones with 100 HP.",
            ),
            SkillType.S3: Skill(
                "Overcharge Stream v2",
                SkillType.S3,
                80.0,
                0.1,
                description="Attached beam that sweeps and ramps damage.",
            ),
            SkillType.S4: Skill(
                "Stellar Annihilator",
                SkillType.S4,
                300.0,
                10.0,
                description="Hold-to-charge beam (0.3-2.5s) that persists.",
            ),
            SkillType.R1: Skill(
                "Prism Overdrive",
                SkillType.R1,
                0.0,
                45.0,
                description="Spawns extra drone, empowers all summons.",
            ),
            SkillType.X1: Skill(
                "Prismatic Cataclysm",
                SkillType.X1,
                800.0,
                0.0,
                20.0,
                description="Persistent energy lattice that damages and vacuums loot.",
            ),
        }

        unique = Character(
            "Unique",
            "Unique - Mob Slayer",
            CharacterClass.UNIQUE,
            PlayerStats(attack=22.0, defense=12.0, max_hp=100.0, hp=100.0),
            unique_skills,
        )

        # Missy - Support/Loot
        missy_skills = {
            SkillType.S1: Skill(
                "Lucky Charm Volley",
                SkillType.S1,
                100.0,
                2.0,
                description="Fast poke that marks and debuffs enemies.",
            ),
            SkillType.S2: Skill(
                "Winged Aegis v2",
                SkillType.S2,
                0.0,
                8.0,
                description="Dome that reflects projectiles and heals team 8% max HP.",
            ),
            SkillType.S3: Skill(
                "Neko Dominion v2",
                SkillType.S3,
                80.0,
                6.0,
                description="Summons Maneki guardians that taunt and pull enemies.",
            ),
            SkillType.S4: Skill(
                "Queen's Bell",
                SkillType.S4,
                60.0,
                12.0,
                description="Bell that pulses, healing allies and buffing ATK.",
            ),
            SkillType.R1: Skill(
                "Jackpot Rush",
                SkillType.R1,
                0.0,
                50.0,
                description="6s: Jackpot state with massive crit and drop rate boost.",
            ),
            SkillType.X1: Skill(
                "Sovereign Parade",
                SkillType.X1,
                400.0,
                0.0,
                20.0,
                description="Golden procession with global loot pull and team heal.",
            ),
        }

        missy = Character(
            "Missy",
            "Missy - Support/Loot",
            CharacterClass.MISSY,
            PlayerStats(attack=18.0, defense=10.0, max_hp=90.0, hp=90.0, luck=25.0),
            missy_skills,
        )

        self.characters = {"A1": a1, "Unique": unique, "Missy": missy}

        self.current_team = ["A1", "Unique", "Missy"]
        self.active_character = "A1"

    def get_character(self, character_id: str) -> Optional[Character]:
        """Get character by ID"""
        return self.characters.get(character_id)

    def get_active_character(self) -> Optional[Character]:
        """Get the currently active character"""
        return self.characters.get(self.active_character)

    def switch_character(self, character_id: str) -> bool:
        """Switch to a different character"""
        if character_id in self.characters and character_id in self.current_team:
            char = self.characters[character_id]
            if not char.stats.is_defeated:
                self.active_character = character_id
                return True
        return False

    def update(self, delta_time: float):
        """Update game state"""
        for char in self.characters.values():
            char.update_rage(delta_time)

            # Update revival countdown
            if char.stats.is_defeated and char.stats.revive_time > 0:
                char.stats.revive_time -= delta_time
                if char.stats.revive_time <= 0:
                    # Auto-revive when timer expires
                    self.revive_character(char.id, instant=True)

    def use_basic_attack(self, character_id: str = None) -> Dict[str, Any]:
        """Execute basic attack for specified character"""
        if character_id is None:
            character_id = self.active_character

        char = self.get_character(character_id)
        if not char or char.stats.is_defeated:
            return {"success": False, "reason": "Character not available"}

        return char.use_basic_attack()

    def reflect_bullets(self, character_id: str, bullet_count: int) -> Dict[str, Any]:
        """Handle bullet reflection for a character"""
        char = self.get_character(character_id)
        if not char or not char.stats.can_reflect_bullets:
            return {"success": False, "reason": "Character cannot reflect bullets"}

        # Check if A1 and using melee attack
        if char.character_class == CharacterClass.A1 and char.stats.is_melee_attacker:
            reflection_result = {
                "success": True,
                "reflected_bullets": min(bullet_count, 5),  # Max 5 bullets per swing
                "character": character_id,
                "visual_effect": "bullet_reflection",
            }
            return reflection_result

        return {"success": False, "reason": "Reflection conditions not met"}

    def defeat_character(self, character_id: str):
        """Handle character defeat"""
        char = self.get_character(character_id)
        if char:
            char.stats.is_defeated = True
            char.stats.revive_time = 40.0 + random.uniform(0, 20.0)  # 40-60 seconds

            # Auto-switch if active character is defeated
            if character_id == self.active_character:
                for team_char_id in self.current_team:
                    team_char = self.get_character(team_char_id)
                    if team_char and not team_char.stats.is_defeated:
                        self.active_character = team_char_id
                        break

    def revive_character(self, character_id: str, instant: bool = False):
        """Revive a defeated character"""
        char = self.get_character(character_id)
        if char and char.stats.is_defeated:
            char.stats.is_defeated = False
            char.stats.revive_time = 0.0
            char.stats.hp = char.stats.max_hp
            return True
        return False

    def check_game_over(self) -> bool:
        """Check if all team members are defeated"""
        return all(
            self.characters[char_id].stats.is_defeated for char_id in self.current_team
        )

    def get_team_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status of all team members"""
        return {
            char_id: {
                "hp": char.stats.hp,
                "max_hp": char.stats.max_hp,
                "level": char.stats.level,
                "is_defeated": char.stats.is_defeated,
                "revive_time": char.stats.revive_time,
                "rage": char.stats.rage,
                "secret_gauge": char.stats.secret_gauge,
                "rage_active": char.stats.rage_active,
            }
            for char_id, char in self.characters.items()
            if char_id in self.current_team
        }

    def to_dict(self) -> Dict[str, Any]:
        """Serialize game state to dictionary"""
        return {
            "characters": {
                char_id: {
                    "id": char.id,
                    "name": char.name,
                    "character_class": char.character_class.value,
                    "stats": asdict(char.stats),
                    "experience": char.experience,
                    "experience_needed": char.experience_needed,
                    "skill_points": char.skill_points,
                    "skills": {
                        (skill_type.value if hasattr(skill_type, 'value') else str(skill_type)): {
                            "name": skill.name,
                            "skill_type": skill.skill_type.value,
                            "base_damage": skill.base_damage,
                            "cooldown": skill.cooldown,
                            "hp_cost": skill.hp_cost,
                            "description": skill.description,
                            "special_effects": skill.special_effects,
                            "is_melee": skill.is_melee,
                            "is_projectile": skill.is_projectile,
                            "hit_count": skill.hit_count,
                            "bullet_reflect_count": skill.bullet_reflect_count,
                        }
                        for skill_type, skill in char.skills.items()
                    },
                }
                for char_id, char in self.characters.items()
            },
            "current_team": self.current_team,
            "active_character": self.active_character,
            "stage": self.stage,
            "wave": self.wave,
            "kills": self.kills,
            "gold": self.gold,
            "silver": self.silver,
            "gems": self.gems,
        }

    def save_game(self, filename: str):
        """Save game state to file"""
        with open(filename, "w") as f:
            json.dump(self.to_dict(), f, indent=2)

    @classmethod
    def load_game(cls, filename: str) -> "GameEngine":
        """Load game state from file"""
        with open(filename, "r") as f:
            data = json.load(f)

        engine = cls()
        # Implementation would restore state from data
        # For now, return new engine
        return engine


def main():
    """Demo function showing the game engine in action"""
    print("Game7 Engine Demo")
    print("================")

    # Initialize game engine
    engine = GameEngine()

    # Show initial team status
    print("\nInitial Team Status:")
    for char_id, status in engine.get_team_status().items():
        char = engine.get_character(char_id)
        print(
            f"{char.name}: Level {status['level']}, "
            f"HP {status['hp']:.1f}/{status['max_hp']:.1f}"
        )

    # Demo skill usage
    print(f"\nActive Character: {engine.get_active_character().name}")

    # Use A1's first skill
    a1 = engine.get_active_character()
    if a1.use_skill(SkillType.S1):
        damage = a1.calculate_damage(SkillType.S1)
        print(f"A1 used {a1.skills[SkillType.S1].name} for {damage:.1f} damage!")

    # Grant experience
    if a1.gain_experience(150):
        print(f"A1 leveled up to {a1.stats.level}!")

    # Demo character switching
    print(f"\nSwitching to Unique...")
    if engine.switch_character("Unique"):
        unique = engine.get_active_character()
        print(f"Now controlling: {unique.name}")

    print(f"\nDemo complete!")


if __name__ == "__main__":
    main()
