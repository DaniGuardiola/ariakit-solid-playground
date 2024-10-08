import { createContext } from "solid-js";

/**
 * Stores the element that will contain the portal. By default, it will be the
 * body of the document.
 * @example
 * ```jsx
 * const container = document.getElementById("container");
 *
 * function App() {
 *   return (
 *     <PortalContext.Provider value={container}>
 *       <Portal />
 *     </PortalContext.Provider>
 *   );
 * }
 * ```
 */
// TODO: should it be () => HTMLElement?
export const PortalContext = createContext<HTMLElement>();
