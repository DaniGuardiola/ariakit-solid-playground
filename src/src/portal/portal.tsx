import { combineProps } from "@solid-primitives/props";
import { mergeRefs } from "@solid-primitives/refs";
import type { ValidComponent } from "solid-js";
import { Show, Portal as SolidPortal } from "solid-js/web";
import { wrapInstance } from "../utils/misc.ts";
import { createHook, createInstance, withOptions } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";

const TagName = "div" satisfies ValidComponent;
type TagName = typeof TagName;

/**
 * Returns props to create a `Portal` component.
 * @see https://solid.ariakit.org/components/portal
 * @example
 * ```jsx
 * const props = usePortal();
 * <Role {...props}>Content</Role>
 * ```
 */
export const usePortal = createHook<TagName, PortalOptions>(
  withOptions(
    {
      preserveTabOrder: undefined,
      preserveTabOrderAnchor: undefined,
      portalElement: undefined,
      portalRef: undefined,
      portal: true,
      ref: undefined,
    },
    function usePortal(props, options) {
      const refProp = mergeRefs(options.ref) as (element: HTMLElement) => void;

      props = wrapInstance(props, (wrapperProps) => {
        return (
          <Show when={options.portal} fallback={wrapperProps.children}>
            <SolidPortal ref={refProp}>{props.children}</SolidPortal>
          </Show>
        );
      });

      props = combineProps(
        {
          // is this necessary? since when portalled, this won't render anyway right?
          ref: (element: HTMLElement) => !options.portal && refProp(element),
        },
        props,
      );

      return props;
    },
  ),
);

/**
 * Renders an element using [Solid
 * Portal](https://docs.solidjs.com/concepts/control-flow/portal).
 *
 * By default, the portal element is a `div` element appended to the
 * `document.body` element. You can customize this with the
 * [`portalElement`](https://solid.ariakit.org/reference/portal#portalelement) prop.
 *
 * The
 * [`preserveTabOrder`](https://solid.ariakit.org/reference/portal#preservetaborder)
 * prop allows this component to manage the tab order of the elements. It
 * ensures the tab order remains consistent with the original location where the
 * portal was rendered in the Solid tree, instead of the final location in the
 * DOM. The
 * [`preserveTabOrderAnchor`](https://solid.ariakit.org/reference/portal#preservetaborderanchor)
 * prop can specify a different location from which the tab order is preserved.
 * @see https://solid.ariakit.org/components/portal
 * @example
 * ```jsx
 * <SolidPortal>Content</SolidPortal>
 * ```
 */
export const Portal = function Portal(props: PortalProps) {
  const htmlProps = usePortal(props);
  return createInstance(TagName, htmlProps);
};

export interface PortalOptions<_T extends ValidComponent = TagName>
  extends Options {
  /**
   * When enabled, `preserveTabOrder` will keep the DOM element's tab order the
   * same as the order in which the underlying
   * [`Portal`](https://solid.ariakit.org/reference/portal) component was instantiated
   * in the Solid tree.
   *
   * If the
   * [`preserveTabOrderAnchor`](https://solid.ariakit.org/reference/portal#preservetaborderanchor)
   * prop is provided, the tab order will be preserved relative to that element.
   * @default false
   */
  preserveTabOrder?: boolean;
  /**
   * An anchor element for maintaining the tab order when
   * [`preserveTabOrder`](https://solid.ariakit.org/reference/portal#preservetaborder)
   * prop is enabled. The tab order will be kept relative to this element.
   *
   * By default, the tab order is kept relative to the original location in the
   * Solid tree where the underlying
   * [`Portal`](https://solid.ariakit.org/reference/portal) component was instantiated.
   * @example
   * ```jsx {18-20}
   * const [anchor, setAnchor] = createSignal();
   *
   * <button ref={setAnchor}>Order 0</button>
   * <button>Order 2</button>
   *
   * // Rendered at the end of the document.
   * <SolidPortal>
   *   <button>Order 5</button>
   * </SolidPortal>
   *
   * // Rendered at the end of the document, but the tab order is preserved.
   * <SolidPortal preserveTabOrder>
   *   <button>Order 3</button>
   * </SolidPortal>
   *
   * // Rendered at the end of the document, but the tab order is preserved
   * // relative to the anchor element.
   * <SolidPortal preserveTabOrder preserveTabOrderAnchor={anchor()}>
   *   <button>Order 1</button>
   * </SolidPortal>
   *
   * <button>Order 4</button>
   * ```
   */
  preserveTabOrderAnchor?: Element | null;
  // TODO: do the docs make sense given that it might not be possible for the
  // portal element to be removed from the DOM? or to transition from not
  // being in the DOM to being in the DOM?
  /**
   * `portalRef` is similar to `ref` but is scoped to the portal node. It's
   * useful when you need to be informed when the portal element is appended to
   * the DOM or removed from the DOM.
   *
   * Live examples:
   * - [Form with Select](https://solid.ariakit.org/examples/form-select)
   * @example
   * ```jsx
   * const [portalElement, setPortalElement] = createSignal();
   *
   * <SolidPortal portalRef={setPortalElement} />
   * ```
   */
  // TODO: is "undefined" necessary?
  portalRef?: (element: HTMLElement | undefined) => void;
  /**
   * Determines whether the element should be rendered as a Solid Portal.
   *
   * Live examples:
   * - [Combobox with integrated
   *   filter](https://solid.ariakit.org/examples/combobox-filtering-integrated)
   * - [Dialog with Menu](https://solid.ariakit.org/examples/dialog-menu)
   * - [Hovercard with keyboard
   *   support](https://solid.ariakit.org/examples/hovercard-disclosure)
   * - [Menubar](https://solid.ariakit.org/components/menubar)
   * - [Standalone Popover](https://solid.ariakit.org/examples/popover-standalone)
   * - [Animated Select](https://solid.ariakit.org/examples/select-animated)
   * @default true
   */
  portal?: boolean;
  /**
   * An HTML element or a callback function that returns an HTML element
   * to be used as the portal element. By default, the portal element will
   * be a `div` element appended to the `document.body`.
   *
   * Live examples:
   * - [Navigation Menubar](https://solid.ariakit.org/examples/menubar-navigation)
   * @example
   * ```jsx
   * const [portal, setPortal] = createSignal();
   *
   * <SolidPortal portalElement={portal()} />
   * <div ref={setPortal} />
   * ```
   * @example
   * ```jsx
   * const getPortalElement = () => {
   *   const div = document.createElement("div");
   *   const portalRoot = document.getElementById("portal-root");
   *   portalRoot.appendChild(div);
   *   return div;
   * };
   *
   * <SolidPortal portalElement={getPortalElement} />
   * ```
   */
  portalElement?: // TODO: is the "null" necessary? is the "element" argument necessary?
  // TODO: previous callback signature: ((element: HTMLElement) => HTMLElement | null)
  (() => HTMLElement) | HTMLElement;
}

export type PortalProps<T extends ValidComponent = TagName> = Props<
  T,
  PortalOptions<T>
>;
