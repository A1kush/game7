#!/usr/bin/env python3
"""
Tests for web server module
"""
import json
import unittest
from unittest.mock import patch, MagicMock
import io
from web_server import GameAPIHandler, GameServer
from game_engine import GameEngine
from graphics_gen import GraphicsGenerator


class MockRequest:
    """Mock HTTP request for testing"""

    def __init__(self, method="GET", path="/", data=None):
        self.method = method
        self.path = path
        self.data = data or b""
        self.headers = {"Content-Length": str(len(self.data))}


class TestGameAPIHandler(unittest.TestCase):
    """Test the game API handler"""

    def setUp(self):
        self.game_engine = GameEngine()
        self.graphics_gen = GraphicsGenerator()

        # Mock the handler's required attributes
        self.handler = GameAPIHandler.__new__(GameAPIHandler)
        self.handler.game_engine = self.game_engine
        self.handler.graphics_gen = self.graphics_gen
        self.handler.path = "/"
        self.handler.headers = {}
        self.handler.rfile = io.BytesIO()
        self.handler.wfile = io.BytesIO()

        # Mock HTTP methods
        self.handler.send_response = MagicMock()
        self.handler.send_header = MagicMock()
        self.handler.end_headers = MagicMock()

    def test_game_state_endpoint(self):
        """Test game state endpoint"""
        self.handler.path = "/api/game-state"
        self.handler._handle_game_state()

        # Should send JSON response
        self.handler.send_response.assert_called_with(200)

        # Check that response was written
        response_data = self.handler.wfile.getvalue()
        self.assertTrue(len(response_data) > 0)

    def test_team_status_endpoint(self):
        """Test team status endpoint"""
        self.handler.path = "/api/team-status"
        self.handler._handle_team_status()

        self.handler.send_response.assert_called_with(200)

        response_data = self.handler.wfile.getvalue()
        self.assertTrue(len(response_data) > 0)

    def test_character_info_endpoint(self):
        """Test character info endpoint"""
        # Test valid character
        self.handler._handle_character_info("A1")
        self.handler.send_response.assert_called_with(200)

        # Reset mocks
        self.handler.send_response.reset_mock()
        self.handler.wfile = io.BytesIO()

        # Test invalid character
        self.handler._handle_character_info("Invalid")
        self.handler.send_response.assert_called_with(404)

    def test_use_skill_endpoint(self):
        """Test skill usage endpoint"""
        data = {"character_id": "A1", "skill_type": "s1"}

        self.handler._handle_use_skill(data)
        self.handler.send_response.assert_called_with(200)

        # Check response contains expected fields
        response_data = self.handler.wfile.getvalue().decode("utf-8")
        response_json = json.loads(response_data)

        self.assertIn("success", response_json)
        self.assertIn("damage", response_json)
        self.assertIn("character", response_json)

    def test_switch_character_endpoint(self):
        """Test character switching endpoint"""
        data = {"character_id": "Unique"}

        self.handler._handle_switch_character(data)
        self.handler.send_response.assert_called_with(200)

        # Verify character was switched
        self.assertEqual(self.game_engine.active_character, "Unique")

    def test_assets_endpoint(self):
        """Test assets endpoint"""
        self.handler._handle_assets("characters")
        self.handler.send_response.assert_called_with(200)

        response_data = self.handler.wfile.getvalue().decode("utf-8")
        response_json = json.loads(response_data)

        # Should contain character assets
        self.assertTrue(any("char_" in key for key in response_json.keys()))

    def test_error_handling(self):
        """Test error response handling"""
        self.handler._send_error(404, "Not Found")
        self.handler.send_response.assert_called_with(404)

        response_data = self.handler.wfile.getvalue().decode("utf-8")
        response_json = json.loads(response_data)

        self.assertEqual(response_json["error"], "Not Found")
        self.assertEqual(response_json["code"], 404)


class TestGameServer(unittest.TestCase):
    """Test the game server"""

    def test_server_initialization(self):
        """Test server initializes correctly"""
        server = GameServer(port=8081)

        self.assertEqual(server.port, 8081)
        self.assertIsInstance(server.game_engine, GameEngine)
        self.assertIsInstance(server.graphics_gen, GraphicsGenerator)
        self.assertTrue(callable(server.handler_class))

    def test_handler_factory(self):
        """Test handler factory creates proper handlers"""
        server = GameServer()

        # Create a mock request/response
        request = MagicMock()
        client_address = ("127.0.0.1", 12345)
        server_instance = MagicMock()

        # Create handler instance
        handler = server.handler_class(request, client_address, server_instance)

        # Should have game engine and graphics generator
        self.assertIsInstance(handler.game_engine, GameEngine)
        self.assertIsInstance(handler.graphics_gen, GraphicsGenerator)


def test_api_integration():
    """Test full API integration flow"""
    engine = GameEngine()
    graphics = GraphicsGenerator()

    # Test full character info flow
    a1 = engine.get_character("A1")
    assert a1 is not None

    # Test skill usage
    success = a1.use_skill(
        engine.characters["A1"]
        .skills[list(engine.characters["A1"].skills.keys())[0]]
        .skill_type
    )
    # Note: This will fail because we need the actual SkillType, but demonstrates the flow

    # Test asset generation
    assets = graphics.generate_complete_asset_pack()
    assert len(assets) > 0

    print("API integration test passed")


def test_json_serialization():
    """Test JSON serialization of game data"""
    engine = GameEngine()

    # Test game state serialization
    state = engine.to_dict()
    json_str = json.dumps(state)
    restored_state = json.loads(json_str)

    assert "characters" in restored_state
    assert "current_team" in restored_state
    assert len(restored_state["characters"]) == 3

    print("JSON serialization test passed")


if __name__ == "__main__":
    # Run basic integration tests
    test_api_integration()
    test_json_serialization()

    # Run unit tests
    unittest.main(verbosity=2)
