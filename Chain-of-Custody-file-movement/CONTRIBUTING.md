# Contributing to Chain of Custody File Movement System

Thank you for your interest in contributing to this project! This document provides guidelines for contributing.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork:**
   ```bash
   git clone https://github.com/yashikart/Chain-of-Custody-file-movement.git
   cd Chain-of-Custody-file-movement
   ```
3. **Install dependencies:**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   ```
4. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

## 🔧 Development Setup

### Backend Development
```bash
# Start backend server
npm start
# or for development with auto-reload
npm run dev
```

### Frontend Development
```bash
# Start React development server
cd frontend
npm start
```

### Testing
```bash
# Run API tests
npm test

# Test hash generator
node hash-utilities/manual-hash-generator.js text "test"

# Run Postman collection
newman run postman/Chain-of-Custody-API.postman_collection.json
```

## 📝 Code Style

- Use **ES6+** features
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes and components
- Add **JSDoc comments** for functions
- Include **error handling** for all async operations

## 🧪 Testing Guidelines

- Write tests for new features
- Ensure all existing tests pass
- Test with different file types and sizes
- Verify hash calculations are correct
- Test chain of custody integrity

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure all tests pass**
4. **Update CHANGELOG.md**
5. **Create descriptive commit messages**
6. **Submit pull request** with detailed description

## 🐛 Bug Reports

When reporting bugs, please include:
- **Operating system** and version
- **Node.js version**
- **Steps to reproduce**
- **Expected vs actual behavior**
- **Error messages** or logs
- **Sample files** (if applicable)

## 💡 Feature Requests

For new features, please:
- **Check existing issues** first
- **Describe the use case**
- **Explain the benefit**
- **Consider implementation complexity**
- **Provide examples** if possible

## 🔒 Security

For security vulnerabilities:
- **Do NOT** create public issues
- **Email directly** to maintainer
- **Provide detailed description**
- **Include proof of concept** if safe

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for helping make this project better!
