// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
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
