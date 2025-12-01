@echo off
echo Installing Python dependencies...
pip install -r requirements.txt
echo.
echo Starting Flask server...
python app.py

