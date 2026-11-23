import { createElement, useState } from "react";
import type {
  ButtonHTMLAttributes,
  ChangeEvent,
  CSSProperties,
  HTMLAttributes,
  InputHTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactElement,
  ReactNode,
  TextareaHTMLAttributes,
} from "react";

/**
 * Strictly typed DOM component kit for the mobile screens.
 *
 * Every component here renders standards-compliant markup (`div`, `span`,
 * `button`, `input`, `textarea`) — this is the only render path, both in
 * browsers and inside the iOS WKWebView shell. The prop shapes (flexbox
 * styles, `paddingHorizontal`/`marginVertical` shorthands, pixel `lineHeight`,
 * `accessibilityRole`/`testID`) are kept as the screens author them, and
 * `rnStyleToCss` translates those RN-flavoured styles into plain DOM CSS so
 * the layout matches what the shorthand props promise.
 */

export type PlatformName = "web" | "ios" | "android";
type StyleValue = string | number | { width: number; height: number };

export interface ViewStyle {
  [key: string]: StyleValue | undefined;
}
export interface TextStyle extends ViewStyle {
  color?: string;
  fontSize?: number;
  fontWeight?: string | number;
  fontFamily?: string;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: string;
  textTransform?: string;
  textDecorationLine?: string;
}
export type StyleProp<T> =
  | T
  | false
  | null
  | undefined
  | ReadonlyArray<StyleProp<T>>;
type AnyStyle = ViewStyle | TextStyle;

/** Merge a style object or any nesting of arrays into one object. */
export function flattenStyle<T extends AnyStyle>(
  style: StyleProp<T>
): T | undefined {
  if (!style) return undefined;
  if (Array.isArray(style)) {
    const merged: Record<string, StyleValue> = {};
    let present = false;
    for (const entry of style as ReadonlyArray<StyleProp<T>>) {
      const flat = flattenStyle(entry);
      if (flat) {
        Object.assign(merged, flat);
        present = true;
      }
    }
    return present ? (merged as T) : undefined;
  }
  return style as T;
}

const RN_ONLY_KEYS = new Set([
  "paddingHorizontal",
  "paddingVertical",
  "marginHorizontal",
  "marginVertical",
  "textAlignVertical",
  "shadowColor",
  "shadowOffset",
  "shadowOpacity",
  "shadowRadius",
  "elevation",
]);

function hasPositiveNumber(value: StyleValue | undefined): boolean {
  return typeof value === "number" && value > 0;
}

/**
 * Converts a flattened RN-flavoured style object into a valid React DOM
 * CSSProperties object.
 */
export function rnStyleToCss(
  style: StyleProp<AnyStyle>
): CSSProperties | undefined {
  const flat = flattenStyle(style);
  if (!flat) return undefined;

  const css: Record<string, string | number | undefined> = {};

  if (flat.paddingHorizontal !== undefined) {
    css.paddingLeft = flat.paddingHorizontal as string | number;
    css.paddingRight = flat.paddingHorizontal as string | number;
  }
  if (flat.paddingVertical !== undefined) {
    css.paddingTop = flat.paddingVertical as string | number;
    css.paddingBottom = flat.paddingVertical as string | number;
  }
  if (flat.marginHorizontal !== undefined) {
    css.marginLeft = flat.marginHorizontal as string | number;
    css.marginRight = flat.marginHorizontal as string | number;
  }
  if (flat.marginVertical !== undefined) {
    css.marginTop = flat.marginVertical as string | number;
    css.marginBottom = flat.marginVertical as string | number;
  }

  for (const [key, value] of Object.entries(flat)) {
    if (value === undefined || RN_ONLY_KEYS.has(key)) continue;
    if (key === "lineHeight" && typeof value === "number") {
      // React DOM treats numeric lineHeight as a unitless multiplier; the
      // screens' styles specify pixels.
      css.lineHeight = `${value}px`;
    } else if (key === "flex" && typeof value === "number") {
      if (value > 0) {
        css.flexGrow = value;
        css.flexShrink = 1;
        css.flexBasis = "0%";
      } else if (value === 0) {
        css.flexGrow = 0;
        css.flexShrink = 0;
        css.flexBasis = "auto";
      }
    } else if (typeof value === "string" || typeof value === "number") {
      css[key] = value;
    }
  }

  // Any positive border width implies a solid border, matching how the
  // shorthand styles are authored.
  if (
    css.borderStyle === undefined &&
    (hasPositiveNumber(flat.borderWidth) ||
      hasPositiveNumber(flat.borderTopWidth) ||
      hasPositiveNumber(flat.borderRightWidth) ||
      hasPositiveNumber(flat.borderBottomWidth) ||
      hasPositiveNumber(flat.borderLeftWidth))
  ) {
    css.borderStyle = "solid";
  }

  return css as CSSProperties;
}

