#!/usr/bin/env python3
"""
Game7 - HTML/JavaScript Bridge

This module provides integration between the Python game engine
and the HTML/JavaScript frontend game.
"""

import json
import os
import threading
import time
from typing import Dict, Any, List
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

from game_engine import GameEngine, CharacterClass, SkillType


class GameBridgeHandler(SimpleHTTPRequestHandler):
    """HTTP handler that bridges Python game engine with HTML/JS frontend"""

    def __init__(self, *args, game_engine=None, **kwargs):
        self.game_engine = game_engine or GameEngine()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)

        # Serve the main game HTML file
        if self.path == "/" or self.path == "/game":
            self.serve_game_html()
            return

        # API endpoints
        if parsed_path.path.startswith("/api/"):
            self.handle_api_request(parsed_path)
            return

        # Serve static files
        super().do_GET()

    def do_POST(self):
        """Handle POST requests for game actions"""
        parsed_path = urlparse(self.path)

        if parsed_path.path.startswith("/api/"):
            self.handle_api_request(parsed_path, method="POST")
            return

        self.send_error(404)

    def serve_game_html(self):
        """Serve the main game HTML file"""
        try:
            with open("game.html", "r", encoding="utf-8") as f:
                content = f.read()

            # Inject JavaScript bridge code
            bridge_js = self.get_bridge_javascript()
            content = content.replace("</body>", f"{bridge_js}\n</body>")

            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.send_header("Content-Length", str(len(content.encode("utf-8"))))
            self.end_headers()
            self.wfile.write(content.encode("utf-8"))

        except FileNotFoundError:
            self.send_error(404, "Game HTML file not found")

    def handle_api_request(self, parsed_path, method="GET"):
        """Handle API requests from the frontend"""
        path_parts = parsed_path.path.split("/")

        if len(path_parts) < 3:
            self.send_error(400, "Invalid API path")
            return

        endpoint = path_parts[2]  # /api/{endpoint}

        try:
            if endpoint == "game_state":
                self.send_game_state()
            elif endpoint == "team_status":
                self.send_team_status()
            elif endpoint == "basic_attack":
                self.handle_basic_attack()
            elif endpoint == "use_skill":
                self.handle_skill_usage()
            elif endpoint == "switch_character":
                self.handle_character_switch()
            elif endpoint == "character_info":
                self.send_character_info(path_parts)
            else:
                self.send_error(404, f"Unknown API endpoint: {endpoint}")

        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def send_game_state(self):
        """Send current game state"""
        state = self.game_engine.to_dict()
        self.send_json_response(state)

    def send_team_status(self):
        """Send team status with focus on A1's melee capabilities"""
        team_status = self.game_engine.get_team_status()

        # Add A1-specific combat info
        if "A1" in team_status:
            a1_char = self.game_engine.get_character("A1")
            team_status["A1"]["combat_type"] = "melee"
            team_status["A1"]["can_reflect_bullets"] = a1_char.stats.can_reflect_bullets
            team_status["A1"]["is_invulnerable"] = a1_char.is_invulnerable()

        self.send_json_response(
            {
                "team_status": team_status,
                "active_character": self.game_engine.active_character,
                "game_over": self.game_engine.check_game_over(),
            }
        )

    def handle_basic_attack(self):
        """Handle basic attack request"""
        if hasattr(self, "_get_post_data"):
            data = self._get_post_data()
            character_id = data.get("character_id", self.game_engine.active_character)
        else:
            character_id = self.game_engine.active_character

        result = self.game_engine.use_basic_attack(character_id)

        # Add A1-specific visual effects
        if character_id == "A1" and result.get("success"):
            result["combat_feedback"] = {
                "type": "melee_combo",
                "slash_effects": result.get("visual_effects", []),
                "bullet_reflection": {
                    "count": result.get("bullet_reflect_count", 0),
                    "enabled": True,
                },
            }

        self.send_json_response(result)

    def handle_skill_usage(self):
        """Handle skill usage request"""
        data = self._get_post_data()
        character_id = data.get("character_id", self.game_engine.active_character)
        skill_type_str = data.get("skill_type", "S1")

        try:
            skill_type = SkillType(skill_type_str.lower())
        except ValueError:
            self.send_json_response(
                {"success": False, "error": f"Invalid skill type: {skill_type_str}"}
            )
            return

        char = self.game_engine.get_character(character_id)
        if not char:
            self.send_json_response({"success": False, "error": "Character not found"})
            return

        success = char.use_skill(skill_type)
        damage = char.calculate_damage(skill_type) if success else 0

        result = {
            "success": success,
            "character_id": character_id,
            "skill_type": skill_type_str,
            "damage": damage,
            "invulnerability_granted": char.is_invulnerable() if success else False,
        }

        self.send_json_response(result)

    def handle_character_switch(self):
        """Handle character switching request"""
        data = self._get_post_data()
        new_character = data.get("character_id")

        if not new_character:
            self.send_json_response(
                {"success": False, "error": "No character specified"}
            )
            return

        success = self.game_engine.switch_character(new_character)
        self.send_json_response(
            {"success": success, "active_character": self.game_engine.active_character}
        )

    def send_character_info(self, path_parts):
        """Send detailed character information"""
        if len(path_parts) < 4:
            character_id = self.game_engine.active_character
        else:
            character_id = path_parts[3]

        char = self.game_engine.get_character(character_id)
        if not char:
            self.send_error(404, "Character not found")
            return

        char_info = {
            "id": char.id,
            "name": char.name,
            "class": char.character_class.value,
            "stats": {
                "level": char.stats.level,
                "hp": char.stats.hp,
                "max_hp": char.stats.max_hp,
                "attack": char.stats.attack,
                "defense": char.stats.defense,
                "rage": char.stats.rage,
                "secret_gauge": char.stats.secret_gauge,
                "is_defeated": char.stats.is_defeated,
                "is_melee_attacker": char.stats.is_melee_attacker,
                "can_reflect_bullets": char.stats.can_reflect_bullets,
                "is_invulnerable": char.is_invulnerable(),
            },
            "skills": {
                skill_type.value: {
                    "name": skill.name,
                    "description": skill.description,
                    "is_melee": skill.is_melee,
                    "is_projectile": skill.is_projectile,
                    "hit_count": skill.hit_count,
                    "bullet_reflect_count": skill.bullet_reflect_count,
                }
                for skill_type, skill in char.skills.items()
                if skill_type != "basic"  # Exclude basic attack from skill list
            },
        }

        self.send_json_response(char_info)

    def _get_post_data(self) -> Dict[str, Any]:
        """Get POST data as JSON"""
        content_length = int(self.headers.get("Content-Length", 0))
        if content_length == 0:
            return {}

        post_data = self.rfile.read(content_length)
        try:
            return json.loads(post_data.decode("utf-8"))
        except (json.JSONDecodeError, UnicodeDecodeError):
            return {}

    def send_json_response(self, data: Dict[str, Any]):
        """Send JSON response"""
        response_data = json.dumps(data, indent=2)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", str(len(response_data.encode("utf-8"))))
        self.end_headers()
        self.wfile.write(response_data.encode("utf-8"))

    def get_bridge_javascript(self) -> str:
        """Generate JavaScript bridge code for frontend integration"""
        return """
<script>
// Game7 Python-JavaScript Bridge
class Game7Bridge {
    constructor() {
        this.baseUrl = '';
        this.updateInterval = 100; // ms
        this.isUpdating = false;
    }

    async makeRequest(endpoint, method = 'GET', data = null) {
        const url = `/api/${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data && method === 'POST') {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            return await response.json();
        } catch (error) {
            console.error('Bridge request failed:', error);
            return { success: false, error: error.message };
        }
    }

    async getGameState() {
        return await this.makeRequest('game_state');
    }

    async getTeamStatus() {
        return await this.makeRequest('team_status');
    }

    async useBasicAttack(characterId = null) {
        return await this.makeRequest('basic_attack', 'POST', { 
            character_id: characterId 
        });
    }

    async useSkill(skillType, characterId = null) {
        return await this.makeRequest('use_skill', 'POST', {
            skill_type: skillType,
            character_id: characterId
        });
    }

    async switchCharacter(characterId) {
        return await this.makeRequest('switch_character', 'POST', {
            character_id: characterId
        });
    }

    async getCharacterInfo(characterId = null) {
        const endpoint = characterId ? `character_info/${characterId}` : 'character_info';
        return await this.makeRequest(endpoint);
    }

    // Enhanced A1 melee attack handling
    async executeA1MeleeCombo() {
        const result = await this.useBasicAttack('A1');
        
        if (result.success && result.combat_feedback) {
            // Trigger visual effects for each slash
            this.displaySlashEffects(result.combat_feedback.slash_effects);
            
            // Handle bullet reflection
            if (result.combat_feedback.bullet_reflection.enabled) {
                this.displayBulletReflection(result.combat_feedback.bullet_reflection.count);
            }
        }
        
        return result;
    }

    displaySlashEffects(slashEffects) {
        // Create visible slash VFX for each hit
        slashEffects.forEach((effect, index) => {
            setTimeout(() => {
                this.createSlashVFX(effect);
            }, index * 100); // 100ms between slashes
        });
    }

    createSlashVFX(effect) {
        // This would integrate with the existing game's VFX system
        console.log(`Slash ${effect.hit_number}: ${effect.damage} damage (${effect.direction})`);
        
        // Trigger existing game effects if available
        if (window.addFloater) {
            window.addFloater(240, 500, `${Math.round(effect.damage)}`, '#ff4d4f');
        }
        
        if (window.st && window.st.effects) {
            window.st.effects.push({
                kind: 'slash',
                x: 240 + (effect.hit_number * 10),
                y: 500,
                vy: -30,
                life: 240,
                max: 240,
                dir: effect.direction === 'left' ? -1 : 1
            });
        }
    }

    displayBulletReflection(count) {
        console.log(`Reflected ${count} bullets`);
        
        // Trigger reflection VFX if available
        if (window.addFloater) {
            window.addFloater(240, 480, `Reflect!`, '#39e1ff');
        }
    }

    startUpdateLoop() {
        if (this.isUpdating) return;
        
        this.isUpdating = true;
        const updateLoop = async () => {
            if (!this.isUpdating) return;
            
            try {
                const teamStatus = await this.getTeamStatus();
                this.updateUI(teamStatus);
            } catch (error) {
                console.error('Update loop error:', error);
            }
            
            setTimeout(updateLoop, this.updateInterval);
        };
        
        updateLoop();
    }

    stopUpdateLoop() {
        this.isUpdating = false;
    }

    updateUI(teamStatus) {
        // Update UI elements based on team status
        // This integrates with the existing HTML game UI
        
        if (teamStatus.team_status && teamStatus.team_status.A1) {
            const a1Status = teamStatus.team_status.A1;
            
            // Update A1 status indicators
            if (a1Status.is_invulnerable) {
                this.showInvulnerabilityEffect();
            }
        }
    }

    showInvulnerabilityEffect() {
        // Visual indicator for invulnerability frames
        console.log('A1 is invulnerable!');
    }
}

// Initialize the bridge
window.game7Bridge = new Game7Bridge();

// Hook into existing game controls if they exist
if (window.useSkill) {
    const originalUseSkill = window.useSkill;
    window.useSkill = function(player, key) {
        // Call Python backend for A1 skills
        if (player && player.id === 'A1') {
            window.game7Bridge.useSkill(key, 'A1').then(result => {
                console.log('A1 skill result:', result);
            });
        }
        
        // Call original function
        return originalUseSkill.apply(this, arguments);
    };
}

// Override basic attack for A1
if (window.st && window.st.players) {
    window.executeA1BasicAttack = function() {
        return window.game7Bridge.executeA1MeleeCombo();
    };
}

console.log('Game7 Bridge initialized');
</script>
        """


def create_game_server(host="localhost", port=8080, game_engine=None):
    """Create and return a game server instance"""

    def handler_factory(*args, **kwargs):
        return GameBridgeHandler(*args, game_engine=game_engine, **kwargs)

    server = HTTPServer((host, port), handler_factory)
    return server


def main():
    """Run the game server"""
    print("Starting Game7 Server...")

    # Initialize game engine
    engine = GameEngine()

    # Create server
    server = create_game_server(game_engine=engine)

    print(f"Server running on http://localhost:8080")
    print("Navigate to http://localhost:8080/game to play")
    print("Press Ctrl+C to stop the server")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
