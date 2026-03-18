# REVERT BACKUP - March 18, 2026

## QUICK REVERT (if lazy loading breaks site):
```bash
git checkout HEAD~1 -- src/App.jsx src/themes/themeRegistry.js
npm run build
```

## If performance fix breaks something, revert these files:

---

## 0. App.jsx - FULL OLD VERSION (before lazy loading)

```javascript
import { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import ScrollToTop from './components/ScrollToTop';
import PageVisibilityWrapper from './components/PageVisibilityWrapper';
import { useThemeCode } from './context/ThemeCodeContext';
import { getThemeComponent } from './themes/themeRegistry';
import AdminLogin from './admin/Login';
import AdminDashboard from './admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import useSEO from './hooks/useSEO';
```

To revert App.jsx completely:
```bash
git checkout HEAD~1 -- src/App.jsx
```

---

## 1. LandingPage3.jsx - fetchPageContent (lines 390-407)

```javascript
const fetchPageContent = async () => {
  try {
    // Fetch both LP3 and LP2 content in background
    const [lp3Response, lp2Response] = await Promise.all([
      pagesAPI.getOne('landing-page-3'),
      pagesAPI.getOne('landing-page-2'),
    ]);

    if (lp3Response.data?.data?.content) {
      setPageContent(lp3Response.data.data.content);
    }
    if (lp2Response.data?.data?.content) {
      setLp2Content(lp2Response.data.data.content);
    }
  } catch {
    // Silent fail - using default content
  }
};
```

---

## 2. useThemeColors.js - Original fetch (lines 15-36)

```javascript
useEffect(() => {
  if (!pageName) {
    setLoading(false);
    return;
  }

  const fetchColors = async () => {
    try {
      setLoading(true);
      const response = await themeColorsAPI.getByPage(pageName);
      setThemeColors(response.data.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching theme colors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  fetchColors();
}, [pageName]);
```

---

## 3. CaseStudyDetail.jsx - Image import (line 6)

```javascript
import noiseTexture from '@/assets/Image.png';
```

---

## 4. Image.png - Original file

Location: client/src/assets/Image.png
Size: 1,062,127 bytes (1MB)
If compressed version looks bad, restore from git:
```bash
git checkout HEAD -- client/src/assets/Image.png
```

---

## 5. LandingPage3.jsx - CSS Extraction

CSS was extracted from inline `<style>` tag to `LandingPage3.css`.

To revert (put CSS back inline):
1. Delete `src/themes/default/LandingPage3.css`
2. Remove `import './LandingPage3.css';` from LandingPage3.jsx
3. Re-add the inline style block after line 872 (before the modal)