export interface AccessibilityState {
  disabled?: boolean;
  selected?: boolean;
  checked?: boolean | "mixed";
  busy?: boolean;
  expanded?: boolean;
}
interface BaseProps {
  accessibilityRole?: string;
  accessibilityLabel?: string;
  accessibilityState?: AccessibilityState;
  testID?: string;
  id?: string;
  children?: ReactNode;
}
export interface ViewProps extends BaseProps {
  style?: StyleProp<ViewStyle>;
}
export interface TextProps extends BaseProps {
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}
export interface PressableStateCallbackType {
  pressed: boolean;
}
export interface PressableProps extends BaseProps {
  onPress?: () => void;
  disabled?: boolean;
  style?:
    | StyleProp<ViewStyle>
    | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
}
export interface ScrollViewProps extends BaseProps {
  style?: StyleProp<ViewStyle>;
  contentContainerStyle?: StyleProp<ViewStyle>;
  horizontal?: boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
}
export interface TextInputProps extends Omit<BaseProps, "children"> {
  style?: StyleProp<TextStyle>;
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  placeholderTextColor?: string;
  secureTextEntry?: boolean;
  keyboardType?: string;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  multiline?: boolean;
  editable?: boolean;
  maxLength?: number;
  onSubmitEditing?: () => void;
}
export interface ModalProps {
  visible: boolean;
  transparent?: boolean;
  /** Kept for prop-shape stability; the DOM sheet animates via CSS, not JS. */
  animationType?: "none" | "slide" | "fade";
  onRequestClose?: () => void;
  testID?: string;
  children?: ReactNode;
}

const VIEW_BASE: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  flexShrink: 0,
  boxSizing: "border-box",
  minWidth: 0,
  minHeight: 0,
  position: "relative",
};

const TEXT_BASE: CSSProperties = {
  boxSizing: "border-box",
  margin: 0,
  padding: 0,
  fontFamily: "inherit",
};

const BUTTON_BASE: CSSProperties = {
  ...VIEW_BASE,
  borderWidth: 0,
  borderStyle: "solid",
  borderColor: "transparent",
  backgroundColor: "transparent",
  padding: 0,
  margin: 0,
  font: "inherit",
  color: "inherit",
  textAlign: "inherit",
  appearance: "none",
  WebkitTapHighlightColor: "transparent",
};

const stateProps = (state?: AccessibilityState) => ({
  "aria-disabled": state?.disabled ? "true" : undefined,
  "aria-selected": state?.selected ? "true" : undefined,
  "aria-checked":
    state?.checked === "mixed" ? "mixed" : state?.checked ? "true" : undefined,
  "aria-busy": state?.busy ? "true" : undefined,
  "aria-expanded": state?.expanded ? "true" : undefined,
});

export function View({
  style,
  children,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  testID,
  id,
}: ViewProps): ReactElement {
  const flat = flattenStyle(style);
  const props = {
    id,
    role: accessibilityRole,
    "aria-label": accessibilityLabel,
    "data-testid": testID,
    ...stateProps(accessibilityState),
    style: { ...VIEW_BASE, ...rnStyleToCss(flat) },
  } as HTMLAttributes<HTMLDivElement>;
  return createElement("div", props, children);
}

export function Text({
  style,
  children,
  numberOfLines,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  testID,
  id,
}: TextProps): ReactElement {
  const flat = flattenStyle(style);
  const base: CSSProperties = { ...TEXT_BASE, ...rnStyleToCss(flat) };
  const clamped: CSSProperties = numberOfLines
    ? {
        ...base,
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: numberOfLines,
        overflow: "hidden",
      }
    : base;
  const props = {
    id,
    role: accessibilityRole,
    "aria-label": accessibilityLabel,
    "data-testid": testID,
    ...stateProps(accessibilityState),
    style: clamped,
  } as HTMLAttributes<HTMLSpanElement>;
  return createElement("span", props, children);
}

export function Pressable({
  style,
  children,
  onPress,
  disabled,
  accessibilityRole,
  accessibilityLabel,
  accessibilityState,
  testID,
  id,
}: PressableProps): ReactElement {
  const [pressed, setPressed] = useState(false);
  const resolved = typeof style === "function" ? style({ pressed }) : style;
  const flat = flattenStyle(resolved);
  const props = {
    id,
    type: "button",
    role: accessibilityRole ?? "button",
    "aria-label": accessibilityLabel,
    "data-testid": testID,
    disabled,
    onClick: onPress,
    ...stateProps({
      ...accessibilityState,
      disabled: disabled ?? accessibilityState?.disabled,
    }),
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    onBlur: () => setPressed(false),
    style: {
      ...BUTTON_BASE,
      cursor: disabled ? "default" : "pointer",
      ...rnStyleToCss(flat),
    },
  } as ButtonHTMLAttributes<HTMLButtonElement>;
  return createElement("button", props, children);
}

