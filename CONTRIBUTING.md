# Contributing to Real-Time Height Measurement System

Thank you for your interest in contributing to the Real-Time Height Measurement System! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

Before creating an issue, please check if a similar issue already exists. When creating a new issue, please include:

- **Clear description** of the problem
- **Steps to reproduce** the issue
- **Expected behavior** vs actual behavior
- **Screenshots** if applicable
- **System information** (OS, Python version, Node.js version)
- **Error logs** if any

### Suggesting Enhancements

For feature requests or enhancements:

- Use the "Enhancement" label
- Provide a clear description of the proposed feature
- Explain why this feature would be useful
- Consider the impact on existing functionality

### Pull Requests

1. **Fork the repository** and create a feature branch
2. **Follow the coding standards** (see below)
3. **Write tests** for new functionality
4. **Update documentation** as needed
5. **Ensure all tests pass**
6. **Submit a pull request** with a clear description

## 🛠️ Development Setup

### Prerequisites

- Python 3.12.0+ (recommended) or 3.10.0+
- Node.js 16+
- Git
- CUDA 11.7+ (optional, for GPU acceleration)

### Local Development

1. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/real-time-height-measurement-system.git
   cd real-time-height-measurement-system
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   cd frontend
   npm install --legacy-peer-deps
   cd ..
   ```

4. **Run the application**
   ```bash
   # Terminal 1 - Backend
   python start_backend.py
   
   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

## 📝 Coding Standards

### Python (Backend)

- Follow **PEP 8** style guidelines
- Use **type hints** for function parameters and return values
- Write **docstrings** for all functions and classes
- Keep functions small and focused
- Use meaningful variable and function names

```python
def calculate_height(self, holistic_results, image_shape) -> Optional[Dict[str, Any]]:
    """
    Calculate height from pose landmarks.
    
    Args:
        holistic_results: MediaPipe holistic detection results
        image_shape: Shape of the input image (height, width, channels)
        
    Returns:
        Dictionary containing height data or None if calculation fails
    """
    # Implementation here
```

### TypeScript/React (Frontend)

- Use **TypeScript** for all new components
- Follow **React best practices**
- Use **functional components** with hooks
- Implement **proper error handling**
- Use **styled-components** for styling

```typescript
interface HeightDisplayProps {
  heightData: HeightData | null;
  isDetecting: boolean;
  isCalibrated: boolean;
}

const HeightDisplay: React.FC<HeightDisplayProps> = ({
  heightData,
  isDetecting,
  isCalibrated
}) => {
  // Component implementation
};
```

### Git Commit Messages

Use clear, descriptive commit messages:

```
feat: add Kalman filter for height smoothing
fix: resolve camera permission issue on mobile
docs: update installation instructions
refactor: improve pose detection accuracy
test: add unit tests for height calculation
```

## 🧪 Testing

### Backend Testing

```bash
cd backend
pytest --cov=. --cov-report=html
```

### Frontend Testing

```bash
cd frontend
npm test
```

### Manual Testing

1. Test with different lighting conditions
2. Test with various body positions
3. Test on different devices and browsers
4. Test calibration accuracy

## 📚 Documentation

- Update **README.md** for significant changes
- Add **JSDoc comments** for complex functions
- Update **API documentation** if endpoints change
- Include **screenshots** for UI changes

## 🐛 Bug Fixes

When fixing bugs:

1. **Identify the root cause**
2. **Write a test** that reproduces the bug
3. **Fix the issue**
4. **Ensure the test passes**
5. **Update documentation** if needed

## ✨ New Features

When adding features:

1. **Discuss the feature** in an issue first
2. **Design the implementation** approach
3. **Write tests** before implementation
4. **Implement the feature**
5. **Update documentation**
6. **Add examples** if applicable

## 🔍 Code Review Process

All pull requests require:

- **At least one review** from maintainers
- **All tests passing**
- **No linting errors**
- **Updated documentation**
- **Clear commit messages**

## 📋 Checklist for Pull Requests

- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
- [ ] Commit messages are clear
- [ ] Branch is up to date with main

## 🏷️ Release Process

1. **Version bump** in package.json and requirements.txt
2. **Update CHANGELOG.md**
3. **Create release notes**
4. **Tag the release**
5. **Deploy to production**

## 💬 Getting Help

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and general discussion
- **Email**: [your-email@example.com]

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Real-Time Height Measurement System! 🚀
