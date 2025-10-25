# Contributing to Seer

Thank you for your interest in contributing to Seer! This guide will help you get started.

## Development Setup

Follow the [QUICKSTART.md](QUICKSTART.md) guide to set up your development environment.

## Project Structure

### Server (`server/`)
- **`main.py`**: FastAPI application with all endpoints
- **`model.py`**: YOLO detection logic
- **`stt.py`**: Speech-to-text (Whisper)
- **`tts.py`**: Text-to-speech (ElevenLabs)
- **`plan.py`**: Navigation planning (Azure OpenAI)

### Client (`client/`)
- **`App.tsx`**: Main application component
- **`src/api.ts`**: API client and type definitions
- **`src/hooks/useNavigationLoop.ts`**: State machine and navigation logic
- **`src/components/`**: UI components
- **`src/styles/tokens.ts`**: Design tokens

## How to Contribute

### 1. Reporting Bugs

Open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots/logs if applicable
- Device/OS information

### 2. Suggesting Features

Open an issue with:
- Clear description of the feature
- Use case and benefits
- Mockups or examples if applicable
- Consider accessibility implications

### 3. Submitting Code

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Test thoroughly
5. Commit with clear messages: `git commit -m "Add: feature description"`
6. Push to your fork: `git push origin feature/my-feature`
7. Open a Pull Request

## Coding Standards

### Python (Server)

- Follow PEP 8 style guide
- Use type hints where possible
- Add docstrings for functions
- Keep functions small and focused
- Handle errors gracefully

Example:
```python
def detect_objects(image_bytes: bytes) -> Dict[str, Any]:
    """
    Detect objects in image using YOLO.
    
    Args:
        image_bytes: JPEG image bytes
        
    Returns:
        Dictionary with detections and metadata
    """
    # Implementation
```

### TypeScript (Client)

- Strict mode enabled
- Use TypeScript types (avoid `any`)
- Functional components with hooks
- Use Zod for runtime validation
- Comments for non-obvious logic

Example:
```typescript
interface NavigationState {
  checkpoint: string | null;
  isNavigating: boolean;
}

export function useNavigation(): NavigationState {
  // Implementation
}
```

### Accessibility

- Use semantic HTML/React Native elements
- Add `accessibilityLabel` and `accessibilityRole`
- Ensure touch targets ≥ 44x44 points
- Test with VoiceOver on iOS
- Provide haptic feedback for state changes

## Testing

### Server Testing

```bash
cd server
source .venv/bin/activate

# Run with verbose logging
uvicorn main:app --reload --log-level debug

# Test endpoints
pytest  # if you add tests
```

### Client Testing

```bash
cd client

# Type checking
npx tsc --noEmit

# Run on device
npm start
```

## Areas for Contribution

### High Priority

1. **Offline mode**: Cache TTS, use local Whisper
2. **Better error handling**: Retry logic, offline queuing
3. **Performance**: Reduce latency, optimize frame processing
4. **Accessibility**: Enhanced VoiceOver support, more haptic patterns
5. **Testing**: Unit tests, integration tests

### Medium Priority

1. **Multi-language support**: i18n for instructions
2. **Custom voices**: User-selectable TTS voices
3. **Route history**: Save and replay routes
4. **Obstacle warnings**: More sophisticated safety logic
5. **Settings UI**: Adjust speed, verbosity, etc.

### Low Priority (Nice to Have)

1. **Android support**: Extend to Android devices
2. **Web version**: Browser-based interface
3. **Analytics**: Usage tracking (privacy-preserving)
4. **Social features**: Share routes, crowdsourced checkpoints
5. **Advanced AI**: Fine-tune models on accessibility data

## Feature Ideas

### 1. Improved Object Detection

Enhance YOLO detections:
- Train on indoor navigation dataset
- Add depth estimation (ARKit)
- Recognize specific landmarks (signs, room numbers)

**Files to modify:**
- `server/model.py`: Add depth processing
- `server/plan.py`: Use depth in planning logic

### 2. Voice Customization

Allow users to customize voice and speech rate:
- Add settings screen
- Store preferences locally
- Pass to TTS API

**Files to modify:**
- `client/src/components/Settings.tsx` (new)
- `client/src/api.ts`: Add rate parameter
- `server/tts.py`: Support voice rate

### 3. Offline Mode

Cache common phrases for offline use:
- Pre-generate TTS for common phrases
- Use local Whisper model
- Cache YOLO detections

**Files to modify:**
- `client/src/api.ts`: Add cache layer
- `server/main.py`: Add caching endpoints
- Consider using `react-native-fs` for storage

### 4. Route Recording

Save and replay successful routes:
- Record frame + instruction pairs
- Store locally or in cloud
- Replay for repeated paths

**Files to modify:**
- `client/src/hooks/useRouteRecorder.ts` (new)
- `client/src/storage.ts` (new)
- Add UI for route management

## Git Workflow

### Commit Messages

Use conventional commits format:
- `feat: add offline mode`
- `fix: correct YOLO detection bounds`
- `docs: update API guide`
- `refactor: simplify navigation logic`
- `test: add TTS unit tests`

### Branch Naming

- `feature/description`: New features
- `fix/description`: Bug fixes
- `docs/description`: Documentation updates
- `refactor/description`: Code refactoring

## Release Process

1. Update version in `package.json` and `app.json`
2. Update `CHANGELOG.md` (if exists)
3. Test on multiple devices
4. Create release branch: `release/v1.x.x`
5. Tag release: `git tag v1.x.x`
6. Push to main and deploy

## Community

- Be respectful and inclusive
- Help others learn and grow
- Share knowledge and insights
- Focus on accessibility and user impact

## Questions?

Open a discussion or issue on GitHub. We're here to help!

Thank you for contributing to making navigation accessible for everyone. 🎯

