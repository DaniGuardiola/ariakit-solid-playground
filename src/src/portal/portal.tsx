import { getDocument } from "@ariakit/core/utils/dom";
import { isFocusEventOutside } from "@ariakit/core/utils/events";
import {
  disableFocusIn,
  getNextTabbable,
  getPreviousTabbable,
  restoreFocusIn,
} from "@ariakit/core/utils/focus";
import { combineProps } from "@solid-primitives/props";
import {
  Match,
  Show,
  Switch,
  type ValidComponent,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { Portal as SolidPortal } from "solid-js/web";
import { FocusTrap } from "../focus-trap/focus-trap.tsx";
import { useWrapInstance } from "../utils/hooks.ts";
import { stableAccessor } from "../utils/misc.ts";
import { createHook, createInstance, withOptions } from "../utils/system.tsx";
import type { Options, Props } from "../utils/types.ts";
import { PortalContext } from "./portal-context.tsx";

const TagName = "div" satisfies ValidComponent;
type TagName = typeof TagName;
type HTMLType = HTMLElementTagNameMap[TagName];

function getRootElement(element?: Element | null) {
  return getDocument(element).body;
}

function getPortalElement(
  element: HTMLElement,
  portalElement: PortalOptions["portalElement"],
) {
  if (!portalElement) {
    return getDocument(element).createElement("div");
  }
  if (typeof portalElement === "function") {
    return portalElement(element);
  }
  return portalElement;
}

function getRandomId(prefix = "id") {
  return `${prefix ? `${prefix}-` : ""}${Math.random()
    .toString(36)
    // TODO: deprecated?
    .substr(2, 6)}`;
}

function queueFocus(element?: HTMLElement | null) {
  queueMicrotask(() => {
    element?.focus();
  });
}

/**
 * Returns props to create a `Portal` component.
 * @see https://ariakit.org/components/portal
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
      setPortalRef: undefined,
      portal: true,
    },
    function usePortal(props, options) {
      const [ref, setRef] = createSignal<HTMLType>();
      const context = useContext(PortalContext);
      const [portalNode, setPortalNode] = createSignal<HTMLElement>();
      const [anchorPortalNode, setAnchorPortalNode] =
        createSignal<HTMLElement>();

      const [outerBeforeRef, setOuterBeforeRef] =
        createSignal<HTMLSpanElement>();
      const [innerBeforeRef, setInnerBeforeRef] =
        createSignal<HTMLSpanElement>();
      const [innerAfterRef, setInnerAfterRef] = createSignal<HTMLSpanElement>();
      const [outerAfterRef, setOuterAfterRef] = createSignal<HTMLSpanElement>();

      // Create the portal node and attach it to the DOM.
      createEffect(() => {
        const element = ref();
        const { portal, portalElement, setPortalRef } = options;
        // TODO: context would also be a reactive dep if accessor
        if (!element || !portal) {
          setPortalNode(undefined);
          return;
        }
        const portalEl = getPortalElement(element, portalElement);
        // TODO: Warn about portals as the document.body element.
        if (!portalEl) {
          setPortalNode(undefined);
          return;
        }
        const isPortalInDocument = portalEl.isConnected;
        if (!isPortalInDocument) {
          const rootElement = context || getRootElement(element);
          rootElement.appendChild(portalEl);
        }
        // If the portal element doesn't have an id already, set one.
        if (!portalEl.id) {
          // Use the element's id so rendering <Portal id="some-id" /> will
          // produce predictable results.
          portalEl.id = element.id ? `portal/${element.id}` : getRandomId();
        }
        // Set the internal portal node state and the portalRef prop.
        setPortalNode(portalEl);
        setPortalRef?.(portalEl);
        // If the portal element was already in the document, we don't need to
        // remove it when the element is unmounted, so we just return.
        if (isPortalInDocument) return;
        // Otherwise, we need to remove the portal from the DOM.
        onCleanup(() => {
          portalEl.remove();
          setPortalRef?.(undefined);
        });
      });

      // Create the anchor portal node and attach it to the DOM.
      createEffect(() => {
        const { portal, preserveTabOrder, preserveTabOrderAnchor } = options;
        if (!portal) return;
        if (!preserveTabOrder) return;
        if (!preserveTabOrderAnchor) return;
        const doc = getDocument(preserveTabOrderAnchor);
        const element = doc.createElement("span");
        element.style.position = "fixed";
        preserveTabOrderAnchor.insertAdjacentElement("afterend", element);
        setAnchorPortalNode(element);
        onCleanup(() => {
          element.remove();
          setAnchorPortalNode(undefined);
        });
      });

      // When preserveTabOrder is true, make sure elements inside the portal
      // element are tabbable only when the portal has already been focused,
      // either by tabbing into a focus trap element outside or using the mouse.
      createEffect(() => {
        const portalNodeValue = portalNode();
        const { preserveTabOrder } = options;
        if (!portalNodeValue) return;
        if (!preserveTabOrder) return;
        let raf = 0;
        const onFocus = (event: FocusEvent) => {
          if (!isFocusEventOutside(event)) return;
          const focusing = event.type === "focusin";
          cancelAnimationFrame(raf);
          if (focusing) {
            return restoreFocusIn(portalNodeValue);
          }
          // Wait for the next frame to allow tabindex changes after the focus
          // event.
          raf = requestAnimationFrame(() => {
            disableFocusIn(portalNodeValue, true);
          });
        };
        // Listen to the event on the capture phase so they run before the focus
        // trap elements onFocus prop is called.
        portalNodeValue.addEventListener("focusin", onFocus, true);
        portalNodeValue.addEventListener("focusout", onFocus, true);
        onCleanup(() => {
          cancelAnimationFrame(raf);
          portalNodeValue.removeEventListener("focusin", onFocus, true);
          portalNodeValue.removeEventListener("focusout", onFocus, true);
        });
      });

      props = useWrapInstance(props, (wrapperProps) => {
        const baseElement = () => (
          // While the portal node is not in the DOM, we need to pass the
          // current context to the portal context, otherwise it's going to
          // reset to the body element on nested portals.
          <PortalContext.Provider value={portalNode() || context}>
            {wrapperProps.children}
          </PortalContext.Provider>
        );

        let element = () => (
          <>
            <Show when={options.preserveTabOrder && portalNode()}>
              <FocusTrap
                ref={setInnerBeforeRef}
                data-focus-trap={props.id}
                class="__focus-trap-inner-before"
                onFocus={(event) => {
                  if (isFocusEventOutside(event, portalNode())) {
                    queueFocus(getNextTabbable());
                  } else {
                    queueFocus(outerBeforeRef());
                  }
                }}
              />
            </Show>
            {baseElement()}
            <Show when={options.preserveTabOrder && portalNode()}>
              <FocusTrap
                ref={setInnerAfterRef}
                data-focus-trap={props.id}
                class="__focus-trap-inner-after"
                onFocus={(event) => {
                  if (isFocusEventOutside(event, portalNode())) {
                    queueFocus(getPreviousTabbable());
                  } else {
                    queueFocus(outerAfterRef());
                  }
                }}
              />
            </Show>
          </>
        );
        element = stableAccessor(element, (el) => (
          <Show when={portalNode()} fallback={el()}>
            <SolidPortal mount={portalNode()}>{el()}</SolidPortal>
          </Show>
        ));

        let preserveTabOrderElement = () => (
          <>
            <Show when={options.preserveTabOrder && portalNode()}>
              <FocusTrap
                ref={setOuterBeforeRef}
                data-focus-trap={props.id}
                class="__focus-trap-outer-before"
                onFocus={(event) => {
                  // If the event is coming from the outer after focus trap, it
                  // means there's no tabbable element inside the portal. In
                  // this case, we don't focus the inner before focus trap, but
                  // the previous tabbable element outside the portal.
                  const fromOuter = event.relatedTarget === outerAfterRef();
                  if (!fromOuter && isFocusEventOutside(event, portalNode())) {
                    queueFocus(innerBeforeRef());
                  } else {
                    queueFocus(getPreviousTabbable());
                  }
                }}
              />
            </Show>
            <Show when={options.preserveTabOrder}>
              // We're using position: fixed here so that the browser doesn't //
              add margin to the element when setting gap on a parent element.
              <span
                aria-owns={portalNode()?.id}
                style={{ position: "fixed" }}
              />
            </Show>

            <Show when={options.preserveTabOrder && portalNode()}>
              <FocusTrap
                ref={setOuterAfterRef}
                data-focus-trap={props.id}
                class="__focus-trap-outer-after"
                onFocus={(event) => {
                  if (isFocusEventOutside(event, portalNode())) {
                    queueFocus(innerAfterRef());
                  } else {
                    const nextTabbable = getNextTabbable();
                    // If the next tabbable element is the inner before focus
                    // trap, this means we're at the end of the document or the
                    // portal was placed right after the original spot in the
                    // React tree. We need to wait for the next frame so the
                    // preserveTabOrder effect can run and disable the inner
                    // before focus trap. If there's no tabbable element after
                    // that, the focus will stay on this element.
                    if (nextTabbable === innerBeforeRef()) {
                      requestAnimationFrame(() => getNextTabbable()?.focus());
                      return;
                    }
                    queueFocus(nextTabbable);
                  }
                }}
              />
            </Show>
          </>
        );
        preserveTabOrderElement = stableAccessor(
          preserveTabOrderElement,
          (el) => (
            <Show
              when={anchorPortalNode() && options.preserveTabOrder}
              fallback={el()}
            >
              <SolidPortal mount={anchorPortalNode()}>{el()}</SolidPortal>
            </Show>
          ),
        );

        return (
          <Switch
            fallback={
              <>
                {preserveTabOrderElement()}
                {element()}
              </>
            }
          >
            <Match when={!options.portal}>{baseElement()}</Match>
            <Match when={!portalNode()}>
              {/* If the element should be rendered within a portal, but the portal
              node is not yet in the DOM, we'll return an empty div element. We
              assign the id to the element so we can use it to set the portal id
              later on. We're using position: fixed here so that the browser
              doesn't add margin to the element when setting gap on a parent
              element. */}
              <span
                ref={setRef}
                id={props.id}
                style={{ position: "fixed" }}
                hidden
              />
            </Match>
          </Switch>
        );
      });

      props = combineProps({ ref: setRef }, props);

      return props;
    },
  ),
);

