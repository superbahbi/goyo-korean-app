// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  flattenStyle,
  rnStyleToCss,
  type ViewStyle,
} from "./dom";

/** The serialized style attribute of the first element in `markup`. */
function styleOf(markup: string): string {
  const match = /style="([^"]*)"/.exec(markup);
  return match?.[1] ?? "";
}

describe("rnStyleToCss golden cases", () => {
  it("expands the horizontal/vertical padding and margin shorthands", () => {
    expect(
      rnStyleToCss({
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginHorizontal: 4,
        marginVertical: 2,
      })
    ).toEqual({
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 6,
      paddingBottom: 6,
      marginLeft: 4,
      marginRight: 4,
      marginTop: 2,
      marginBottom: 2,
    });
  });

  it("maps numeric lineHeight to px and passes strings through", () => {
    expect(rnStyleToCss({ lineHeight: 22 })).toEqual({ lineHeight: "22px" });
    expect(rnStyleToCss({ lineHeight: "1.4" })).toEqual({ lineHeight: "1.4" });
  });

  it("maps flex>0 and flex===0 to flexGrow/flexShrink/flexBasis", () => {
    expect(rnStyleToCss({ flex: 1 })).toEqual({
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "0%",
    });
    expect(rnStyleToCss({ flex: 2 })).toEqual({
      flexGrow: 2,
      flexShrink: 1,
      flexBasis: "0%",
    });
    expect(rnStyleToCss({ flex: 0 })).toEqual({
      flexGrow: 0,
      flexShrink: 0,
      flexBasis: "auto",
    });
  });

  it("implies borderStyle solid only for a positive border width", () => {
    expect(rnStyleToCss({ borderWidth: 1, borderColor: "red" })).toEqual({
      borderWidth: 1,
      borderColor: "red",
      borderStyle: "solid",
    });
    expect(rnStyleToCss({ borderTopWidth: 2 })).toEqual({
      borderTopWidth: 2,
      borderStyle: "solid",
    });
    expect(rnStyleToCss({ borderWidth: 0 })).toEqual({ borderWidth: 0 });
    expect(rnStyleToCss({ borderColor: "red" })).toEqual({
      borderColor: "red",
    });
  });

  it("drops RN-only keys like tintColor, elevation, and shadows", () => {
    expect(
      rnStyleToCss({
        tintColor: "#059669",
        elevation: 4,
        shadowColor: "black",
        textAlignVertical: "center",
        resizeMode: "cover",
      })
    ).toEqual({});
  });

  it("drops non-scalar values", () => {
    // The ViewStyle type already rejects these at compile time; the runtime
    // guard still owes a golden case for styles that arrive untyped.
    const nonScalar = {
      transform: [{ translateX: 10 }],
      shadowOffset: { width: 0, height: 2 },
    } as unknown as ViewStyle;
    expect(rnStyleToCss(nonScalar)).toEqual({});
  });

  it("flattens nested style arrays before translating", () => {
    expect(
      rnStyleToCss([false, [{ paddingHorizontal: 8 }, null, { flex: 1 }]])
    ).toEqual({
      paddingLeft: 8,
      paddingRight: 8,
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: "0%",
    });
    expect(rnStyleToCss(null)).toBeUndefined();
    expect(flattenStyle(undefined)).toBeUndefined();
  });
});

