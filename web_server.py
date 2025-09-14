#!/usr/bin/env python3
"""
Game7 - Web Integration Module

This module provides the bridge between the Python game engine
and the HTML/JavaScript frontend. It includes:
- HTTP server for game state management
- JSON API endpoints
- Asset serving
- Real-time game state synchronization
"""

import json
import http.server
import socketserver
import urllib.parse
import os
from typing import Dict, Any, Optional
from game_engine import GameEngine, SkillType
from graphics_gen import GraphicsGenerator, ItemRarity


class GameAPIHandler(http.server.BaseHTTPRequestHandler):
    """HTTP request handler for game API endpoints"""

    def __init__(
        self,
        *args,
        game_engine: GameEngine = None,
        graphics_gen: GraphicsGenerator = None,
        **kwargs,
    ):
        self.game_engine = game_engine or GameEngine()
        self.graphics_gen = graphics_gen or GraphicsGenerator()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path
        params = urllib.parse.parse_qs(parsed_path.query)

        try:
            if path == "/api/game-state":
                self._handle_game_state()
            elif path == "/api/team-status":
                self._handle_team_status()
            elif path == "/api/character-info":
                char_id = params.get("id", [""])[0]
                self._handle_character_info(char_id)
            elif path == "/api/assets":
                asset_type = params.get("type", ["all"])[0]
                self._handle_assets(asset_type)
            elif path.startswith("/assets/"):
                self._handle_static_asset(path)
            elif path == "/test_game.html" or path == "/":
                self._serve_game_html()
            else:
                self._send_error(404, "Not Found")
        except Exception as e:
            self._send_error(500, f"Internal Server Error: {str(e)}")

    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urllib.parse.urlparse(self.path)
        path = parsed_path.path

        content_length = int(self.headers.get("Content-Length", 0))
        post_data = self.rfile.read(content_length)

        try:
            data = json.loads(post_data.decode("utf-8")) if post_data else {}

            if path == "/api/use-skill":
                self._handle_use_skill(data)
            elif path == "/api/switch-character":
                self._handle_switch_character(data)
            elif path == "/api/level-up":
                self._handle_level_up(data)
            elif path == "/api/defeat-character":
                self._handle_defeat_character(data)
            elif path == "/api/revive-character":
                self._handle_revive_character(data)
            elif path == "/api/gain-experience":
                self._handle_gain_experience(data)
            else:
                self._send_error(404, "Not Found")
        except Exception as e:
            self._send_error(500, f"Internal Server Error: {str(e)}")

    def _handle_game_state(self):
        """Return complete game state"""
        state = self.game_engine.to_dict()
        self._send_json_response(state)

    def _handle_team_status(self):
        """Return team status"""
        status = self.game_engine.get_team_status()
        self._send_json_response(status)

    def _handle_character_info(self, char_id: str):
        """Return detailed character information"""
        if not char_id:
            self._send_error(400, "Character ID required")
            return

        char = self.game_engine.get_character(char_id)
        if not char:
            self._send_error(404, "Character not found")
            return

        char_info = {
            "id": char.id,
            "name": char.name,
            "character_class": char.character_class.value,
            "stats": {
                "level": char.stats.level,
                "hp": char.stats.hp,
                "max_hp": char.stats.max_hp,
                "attack": char.stats.attack,
                "defense": char.stats.defense,
                "speed": char.stats.speed,
                "luck": char.stats.luck,
                "crit_chance": char.stats.crit_chance,
                "crit_damage": char.stats.crit_damage,
                "rage": char.stats.rage,
                "max_rage": char.stats.max_rage,
                "secret_gauge": char.stats.secret_gauge,
                "max_secret_gauge": char.stats.max_secret_gauge,
                "is_defeated": char.stats.is_defeated,
                "revive_time": char.stats.revive_time,
                "rage_active": char.stats.rage_active,
                "rage_duration": char.stats.rage_duration,
            },
            "skills": {
                skill_type.value: {
                    "name": skill.name,
                    "base_damage": skill.base_damage,
                    "cooldown": skill.cooldown,
                    "hp_cost": skill.hp_cost,
                    "description": skill.description,
                }
                for skill_type, skill in char.skills.items()
            },
            "experience": char.experience,
            "experience_needed": char.experience_needed,
            "skill_points": char.skill_points,
        }

        self._send_json_response(char_info)

    def _handle_assets(self, asset_type: str):
        """Return game assets"""
        if asset_type == "all":
            assets = self.graphics_gen.generate_complete_asset_pack()
        elif asset_type == "characters":
            assets = {}
            characters = ["a1", "unique", "missy"]
            for char in characters:
                assets[f"char_{char}"] = self.graphics_gen.generate_character_sprite(
                    char
                )
                assets[f"char_{char}_aura"] = (
                    self.graphics_gen.generate_character_sprite(char, with_aura=True)
                )
        elif asset_type == "items":
            assets = {}
            item_types = ["sword", "gun", "potion", "gem", "shield"]
            rarities = list(ItemRarity)
            for item_type in item_types:
                for rarity in rarities:
                    key = f"{item_type}_{rarity.value}"
                    assets[key] = self.graphics_gen.generate_item_icon(
                        item_type, rarity
                    )
        elif asset_type == "effects":
            assets = {}
            assets["aura_power"] = self.graphics_gen.generate_aura_effect("power")
            assets["aura_rage"] = self.graphics_gen.generate_aura_effect("rage")
        else:
            self._send_error(400, f"Unknown asset type: {asset_type}")
            return

        # Convert sprites to JSON-serializable format
        assets_json = {}
        for name, sprite in assets.items():
            assets_json[name] = {
                "width": sprite.width,
                "height": sprite.height,
                "frames": sprite.frames,
                "colors": {
                    char: {
                        "r": color.r,
                        "g": color.g,
                        "b": color.b,
                        "a": color.a,
                        "hex": color.to_hex(),
                        "rgba": color.to_rgba(),
                    }
                    for char, color in sprite.colors.items()
                },
                "animation_speed": sprite.animation_speed,
            }

        self._send_json_response(assets_json)

    def _handle_use_skill(self, data: Dict[str, Any]):
        """Handle skill usage"""
        char_id = data.get("character_id")
        skill_type_str = data.get("skill_type")

        if not char_id or not skill_type_str:
            self._send_error(400, "Character ID and skill type required")
            return

        try:
            skill_type = SkillType(skill_type_str)
        except ValueError:
            self._send_error(400, f"Invalid skill type: {skill_type_str}")
            return

        char = self.game_engine.get_character(char_id)
        if not char:
            self._send_error(404, "Character not found")
            return

        success = char.use_skill(skill_type)
        damage = char.calculate_damage(skill_type) if success else 0

        response = {
            "success": success,
            "damage": damage,
            "character": char_id,
            "skill": skill_type_str,
            "character_state": {
                "hp": char.stats.hp,
                "rage": char.stats.rage,
                "secret_gauge": char.stats.secret_gauge,
                "rage_active": char.stats.rage_active,
            },
        }

        self._send_json_response(response)

    def _handle_switch_character(self, data: Dict[str, Any]):
        """Handle character switching"""
        char_id = data.get("character_id")

        if not char_id:
            self._send_error(400, "Character ID required")
            return

        success = self.game_engine.switch_character(char_id)

        response = {
            "success": success,
            "active_character": self.game_engine.active_character,
        }

        self._send_json_response(response)

    def _handle_level_up(self, data: Dict[str, Any]):
        """Handle character leveling"""
        char_id = data.get("character_id")

        if not char_id:
            self._send_error(400, "Character ID required")
            return

        char = self.game_engine.get_character(char_id)
        if not char:
            self._send_error(404, "Character not found")
            return

        leveled_up = char.level_up()

        response = {
            "leveled_up": leveled_up,
            "level": char.stats.level,
            "skill_points": char.skill_points,
            "stats": {
                "max_hp": char.stats.max_hp,
                "attack": char.stats.attack,
                "defense": char.stats.defense,
            },
        }

        self._send_json_response(response)

    def _handle_defeat_character(self, data: Dict[str, Any]):
        """Handle character defeat"""
        char_id = data.get("character_id")

        if not char_id:
            self._send_error(400, "Character ID required")
            return

        self.game_engine.defeat_character(char_id)

        response = {
            "defeated": char_id,
            "active_character": self.game_engine.active_character,
            "game_over": self.game_engine.check_game_over(),
        }

        self._send_json_response(response)

    def _handle_revive_character(self, data: Dict[str, Any]):
        """Handle character revival"""
        char_id = data.get("character_id")
        instant = data.get("instant", False)

        if not char_id:
            self._send_error(400, "Character ID required")
            return

        success = self.game_engine.revive_character(char_id, instant)

        response = {"success": success, "character": char_id}

        self._send_json_response(response)

    def _handle_gain_experience(self, data: Dict[str, Any]):
        """Handle experience gain"""
        char_id = data.get("character_id")
        amount = data.get("amount", 0)

        if not char_id:
            self._send_error(400, "Character ID required")
            return

        char = self.game_engine.get_character(char_id)
        if not char:
            self._send_error(404, "Character not found")
            return

        leveled_up = char.gain_experience(amount)

        response = {
            "experience_gained": amount,
            "leveled_up": leveled_up,
            "experience": char.experience,
            "experience_needed": char.experience_needed,
            "level": char.stats.level,
        }

        self._send_json_response(response)

    def _handle_static_asset(self, path: str):
        """Serve static asset files"""
        # For now, return 404 for static assets
        # In a full implementation, this would serve actual image files
        self._send_error(404, "Static assets not implemented")

    def _serve_game_html(self):
        """Serve the main game HTML file"""
        try:
            with open("test_game.html", "r", encoding="utf-8") as f:
                content = f.read()

            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content.encode("utf-8"))))
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))
        except FileNotFoundError:
            self._send_error(404, "Game HTML file not found")

    def _send_json_response(self, data: Any):
        """Send JSON response"""
        response = json.dumps(data, indent=2)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response.encode("utf-8"))))
        self.send_header("Access-Control-Allow-Origin", "*")  # Enable CORS
        self.end_headers()
        self.wfile.write(response.encode("utf-8"))

    def _send_error(self, code: int, message: str):
        """Send error response"""
        error_response = {"error": message, "code": code}
        response = json.dumps(error_response)
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(response.encode("utf-8"))))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(response.encode("utf-8"))


