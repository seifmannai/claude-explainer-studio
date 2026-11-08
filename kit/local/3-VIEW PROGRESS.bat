@echo off
rem Opens the live render progress page (frame, speed, time left, latest image).
if exist "%~dp0out\progress.html" (start "" "%~dp0out\progress.html") else (echo No render running yet. & pause)