describe("DOM component kit rendered markup", () => {
  it("renders View with the VIEW_BASE flex-column defaults", () => {
    const style = styleOf(renderToStaticMarkup(createElement(View, null)));
    expect(style).toContain("display:flex");
    expect(style).toContain("flex-direction:column");
    expect(style).toContain("align-items:stretch");
    expect(style).toContain("flex-shrink:0");
    expect(style).toContain("box-sizing:border-box");
    expect(style).toContain("min-width:0");
    expect(style).toContain("min-height:0");
    expect(style).toContain("position:relative");
  });

  it("renders Text with the TEXT_BASE reset and numberOfLines clamp", () => {
    const plain = styleOf(renderToStaticMarkup(createElement(Text, null)));
    expect(plain).toContain("margin:0");
    expect(plain).toContain("padding:0");
    expect(plain).toContain("font-family:inherit");

    const clamped = styleOf(
      renderToStaticMarkup(createElement(Text, { numberOfLines: 2 }))
    );
    expect(clamped).toContain("display:-webkit-box");
    expect(clamped).toContain("-webkit-line-clamp:2");
    expect(clamped).toContain("overflow:hidden");
  });

  it("renders Pressable as a real button and translates accessibility", () => {
    const markup = renderToStaticMarkup(
      createElement(
        Pressable,
        {
          accessibilityRole: "switch",
          accessibilityLabel: "Play audio",
          accessibilityState: { checked: true },
          testID: "play-button",
        },
        createElement(Text, null, "Play")
      )
    );
    expect(markup).toContain("<button");
    expect(markup).toContain('type="button"');
    expect(markup).toContain('role="switch"');
    expect(markup).toContain('aria-label="Play audio"');
    expect(markup).toContain('aria-checked="true"');
    expect(markup).toContain('data-testid="play-button"');
    expect(styleOf(markup)).toContain("appearance:none");
    expect(styleOf(markup)).toContain("cursor:pointer");

    const unchecked = renderToStaticMarkup(
      createElement(
        Pressable,
        {
          accessibilityRole: "switch",
          accessibilityLabel: "Play audio",
          accessibilityState: { checked: false },
        },
        createElement(Text, null, "Play")
      )
    );
    expect(unchecked).toContain('aria-checked="false"');
  });

  it("renders TextInput as input, or textarea when multiline", () => {
    const single = renderToStaticMarkup(
      createElement(TextInput, {
        value: "hi",
        onChangeText: () => {},
        placeholder: "answer",
        keyboardType: "numeric",
      })
    );
    expect(single).toContain("<input");
    expect(single).toContain('type="text"');
    expect(single).toContain('inputMode="numeric"');
    expect(single).toContain('placeholder="answer"');

    const multi = renderToStaticMarkup(
      createElement(TextInput, {
        value: "hi",
        onChangeText: () => {},
        multiline: true,
        secureTextEntry: true,
      })
    );
    expect(multi).toContain("<textarea");
    expect(multi).toContain('rows="3"');
  });

  it("renders ScrollView as a scroller plus inner track", () => {
    const markup = renderToStaticMarkup(
      createElement(
        ScrollView,
        { horizontal: true, testID: "scroller" },
        createElement(Text, null, "card")
      )
    );
    expect(styleOf(markup)).toContain("overflow-x:auto");
    expect(styleOf(markup)).toContain("overflow-y:hidden");
    const inner = /<div style="([^"]*)"><span/.exec(markup)?.[1] ?? "";
    expect(inner).toContain("flex-direction:row");
    expect(inner).toContain("width:max-content");
  });

  it("renders SafeAreaView with safe-area env padding", () => {
    const style = styleOf(
      renderToStaticMarkup(createElement(SafeAreaView, null))
    );
    expect(style).toContain("padding-top:env(safe-area-inset-top, 0px)");
    expect(style).toContain("padding-bottom:env(safe-area-inset-bottom, 0px)");
  });

  it("renders Modal as a bottom sheet, or nothing when hidden", () => {
    expect(
      renderToStaticMarkup(
        createElement(Modal, { visible: false, testID: "m" })
      )
    ).toBe("");

    const markup = renderToStaticMarkup(
      createElement(Modal, { visible: true, testID: "mobile-modal" })
    );
    expect(markup).toContain('role="dialog"');
    expect(markup).toContain('aria-modal="true"');
    expect(markup).toContain('data-testid="mobile-modal"');
    expect(styleOf(markup)).toContain("position:fixed");
    expect(styleOf(markup)).toContain("z-index:1000");
  });

  it("keeps StyleSheet.create as an identity registry", () => {
    const styles = StyleSheet.create({
      root: { flex: 1, minHeight: "100vh" },
    });
    expect(styles.root).toEqual({ flex: 1, minHeight: "100vh" });
    expect(StyleSheet.absoluteFill).toEqual({
      position: "absolute",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    });
  });
});

describe("Modal keyboard and focus behaviour", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    (
      globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
    ).IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.style.overflow = "";
  });

  function renderSheet(visible: boolean, onRequestClose = vi.fn()) {
    act(() => {
      root.render(
        createElement(
          "div",
          null,
          createElement("button", { id: "opener" }, "Open"),
          createElement(
            Modal,
            { visible, onRequestClose, testID: "sheet" },
            createElement("button", { id: "first" }, "First"),
            createElement("button", { id: "last" }, "Last")
          )
        )
      );
    });
    return onRequestClose;
  }

  function press(key: string, shiftKey = false) {
    const event = new KeyboardEvent("keydown", {
      key,
      shiftKey,
      bubbles: true,
      cancelable: true,
    });
    act(() => {
      document.dispatchEvent(event);
    });
    return event;
  }

  it("takes focus and locks page scroll, then gives both back on close", () => {
    renderSheet(false);
    const opener = document.getElementById("opener")!;
    opener.focus();

    renderSheet(true);
    const sheet = document.querySelector('[data-testid="sheet"]')!;
    expect(sheet.contains(document.activeElement)).toBe(true);
    expect(document.body.style.overflow).toBe("hidden");

    renderSheet(false);
    expect(document.body.style.overflow).toBe("");
    expect(document.activeElement).toBe(opener);
  });

  it("closes on Escape", () => {
    const onRequestClose = renderSheet(true);

    press("Escape");

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("wraps Tab and Shift+Tab inside the sheet", () => {
    renderSheet(true);
    const first = document.getElementById("first")!;
    const last = document.getElementById("last")!;

    last.focus();
    expect(press("Tab").defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(first);

    expect(press("Tab", true).defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(last);
  });

  it("pads the sheet clear of the home indicator", () => {
    const markup = renderToStaticMarkup(
      createElement(Modal, { visible: true }, "Body")
    );
    expect(markup).toContain("env(safe-area-inset-bottom, 0px)");
  });
});
