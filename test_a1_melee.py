#!/usr/bin/env python3
"""
Tests for A1 melee combat system and bullet reflection mechanics
"""

import unittest
from game_engine import GameEngine, CharacterClass, SkillType
from game_bridge import GameBridgeHandler, create_game_server


class TestA1MeleeCombat(unittest.TestCase):
    """Test A1's melee-only combat mechanics"""

    def setUp(self):
        """Set up test environment"""
        self.engine = GameEngine()
        self.a1 = self.engine.get_character("A1")

    def test_a1_is_melee_attacker(self):
        """Test that A1 is configured as a melee attacker"""
        self.assertTrue(self.a1.stats.is_melee_attacker)
        self.assertTrue(self.a1.stats.can_reflect_bullets)
        self.assertEqual(self.a1.character_class, CharacterClass.A1)

    def test_a1_basic_attack_is_melee(self):
        """Test that A1's basic attack is melee-only"""
        self.assertIn("basic", self.a1.skills)
        basic_skill = self.a1.skills["basic"]

        self.assertTrue(basic_skill.is_melee)
        self.assertFalse(basic_skill.is_projectile)
        self.assertEqual(basic_skill.hit_count, 5)
        self.assertGreater(basic_skill.bullet_reflect_count, 0)

    def test_a1_basic_attack_execution(self):
        """Test A1's basic attack execution"""
        result = self.a1.use_basic_attack()

        self.assertTrue(result["success"])
        self.assertEqual(result["hit_count"], 5)
        self.assertTrue(result["is_melee"])
        self.assertGreater(result["total_damage"], 0)
        self.assertGreater(result["bullet_reflect_count"], 0)

        # Check visual effects
        self.assertIn("visual_effects", result)
        self.assertEqual(len(result["visual_effects"]), 5)  # One effect per hit

        for i, effect in enumerate(result["visual_effects"]):
            self.assertEqual(effect["type"], "slash")
            self.assertEqual(effect["hit_number"], i + 1)
            self.assertGreater(effect["damage"], 0)
            self.assertIn(effect["direction"], ["left", "right"])

    def test_a1_s1_is_projectile(self):
        """Test that A1's S1 skill fires projectiles (exception to melee rule)"""
        s1_skill = self.a1.skills[SkillType.S1]
        self.assertTrue(s1_skill.is_projectile)
        self.assertFalse(s1_skill.is_melee)

    def test_a1_s3_parry_reflection(self):
        """Test A1's S3 skill can reflect many bullets"""
        s3_skill = self.a1.skills[SkillType.S3]
        self.assertTrue(s3_skill.is_melee)
        self.assertGreaterEqual(s3_skill.bullet_reflect_count, 10)

    def test_bullet_reflection_mechanics(self):
        """Test bullet reflection system"""
        # Test reflection capability
        result = self.engine.reflect_bullets("A1", 8)
        self.assertTrue(result["success"])
        self.assertLessEqual(result["reflected_bullets"], 5)  # Max 5 per swing
        self.assertEqual(result["character"], "A1")

    def test_invulnerability_frames(self):
        """Test invulnerability frames for R1 and X1 skills"""
        # Test Rage skill invulnerability
        self.a1.stats.rage = 50  # Ensure enough rage
        self.assertTrue(self.a1.use_skill(SkillType.R1))
        self.assertTrue(self.a1.is_invulnerable())
        self.assertEqual(self.a1.stats.invulnerable_time, 0.4)

        # Test Secret skill invulnerability
        self.a1.stats.secret_gauge = 100  # Full gauge
        self.assertTrue(self.a1.use_skill(SkillType.X1))
        self.assertTrue(self.a1.is_invulnerable())

    def test_invulnerability_timeout(self):
        """Test that invulnerability expires after time"""
        self.a1.stats.invulnerable_time = 0.4
        self.assertTrue(self.a1.is_invulnerable())

        # Simulate time passing
        self.a1.update_rage(0.5)  # 0.5 seconds
        self.assertFalse(self.a1.is_invulnerable())
        self.assertEqual(self.a1.stats.invulnerable_time, 0)

    def test_a1_no_beam_attacks(self):
        """Test that A1 has no beam-based attacks in basic kit"""
        # Check that A1's skills don't include beam attacks
        for skill_type, skill in self.a1.skills.items():
            if skill_type == "basic" or skill_type == SkillType.S1:
                continue  # S1 is allowed projectile, basic is melee

            # Other skills should be melee-based
            if skill.is_projectile:
                self.fail(f"A1 skill {skill_type} should not be projectile-based")


