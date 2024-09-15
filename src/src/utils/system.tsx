import type { AnyObject, EmptyObject } from "@ariakit/core/utils/types";
import { Show, type ValidComponent, splitProps } from "solid-js";
import { Dynamic } from "solid-js/web";
import type { HTMLProps, Hook, Options, Props } from "./types.ts";

// TODO: implement `wrapElement` prop.
/**
 * Creates a Solid component instance that supports the `render` and
 * `wrapElement` props.
 */
export function createInstance(
  Type: ValidComponent,
  props: Props<ValidComponent, Options>,
) {
  const [features, rest] = splitProps(props, ["render", "wrapElement"]);
  return (
    <Show
      when={features.render}
      // TODO: replace with LazyDynamic
      fallback={<Dynamic {...rest} component={Type} />}
    >
      <Dynamic {...rest} component={features.render as ValidComponent} />
    </Show>
  );
}

/**
 * Creates a component hook that accepts props and returns props so they can be
 * passed to a Solid component.
 */
export function createHook<
  T extends ValidComponent,
  P extends AnyObject = EmptyObject,
>(useProps: (props: Props<T, P>) => HTMLProps<T, P>) {
  return useProps as Hook<T, P>;
}