/**
 * Renders an element using [React
 * Portal](https://react.dev/reference/react-dom/createPortal).
 *
 * By default, the portal element is a `div` element appended to the
 * `document.body` element. You can customize this with the
 * [`portalElement`](https://ariakit.org/reference/portal#portalelement) prop.
 *
 * The
 * [`preserveTabOrder`](https://ariakit.org/reference/portal#preservetaborder)
 * prop allows this component to manage the tab order of the elements. It
 * ensures the tab order remains consistent with the original location where the
 * portal was rendered in the React tree, instead of the final location in the
 * DOM. The
 * [`preserveTabOrderAnchor`](https://ariakit.org/reference/portal#preservetaborderanchor)
 * prop can specify a different location from which the tab order is preserved.
 * @see https://ariakit.org/components/portal
 * @example
 * ```jsx
 * <Portal>Content</Portal>
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
   * [`Portal`](https://ariakit.org/reference/portal) component was mounted in
   * the React tree.
   *
   * If the
   * [`preserveTabOrderAnchor`](https://ariakit.org/reference/portal#preservetaborderanchor)
   * prop is provided, the tab order will be preserved relative to that element.
   * @default false
   */
  preserveTabOrder?: boolean;
  /**
   * An anchor element for maintaining the tab order when
   * [`preserveTabOrder`](https://ariakit.org/reference/portal#preservetaborder)
   * prop is enabled. The tab order will be kept relative to this element.
   *
   * By default, the tab order is kept relative to the original location in the
   * React tree where the underlying
   * [`Portal`](https://ariakit.org/reference/portal) component was mounted.
   * @example
   * ```jsx {18-20}
   * const [anchor, setAnchor] = useState(null);
   *
   * <button ref={setAnchor}>Order 0</button>
   * <button>Order 2</button>
   *
   * // Rendered at the end of the document.
   * <Portal>
   *   <button>Order 5</button>
   * </Portal>
   *
   * // Rendered at the end of the document, but the tab order is preserved.
   * <Portal preserveTabOrder>
   *   <button>Order 3</button>
   * </Portal>
   *
   * // Rendered at the end of the document, but the tab order is preserved
   * // relative to the anchor element.
   * <Portal preserveTabOrder preserveTabOrderAnchor={anchor}>
   *   <button>Order 1</button>
   * </Portal>
   *
   * <button>Order 4</button>
   * ```
   */
  preserveTabOrderAnchor?: Element | null;
  // TODO: renamed portalRef to setPortalRef, does anything else need to be
  // updated? Are docs clear?
  /**
   * `setPortalRef` is similar to `ref` but is scoped to the portal node. It's
   * useful when you need to be informed when the portal element is appended to
   * the DOM or removed from the DOM.
   *
   * Live examples:
   * - [Form with Select](https://ariakit.org/examples/form-select)
   * @example
   * ```jsx
   * const [portalElement, setPortalElement] = createSignal();
   *
   * <Portal setPortalRef={setPortalElement} />
   * ```
   */
  setPortalRef?: (element?: HTMLElement) => void;
  /**
   * Determines whether the element should be rendered as a React Portal.
   *
   * Live examples:
   * - [Combobox with integrated
   *   filter](https://ariakit.org/examples/combobox-filtering-integrated)
   * - [Dialog with Menu](https://ariakit.org/examples/dialog-menu)
   * - [Hovercard with keyboard
   *   support](https://ariakit.org/examples/hovercard-disclosure)
   * - [Menubar](https://ariakit.org/components/menubar)
   * - [Standalone Popover](https://ariakit.org/examples/popover-standalone)
   * - [Animated Select](https://ariakit.org/examples/select-animated)
   * @default true
   */
  portal?: boolean;
  /**
   * An HTML element or a memoized callback function that returns an HTML
   * element to be used as the portal element. By default, the portal element
   * will be a `div` element appended to the `document.body`.
   *
   * Live examples:
   * - [Navigation Menubar](https://ariakit.org/examples/menubar-navigation)
   * @example
   * ```jsx
   * const [portal, setPortal] = useState(null);
   *
   * <Portal portalElement={portal} />
   * <div ref={setPortal} />
   * ```
   * @example
   * ```jsx
   * const getPortalElement = useCallback(() => {
   *   const div = document.createElement("div");
   *   const portalRoot = document.getElementById("portal-root");
   *   portalRoot.appendChild(div);
   *   return div;
   * }, []);
   *
   * <Portal portalElement={getPortalElement} />
   * ```
   */
  portalElement?:
    | ((element: HTMLElement) => HTMLElement | undefined)
    | HTMLElement
    | undefined;
}

export type PortalProps<T extends ValidComponent = TagName> = Props<
  T,
  PortalOptions<T>
>;