class TestTeamSurvivalSystem(unittest.TestCase):
    """Test team survival and revival mechanics"""

    def setUp(self):
        """Set up test environment"""
        self.engine = GameEngine()

    def test_team_composition(self):
        """Test that team has all three characters"""
        self.assertEqual(len(self.engine.current_team), 3)
        self.assertIn("A1", self.engine.current_team)
        self.assertIn("Unique", self.engine.current_team)
        self.assertIn("Missy", self.engine.current_team)

    def test_character_defeat_and_revival(self):
        """Test character defeat and revival system"""
        # Defeat A1
        self.engine.defeat_character("A1")
        a1 = self.engine.get_character("A1")

        self.assertTrue(a1.stats.is_defeated)
        self.assertGreater(a1.stats.revive_time, 0)
        self.assertLessEqual(a1.stats.revive_time, 60.0)  # Max 60 seconds
        self.assertGreaterEqual(a1.stats.revive_time, 40.0)  # Min 40 seconds

    def test_auto_character_switch_on_defeat(self):
        """Test that active character switches when defeated"""
        original_active = self.engine.active_character
        self.engine.defeat_character(original_active)

        # Should auto-switch to a living character
        new_active = self.engine.active_character
        self.assertNotEqual(original_active, new_active)

        new_char = self.engine.get_character(new_active)
        self.assertFalse(new_char.stats.is_defeated)

    def test_game_over_condition(self):
        """Test game over when all characters are defeated"""
        # Initially no game over
        self.assertFalse(self.engine.check_game_over())

        # Defeat all characters
        for char_id in self.engine.current_team:
            self.engine.defeat_character(char_id)

        # Now should be game over
        self.assertTrue(self.engine.check_game_over())

    def test_revival_system(self):
        """Test character revival mechanics"""
        # Defeat and then revive A1
        self.engine.defeat_character("A1")
        a1 = self.engine.get_character("A1")

        # Instant revive
        self.assertTrue(self.engine.revive_character("A1", instant=True))
        self.assertFalse(a1.stats.is_defeated)
        self.assertEqual(a1.stats.revive_time, 0.0)
        self.assertEqual(a1.stats.hp, a1.stats.max_hp)

    def test_auto_revival_after_timeout(self):
        """Test automatic revival after countdown"""
        # Defeat A1
        self.engine.defeat_character("A1")
        a1 = self.engine.get_character("A1")

        # Simulate time passing beyond revival time
        revival_time = a1.stats.revive_time
        self.engine.update(revival_time + 1.0)

        # Should be automatically revived
        self.assertFalse(a1.stats.is_defeated)
        self.assertEqual(a1.stats.revive_time, 0.0)


class TestGameBridge(unittest.TestCase):
    """Test the HTML/JavaScript bridge functionality"""

    def setUp(self):
        """Set up test environment"""
        self.engine = GameEngine()

    def test_basic_attack_api(self):
        """Test basic attack API endpoint"""
        result = self.engine.use_basic_attack("A1")

        self.assertTrue(result["success"])
        self.assertEqual(result["skill_name"], "Void Sword Combo")
        self.assertTrue(result["is_melee"])
        self.assertEqual(result["hit_count"], 5)
        self.assertGreater(result["total_damage"], 0)
        self.assertIn("visual_effects", result)
        self.assertEqual(len(result["visual_effects"]), 5)

    def test_team_status_api(self):
        """Test team status API endpoint"""
        status = self.engine.get_team_status()

        self.assertIn("A1", status)
        self.assertIn("Unique", status)
        self.assertIn("Missy", status)

        a1_status = status["A1"]
        self.assertIn("hp", a1_status)
        self.assertIn("rage", a1_status)
        self.assertIn("is_defeated", a1_status)

    def test_character_switching_api(self):
        """Test character switching through API"""
        # Switch to Unique
        self.assertTrue(self.engine.switch_character("Unique"))
        self.assertEqual(self.engine.active_character, "Unique")

        # Switch to Missy
        self.assertTrue(self.engine.switch_character("Missy"))
        self.assertEqual(self.engine.active_character, "Missy")

        # Switch back to A1
        self.assertTrue(self.engine.switch_character("A1"))
        self.assertEqual(self.engine.active_character, "A1")

    def test_skill_usage_api(self):
        """Test skill usage through API"""
        a1 = self.engine.get_character("A1")

        # Test S1 skill
        self.assertTrue(a1.use_skill(SkillType.S1))

        # Test Rage skill with sufficient rage
        a1.stats.rage = 50
        self.assertTrue(a1.use_skill(SkillType.R1))
        self.assertTrue(a1.is_invulnerable())


if __name__ == "__main__":
    unittest.main()
