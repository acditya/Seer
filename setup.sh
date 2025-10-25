#!/bin/bash
# Seer Setup Script for macOS/Linux
# Automates the setup process for both server and client

set -e  # Exit on error

echo "🔮 Seer Setup Script"
echo "===================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Check prerequisites
echo "Checking prerequisites..."

# Check Python
if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.9 or higher."
    exit 1
fi
print_success "Python 3 found: $(python3 --version)"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18 or higher."
    exit 1
fi
print_success "Node.js found: $(node --version)"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm."
    exit 1
fi
print_success "npm found: $(npm --version)"

echo ""
echo "===================="
echo "Setting up server..."
echo "===================="

# Navigate to server directory
cd server

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv .venv
    print_success "Virtual environment created"
else
    print_info "Virtual environment already exists"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
print_info "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
print_success "Python dependencies installed"

# Check for .env file
if [ ! -f ".env" ]; then
    print_error ".env file not found in server/"
    print_info "Please create server/.env from ENV_TEMPLATE.txt"
    print_info "Run: cp ENV_TEMPLATE.txt server/.env"
    print_info "Then fill in your API keys"
    exit 1
else
    print_success ".env file found"
fi

# Deactivate virtual environment
deactivate

cd ..

echo ""
echo "===================="
echo "Setting up client..."
echo "===================="

# Navigate to client directory
cd client

# Install dependencies
print_info "Installing Node.js dependencies..."
npm install
print_success "Node.js dependencies installed"

# Check app.config.ts for SERVER_URL
if grep -q "localhost:8000" app.config.ts; then
    print_error "SERVER_URL still set to localhost in app.config.ts"
    print_info "Please update SERVER_URL to your local IP address"
    print_info "Find your IP:"
    print_info "  macOS: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
    print_info "  Linux: ip addr show | grep 'inet ' | grep -v 127.0.0.1"
    echo ""
    print_info "Then update app.config.ts:"
    print_info "  serverUrl: 'http://YOUR_IP:8000'"
fi

cd ..

echo ""
echo "===================="
echo "Setup Complete! 🎉"
echo "===================="
echo ""
echo "Next steps:"
echo ""
echo "1. Update server/.env with your API keys (if not done)"
echo "   - Azure OpenAI credentials"
echo "   - ElevenLabs API key"
echo "   - OpenAI API key (for Whisper)"
echo ""
echo "2. Update client/app.config.ts with your local IP"
echo ""
echo "3. Start the server:"
echo "   cd server"
echo "   source .venv/bin/activate"
echo "   python main.py"
echo ""
echo "4. In a new terminal, start the client:"
echo "   cd client"
echo "   npm start"
echo ""
echo "5. Scan QR code with Expo Go on your iOS device"
echo ""
echo "For detailed instructions, see:"
echo "  - QUICKSTART.md"
echo "  - README.md"
echo ""
print_success "Happy navigating! 🎯"

