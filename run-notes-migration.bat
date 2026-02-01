@echo off
echo ====================================
echo   Notes Features Migration
echo ====================================
echo.
echo This will add new features to your notes:
echo - Pin notes
echo - Favorite notes  
echo - Archive notes
echo - Tags/Categories
echo - Priority levels
echo - Due dates
echo - To-Do lists
echo.
echo Press any key to continue or Ctrl+C to cancel...
pause > nul

cd backend
node migrations/add-notes-features.js

echo.
echo ====================================
echo   Migration Complete!
echo ====================================
echo.
echo Next steps:
echo 1. Replace the notes page file (see NOTES_FEATURES_GUIDE.md)
echo 2. Restart your backend server
echo 3. Refresh your browser
echo.
pause
