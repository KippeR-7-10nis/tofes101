# טופס 101 — הוראות פריסה

## פריסה (3 שלבים)

### שלב 1 — העלה ל-Netlify
1. חלץ את ה-zip
2. גרור את תיקיית `tofes101-netlify` לתוך: https://app.netlify.com/drop

### שלב 2 — הוסף env var אחד בלבד
Site → Site configuration → Environment variables → Add a variable:

| Key | Value |
|-----|-------|
| `RESEND_API_KEY` | `re_Hb7d3sKh_5JyK2QonMBLKRFQ9THxJYLEX` |

לחץ Save → Deploys → Trigger deploy

### שלב 3 — Firebase Storage Rules
Firebase Console → Storage → Rules → החלף ב:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```
(הכתיבה מתבצעת דרך Service Account בלבד — בטוח)

## זהו! הכל עובד.
