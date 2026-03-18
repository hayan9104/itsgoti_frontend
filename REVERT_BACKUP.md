# REVERT BACKUP - March 18, 2026

## If performance fix breaks something, revert these files:

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
