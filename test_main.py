#!/usr/bin/env python3
"""
Tests for main module
"""
from main import main


def test_main():
    """Test main function executes without error."""
    result = main()
    assert result == 0


def test_main_function_exists():
    """Test that main function is callable."""
    assert callable(main)
