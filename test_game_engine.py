#!/usr/bin/env python3
"""
Tests for game engine module
"""
from game_engine import (
    GameEngine,
    Character,
    PlayerStats,
    Skill,
    SkillType,
    CharacterClass,
)


def test_game_engine_initialization():
    """Test game engine initializes correctly"""
    engine = GameEngine()
    assert len(engine.characters) == 3
    assert "A1" in engine.characters
    assert "Unique" in engine.characters
    assert "Missy" in engine.characters
    assert engine.active_character == "A1"


def test_character_level_up():
    """Test character leveling system"""
    engine = GameEngine()
    a1 = engine.get_character("A1")

    initial_level = a1.stats.level
    initial_hp = a1.stats.max_hp
    initial_attack = a1.stats.attack

    # Add enough experience to level up
    leveled_up = a1.gain_experience(100)

    assert leveled_up is True
    assert a1.stats.level == initial_level + 1
    assert a1.stats.max_hp > initial_hp
    assert a1.stats.attack > initial_attack


def test_skill_usage():
    """Test skill usage system"""
    engine = GameEngine()
    a1 = engine.get_character("A1")

    # Test normal skill usage
    can_use_s1 = a1.use_skill(SkillType.S1)
    assert can_use_s1 is True

    # Test secret skill without enough gauge
    can_use_x1 = a1.use_skill(SkillType.X1)
    assert can_use_x1 is False

    # Fill secret gauge and try again
    a1.stats.secret_gauge = a1.stats.max_secret_gauge
    can_use_x1_full = a1.use_skill(SkillType.X1)
    assert can_use_x1_full is True
    assert a1.stats.secret_gauge == 0  # Should be consumed


def test_character_switching():
    """Test character switching system"""
    engine = GameEngine()

    # Switch to Unique
    switched = engine.switch_character("Unique")
    assert switched is True
    assert engine.active_character == "Unique"

    # Try to switch to non-existent character
    invalid_switch = engine.switch_character("Invalid")
    assert invalid_switch is False
    assert engine.active_character == "Unique"  # Should remain unchanged


def test_defeat_and_revive():
    """Test character defeat and revival system"""
    engine = GameEngine()
    a1 = engine.get_character("A1")

    # Defeat A1
    engine.defeat_character("A1")
    assert a1.stats.is_defeated is True
    assert a1.stats.revive_time > 0

    # Should auto-switch to another character
    assert engine.active_character != "A1"

    # Revive A1
    revived = engine.revive_character("A1", instant=True)
    assert revived is True
    assert a1.stats.is_defeated is False
    assert a1.stats.revive_time == 0
    assert a1.stats.hp == a1.stats.max_hp


def test_damage_calculation():
    """Test damage calculation system"""
    engine = GameEngine()
    a1 = engine.get_character("A1")

    # Calculate damage for S1
    damage = a1.calculate_damage(SkillType.S1)
    assert damage > 0

    # Activate rage and check for bonus
    a1.stats.rage_active = True
    rage_damage = a1.calculate_damage(SkillType.S1)
    assert rage_damage > damage  # Should be higher with rage


def test_team_status():
    """Test team status retrieval"""
    engine = GameEngine()
    status = engine.get_team_status()

    assert len(status) == 3
    assert "A1" in status
    assert "Unique" in status
    assert "Missy" in status

    for char_id, char_status in status.items():
        assert "hp" in char_status
        assert "max_hp" in char_status
        assert "level" in char_status
        assert "is_defeated" in char_status


def test_game_over_check():
    """Test game over detection"""
    engine = GameEngine()

    # Initially should not be game over
    assert engine.check_game_over() is False

    # Defeat all characters
    for char_id in engine.current_team:
        engine.defeat_character(char_id)

    # Now should be game over
    assert engine.check_game_over() is True


def test_character_classes():
    """Test character class assignments"""
    engine = GameEngine()

    a1 = engine.get_character("A1")
    unique = engine.get_character("Unique")
    missy = engine.get_character("Missy")

    assert a1.character_class == CharacterClass.A1
    assert unique.character_class == CharacterClass.UNIQUE
    assert missy.character_class == CharacterClass.MISSY


def test_skill_types():
    """Test all characters have required skills"""
    engine = GameEngine()

    required_skills = [
        SkillType.S1,
        SkillType.S2,
        SkillType.S3,
        SkillType.S4,
        SkillType.R1,
        SkillType.X1,
    ]

    for char in engine.characters.values():
        for skill_type in required_skills:
            assert skill_type in char.skills
            skill = char.skills[skill_type]
            assert skill.name != ""
            assert skill.base_damage >= 0


def test_serialization():
    """Test game state serialization"""
    engine = GameEngine()

    # Modify some state
    a1 = engine.get_character("A1")
    a1.gain_experience(50)
    engine.gold = 1000

    # Serialize to dict
    game_dict = engine.to_dict()

    assert "characters" in game_dict
    assert "current_team" in game_dict
    assert "active_character" in game_dict
    assert "gold" in game_dict
    assert game_dict["gold"] == 1000


if __name__ == "__main__":
    test_game_engine_initialization()
    test_character_level_up()
    test_skill_usage()
    test_character_switching()
    test_defeat_and_revive()
    test_damage_calculation()
    test_team_status()
    test_game_over_check()
    test_character_classes()
    test_skill_types()
    test_serialization()
    print("All game engine tests passed!")
