# Breaking Changes Report - Package Upgrades

## Summary
This document outlines all breaking changes discovered after upgrading npm packages to their latest versions.

## Major Version Upgrades
- **React**: 18.3.1 → 19.2.3 (Major)
- **Chakra UI**: 2.8.2 → 3.30.0 (Major)
- **Vite**: 6.3.5 → 7.3.0 (Major)
- **ESLint**: 8.57.1 → 9.39.2 (Major)
- **React Router**: 6.24.0 → 7.11.0 (Major)

---

## 🔴 Critical Breaking Changes (Must Fix)

### 1. Chakra UI v3 - Removed `useColorModeValue` Hook
**Status**: ❌ BREAKING - Build fails

**Issue**: `useColorModeValue` has been completely removed from Chakra UI v3.

**Affected Files** (34 occurrences):
- `src/features/pilots/components/PilotCard.jsx`
- `src/features/dashboard/pages/DashboardPage.jsx`
- `src/shared/components/Sidebar.jsx`
- `src/shared/components/Navbar.jsx`
- `src/features/pilots/pages/QualificationTablePage.jsx`
- `src/features/users/components/UserDataCard.jsx`
- `src/features/qualifications/components/QualificationGroupFilter.jsx`

**Migration Options**:
1. **Use CSS Variables/Semantic Tokens** (Recommended for Chakra UI v3)
2. **Create a custom hook** that uses Chakra UI v3's new theming system
3. **Use a theme library** like `next-themes` for color mode management

**Example Fix**:
```jsx
// OLD (v2):
const bgColor = useColorModeValue("gray.50", "gray.900");

// NEW (v3) - Using semantic tokens:
const bgColor = "bg.subtle"; // or use CSS variables
```

### 2. Chakra UI v3 - Removed `useColorMode` Hook
**Status**: ⚠️ BREAKING - Used in multiple files

**Affected Files**:
- `src/shared/layout/Header.jsx`
- `src/features/flights/components/FlightCard.jsx`
- `src/shared/components/StyledText.jsx`

**Migration**: Chakra UI v3 recommends using external libraries like `next-themes` or `remix-themes` for color mode management.

### 3. Chakra UI v3 - `ChakraProvider` → `Provider`
**Status**: ⚠️ POTENTIAL BREAKING

**Affected Files**:
- `src/main.jsx`

**Note**: Need to verify if `ChakraProvider` still works or must be changed to `Provider`. The new API uses `Provider` component.

### 4. React Router v7 - Removed `exact` Prop
**Status**: ✅ FIXED

**Issue**: The `exact` prop on `<Route>` components has been removed in React Router v7.

**Fixed**: Removed `exact` prop from `src/App.jsx` line 52.

---

## ⚠️ Potential Breaking Changes (Need Testing)

### 5. React 19 - JSX Transform
**Status**: ✅ Likely OK

**Note**: React 19 requires the new JSX transform. Vite 7 with `@vitejs/plugin-react` v5 should handle this automatically. Already using `createRoot` which is correct.

### 6. React 19 - Error Handling
**Status**: ⚠️ Monitor

**Change**: Uncaught errors during rendering are now reported to `window.reportError`. Review error boundaries and error handling.

### 7. Vite 7 - Configuration Changes
**Status**: ✅ Likely OK

**Note**: Current `vite.config.js` appears compatible. Vite 7 is mostly backward compatible with v6.

### 8. ESLint 9 - Flat Config
**Status**: ✅ Already Using

**Note**: Already using flat config (`eslint.config.js`), which is correct for ESLint 9.

---

## 📋 Action Items

### Immediate (Required for Build)
1. ✅ Fix React Router `exact` prop (DONE)
2. ❌ Replace all `useColorModeValue` usages (34 occurrences)
3. ❌ Replace all `useColorMode` usages (3 files)
4. ❌ Verify/Update `ChakraProvider` → `Provider` if needed

### Testing Required
1. Test all components that used `useColorModeValue`
2. Test color mode toggle functionality
3. Test routing (especially `/recovery/:token/:email` route)
4. Test all forms and modals
5. Test error boundaries and error handling

### Documentation
- Review Chakra UI v3 migration guide: https://chakra-ui.com/getting-started/migration
- Review React 19 upgrade guide: https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- Review React Router v7 migration: https://reactrouter.com/en/main/upgrading/v6-to-v7

---

## Migration Strategy Recommendations

### For Chakra UI v3 Color Mode:
1. **Option A**: Install `next-themes` and migrate to their color mode system
2. **Option B**: Use Chakra UI v3's new semantic tokens and CSS variables
3. **Option C**: Create a compatibility shim hook (temporary solution)

### Priority Order:
1. Fix build-breaking issues (`useColorModeValue`)
2. Test application functionality
3. Address color mode management
4. Optimize and clean up

---

## Notes
- ESLint config is already using flat config format (good!)
- Vite config appears compatible
- React 19 migration looks mostly compatible (already using `createRoot`)
- Main issues are Chakra UI v3 API changes

