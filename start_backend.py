#!/usr/bin/env python3
"""
Height Detection System - Backend Startup Script
"""

import subprocess
import sys
import os

def check_dependencies():
    """Check if required dependencies are installed"""
    required_packages = [
        'fastapi', 'uvicorn', 'opencv-python', 'mediapipe', 
        'numpy', 'tensorflow', 'Pillow', 'websockets'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        print("❌ Missing required packages:")
        for package in missing_packages:
            print(f"   - {package}")
        print("\n📦 Install missing packages with:")
        print("   pip install -r requirements.txt")
        return False
    
    print("✅ All required packages are installed")
    return True

def start_backend():
    """Start the FastAPI backend server"""
    if not check_dependencies():
        return
    
    print("🚀 Starting Height Detection System Backend...")
    print("📍 Server will be available at: http://localhost:8000")
    print("📖 API documentation: http://localhost:8000/docs")
    print("🔄 WebSocket endpoint: ws://localhost:8000/ws")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Change to backend directory
        os.chdir('backend')
        
        # Start the server
        subprocess.run([
            sys.executable, '-m', 'uvicorn', 
            'main:app', 
            '--host', '0.0.0.0', 
            '--port', '8000',
            '--reload'
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    start_backend()