class GameServer:
    """Game HTTP server"""

    def __init__(self, port: int = 8080):
        self.port = port
        self.game_engine = GameEngine()
        self.graphics_gen = GraphicsGenerator()

        # Create custom handler class with our game instances
        def handler_factory(*args, **kwargs):
            return GameAPIHandler(
                *args,
                game_engine=self.game_engine,
                graphics_gen=self.graphics_gen,
                **kwargs,
            )

        self.handler_class = handler_factory

    def start(self):
        """Start the game server"""
        try:
            with socketserver.TCPServer(("", self.port), self.handler_class) as httpd:
                print(f"Game7 Server starting on port {self.port}")
                print(f"Game available at: http://localhost:{self.port}/")
                print(f"API endpoints available at: http://localhost:{self.port}/api/")
                print("\nAvailable API endpoints:")
                print("  GET  /api/game-state      - Complete game state")
                print("  GET  /api/team-status     - Team member status")
                print("  GET  /api/character-info?id=<char_id> - Character details")
                print(
                    "  GET  /api/assets?type=<type> - Game assets (all, characters, items, effects)"
                )
                print("  POST /api/use-skill       - Use character skill")
                print("  POST /api/switch-character - Switch active character")
                print("  POST /api/gain-experience - Add experience to character")
                print("  POST /api/defeat-character - Defeat character")
                print("  POST /api/revive-character - Revive character")
                print("\nPress Ctrl+C to stop the server")

                httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down Game7 Server...")
        except Exception as e:
            print(f"Server error: {e}")


def main():
    """Start the Game7 web server"""
    import argparse

    parser = argparse.ArgumentParser(description="Game7 Web Server")
    parser.add_argument(
        "--port",
        type=int,
        default=8080,
        help="Port to run the server on (default: 8080)",
    )

    args = parser.parse_args()

    server = GameServer(args.port)
    server.start()


if __name__ == "__main__":
    main()