export function ScrollView({
  style,
  contentContainerStyle,
  children,
  horizontal,
  accessibilityRole,
  accessibilityLabel,
  testID,
  id,
}: ScrollViewProps): ReactElement {
  // `shows*ScrollIndicator` stays part of the prop surface but has no DOM
  // equivalent; the scrollbars simply render.
  const flat = flattenStyle(style);
  const content = flattenStyle(contentContainerStyle);
  const outerStyle: CSSProperties = {
    ...VIEW_BASE,
    ...(horizontal
      ? { flexGrow: 0, flexShrink: 0 }
      : { flexGrow: 1, flexShrink: 1, flexBasis: "0%" }),
    ...rnStyleToCss(flat),
    overflowX: horizontal ? "auto" : "hidden",
    overflowY: horizontal ? "hidden" : "auto",
  };
  const innerStyle: CSSProperties = {
    ...VIEW_BASE,
    flexDirection: horizontal ? "row" : "column",
    width: horizontal ? "max-content" : "100%",
    ...rnStyleToCss(content),
  };
  const props = {
    id,
    role: accessibilityRole,
    "aria-label": accessibilityLabel,
    "data-testid": testID,
    style: outerStyle,
  } as HTMLAttributes<HTMLDivElement>;
  return createElement(
    "div",
    props,
    createElement("div", { style: innerStyle }, children)
  );
}

export function TextInput({
  style,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  multiline,
  editable,
  maxLength,
  onSubmitEditing,
  accessibilityRole,
  accessibilityLabel,
  testID,
  id,
}: TextInputProps): ReactElement {
  const flat = flattenStyle(style);
  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => onChangeText?.(event.target.value);
  const handleKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (event.key !== "Enter" || multiline) return;
    event.preventDefault();
    onSubmitEditing?.();
  };
  const common = {
    id,
    role: accessibilityRole,
    "aria-label": accessibilityLabel,
    "data-testid": testID,
    placeholder,
    value: value ?? "",
    disabled: editable === false,
    maxLength,
    onChange: handleChange,
    onKeyDown: handleKeyDown,
    autoCapitalize,
    inputMode: keyboardType === "numeric" ? "numeric" : undefined,
    style: {
      boxSizing: "border-box" as const,
      width: "100%",
      fontFamily: "inherit",
      ...rnStyleToCss(flat),
    },
  };
  if (multiline)
    return createElement("textarea", {
      ...common,
      rows: 3,
    } as TextareaHTMLAttributes<HTMLTextAreaElement>);
  return createElement("input", {
    ...common,
    type: secureTextEntry ? "password" : "text",
  } as InputHTMLAttributes<HTMLInputElement>);
}

export function SafeAreaView(props: ViewProps): ReactElement {
  return View({
    ...props,
    style: [
      {
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      },
      props.style,
    ],
  });
}

export function Modal({
  visible,
  transparent,
  onRequestClose,
  testID,
  children,
}: ModalProps): ReactElement | null {
  if (!visible) return null;
  const overlay: CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-end",
    zIndex: 1000,
    backgroundColor: transparent ? "rgba(0,0,0,.35)" : "rgba(15,23,42,.6)",
  };
  const sheet: CSSProperties = {
    ...VIEW_BASE,
    width: "100%",
    maxWidth: 640,
    height: "92dvh",
    maxHeight: "92dvh",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    boxShadow: "0 -10px 30px rgba(0,0,0,0.25)",
  };
  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) onRequestClose?.();
  };
  return createElement(
    "div",
    { style: overlay, onClick },
    createElement(
      "div",
      {
        role: "dialog",
        "aria-modal": "true",
        "data-testid": testID,
        style: sheet,
      } as HTMLAttributes<HTMLDivElement>,
      children
    )
  );
}

export const StyleSheet = {
  create<T extends Record<string, AnyStyle>>(styles: T): T {
    return styles;
  },
  flatten<T extends AnyStyle>(style: StyleProp<T>): T | undefined {
    return flattenStyle(style);
  },
  absoluteFill: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  } as ViewStyle,
  hairlineWidth: 1,
};

/**
 * The OS the user agent reports. The kit always renders DOM; this is only a
 * hint for OS-flavoured tweaks (safe areas, scroll bounce), never a branch
 * between render paths.
 */
function detectPlatform(): PlatformName {
  if (typeof navigator === "undefined") return "web";
  const userAgent = navigator.userAgent;
  if (/android/i.test(userAgent)) return "android";
  if (/iPad|iPhone|iPod/.test(userAgent)) return "ios";
  return "web";
}

export const Platform = {
  OS: detectPlatform(),
  select<T>(values: Record<PlatformName, T>): T {
    return values[detectPlatform()];
  },
} as const;
