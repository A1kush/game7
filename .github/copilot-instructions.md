# Game7 - Python Development Environment

**ALWAYS reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.**

Game7 is a Python application project currently in early development stage. The repository contains a minimal Python application with testing infrastructure and example code to demonstrate the development workflow.

## Working Effectively

### Environment Setup
- Python 3.12.3 is available in the environment
- Use system-wide pip installation due to network timeout issues with virtual environments
- Install development dependencies with user-local installation:
  ```bash
  pip3 install --user pytest flake8 black
  ```
  **TIMING**: Installation takes ~15-30 seconds. NEVER CANCEL - Set timeout to 120+ seconds.

### Bootstrap and Build Process
- **No complex build process required** - this is a standard Python project
- **Dependencies**: Install using `pip3 install --user -r requirements.txt`
  - **WARNING**: Virtual environment creation works (takes ~3 seconds) but `pip install` inside venv fails due to network timeouts
  - **WORKAROUND**: Always use `pip3 install --user` for global installation
- **No compilation step needed** - Python source files run directly

### Development Workflow Commands
- **Run the application**: `python3 main.py`
  - **TIMING**: Executes in ~0.02 seconds
- **Run tests**: `python3 -m pytest test_main.py -v`
  - **TIMING**: Takes ~0.2 seconds. NEVER CANCEL - Set timeout to 30+ seconds for larger test suites.
- **Lint code**: `python3 -m flake8 *.py`
  - **TIMING**: Takes ~0.15 seconds. NEVER CANCEL - Set timeout to 60+ seconds for larger codebases.
- **Format code**: `python3 -m black *.py`
  - **TIMING**: Takes ~0.2 seconds. NEVER CANCEL - Set timeout to 60+ seconds for larger codebases.

### Pre-commit Validation
**ALWAYS run these commands before committing changes to ensure CI will pass:**
1. `python3 -m black *.py` - Format all Python files
2. `python3 -m flake8 *.py` - Lint all Python files  
3. `python3 -m pytest -v` - Run all tests

**CRITICAL**: All three commands must pass with exit code 0, or the CI will fail.

## Manual Validation Scenarios

**ALWAYS test these scenarios after making changes:**

### Basic Application Functionality
1. **Run the main application**:
   ```bash
   python3 main.py
   ```
   Expected output: "Welcome to Game7!"

2. **Test the complete development cycle**:
   ```bash
   # Format code
   python3 -m black *.py
   # Lint code (must have no errors)
   python3 -m flake8 *.py
   # Run tests (all must pass)
   python3 -m pytest -v
   # Run application
   python3 main.py
   ```

3. **Verify test discovery**:
   ```bash
   python3 -m pytest --collect-only
   ```
   Should discover all test_*.py files.

## Known Limitations and Workarounds

### Network Issues
- **Virtual environments fail**: `python3 -m venv venv` works, but `pip install` inside venv times out
- **WORKAROUND**: Always use `pip3 install --user` for system-wide installation
- **TIMING**: Virtual env creation takes ~3 seconds, but installation fails after ~15 seconds

### Development Dependencies
- **pytest 8.4.2**: Test framework - installs successfully with `--user` flag
- **flake8 7.3.0**: Linting tool - installs successfully with `--user` flag  
- **black 25.1.0**: Code formatter - installs successfully with `--user` flag

## Repository Structure

### Current State (ls -la)
```
.
..
.git/           # Git repository data
.github/        # GitHub configuration (you are creating this)
.gitignore      # Python-focused gitignore
README.md       # Basic project description
main.py         # Main application entry point
test_main.py    # Test suite for main module
requirements.txt # Python dependencies
__pycache__/    # Python bytecode cache (gitignored)
.pytest_cache/  # Pytest cache (gitignored)
```

### Key Files
- **main.py**: Example application module with main() function (demonstrates basic structure)
- **test_main.py**: Example unit tests for main module (demonstrates testing patterns)
- **requirements.txt**: Lists pytest, flake8, black dependencies (managed file for development tools)

## Common Commands Reference

The following are validated commands with expected outputs:

### python3 main.py
```
Welcome to Game7!
```

### python3 -m pytest -v
```
================================================= test session starts ==================================================
platform linux -- Python 3.12.3, pytest-8.4.2, pluggy-1.6.0 -- /usr/bin/python3
cachedir: .pytest_cache
rootdir: /home/runner/work/game7/game7
collecting ... collected 2 items                                                                                                      

test_main.py::test_main PASSED                                                                                   [ 50%]
test_main.py::test_main_function_exists PASSED                                                                   [100%]

================================================== 2 passed in 0.01s ===================================================
```

### python3 -m flake8 *.py (when clean)
```
(no output - exit code 0)
```

### python3 -m black *.py (when already formatted)
```
All done! ✨ 🍰 ✨
2 files left unchanged.
```

## Time Expectations and Timeouts

**CRITICAL**: Always set appropriate timeouts for these operations:

- **Application execution**: <1 second - Set timeout to 30+ seconds
- **Test execution**: <1 second for current tests - Set timeout to 30+ minutes for larger suites
- **Code formatting**: <1 second - Set timeout to 60+ minutes for large codebases
- **Linting**: <1 second - Set timeout to 60+ minutes for large codebases
- **Dependency installation**: 15-30 seconds - Set timeout to 120+ seconds
- **Virtual environment creation**: ~3 seconds - Set timeout to 60+ seconds

**NEVER CANCEL** any build, test, or installation commands. Wait for completion even if they appear to hang.

## Troubleshooting

### Common Issues
1. **Import errors**: Ensure all dependencies are installed with `pip3 install --user -r requirements.txt`
2. **Linting failures**: Run `python3 -m black *.py` to auto-format before linting
3. **Test failures**: Check that main.py is syntactically correct and main() function exists
4. **Network timeouts**: Do not use virtual environments; use `--user` flag with pip3

### Emergency Recovery
If the development environment becomes corrupted:
1. Remove cache directories: `rm -rf __pycache__ .pytest_cache`
2. Reinstall dependencies: `pip3 install --user -r requirements.txt`
3. Verify with: `python3 main.py && python3 -m pytest -v`