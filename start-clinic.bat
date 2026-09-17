@echo off
chcp 65001 > nul
title عيادة د. محمود غنيمة
echo تشغيل نظام إدارة العيادة...
powershell -ExecutionPolicy Bypass -File "%~dp0serve.ps1"
pause
