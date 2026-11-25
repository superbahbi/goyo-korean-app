# mobile/src/primitives/

## Responsibility

The mobile screens' DOM component kit: a small, strictly typed React API
surface (`View`, `Text`, `Pressable`, `ScrollView`, `TextInput`, `SafeAreaView`,
`Modal`, `StyleSheet`, `Platform`) that renders standards-compliant DOM, plus
the style translator that turns the RN-flavoured flexbox/shorthand styles the
screens are authored in into plain CSS.

## Design

- **Typed kit, one render path**: screens depend on this module's interface,
  never on `react-native` or `react-native-web`. Every component renders
  `div`/`span`/`button`/`input`/`textarea` markup — there is no native host
  branch anywhere; the kit is what the Vite SPA serves at `/mobile` and what
  the iOS WKWebView shell displays.
- **Style translation** (`flattenStyle`, `rnStyleToCss`): nested style arrays
  merge left-to-right; `paddingHorizontal|Vertical` and
  `marginHorizontal|Vertical` expand to sides; numeric `lineHeight` becomes
  `px`; numeric `flex` maps to `flexGrow`/`flexShrink`/`flexBasis`; any
  positive `border*Width` implies `borderStyle: "solid"`; RN-only keys
  (shadows, `elevation`, `textAlignVertical`, `tintColor`) and non-scalar
  values are dropped.
- Web defaults come from `VIEW_BASE` (flex column, `alignItems: stretch`,
  `flexShrink: 0`, `boxSizing: border-box`), `TEXT_BASE`, and `BUTTON_BASE`.
  `Pressable` renders `<button>` with pressed state from pointer events, `Text`
  a `<span>` (`numberOfLines` → `-webkit-line-clamp`), `TextInput`
  `<input>`/`<textarea>`, `ScrollView` an outer scroller plus an inner track,
  and `SafeAreaView` a `View` padded with `env(safe-area-inset-*)`.
- **Modal** is a fixed overlay with a 640 px-max bottom sheet at `92dvh`,
  padded by `env(safe-area-inset-bottom)`; a backdrop click or Escape calls
  `onRequestClose`, and `visible: false` renders `null`. While open,
  `useModalBehaviour` moves focus into the sheet (`tabIndex=-1`), wraps
  Tab/Shift+Tab inside it, sets `body` `overflow: hidden`, and on close
  restores the scroll style and focuses the opener again. `animationType` is
  accepted for prop-shape stability but unused — the sheet itself does not
  animate.
- Accessibility is translated: `accessibilityRole` → `role`,
  `accessibilityLabel` → `aria-label`, `accessibilityState` →
  `aria-disabled|selected|checked|busy|expanded`, `testID` → `data-testid`.
- `StyleSheet.create` is an identity registry plus `flatten`, `absoluteFill`,
  `hairlineWidth`. `Platform.OS` reports the OS the user agent suggests
  (`ios`/`android`/`web`) and `Platform.select(values)` picks by that result —
  a UX hint only; the render path never branches on it.
- Named exports: `flattenStyle`, `rnStyleToCss`, the seven components,
  `StyleSheet`, `Platform`, and types `PlatformName`, `ViewStyle`,
  `TextStyle`, `StyleProp`, `AccessibilityState`, `ViewProps`, `TextProps`,
  `PressableProps`, `PressableStateCallbackType`, `ScrollViewProps`,
  `TextInputProps`, `ModalProps`.

## Flow

- Props in → `flattenStyle(style)` → `rnStyleToCss` merged over a base style →
  `createElement("div"|"span"|"button"|"input"|"textarea")`.
- Events: `onPress` → `onClick`; `pressed` via `onPointerDown/Up/Leave` and
  `onBlur`; `onChangeText` ← `event.target.value`; Enter on a non-multiline
  input calls `preventDefault()` then `onSubmitEditing`.
- Rendering state out: `Modal` gates the dialog host in `../../App.tsx`, and
  `SafeAreaView` keeps the shell's `flex: 1` root filling the viewport.

## Integration

- Depends only on `react` (`createElement`, `useState`); no domain imports and
  no React Native import of any kind.
- Consumed by every screen in `../components/` and by `../../App.tsx`; all
  mobile styles are authored against these prop types rather than DOM CSS.
- Sibling maps: `../components/codemap.md`, `../context/codemap.md`.
