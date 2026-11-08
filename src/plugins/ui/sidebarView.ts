import { watch } from "vue";
import { ResourceScope } from "../runtime/scope";
import { sidebarLayout } from "./sidebarLayout";
import { sidebarInstances } from "../host/services";
import { mountViewTree, releaseUiCallbacks } from "./tree";
import type { View, SidebarContext } from "../sdk/index";
import { PluginError } from "../sdk/protocol";
export function mountPanelView(
  view: View,
  itemId: string,
  element: HTMLElement,
  context: () => Omit<
    SidebarContext,
    "itemId" | "state" | "visible" | "width" | "height"
  >,
  onError: (error: unknown) => void,
  styles = "",
) {
  const scope = new ResourceScope();
  let visible = true,
    generation = 0,
    disposeTree: (() => void) | undefined,
    initialized = false;
  let initializing: Promise<void> | undefined;
  const snapshot = (): SidebarContext => {
    const item = sidebarLayout.item(itemId);
    return {
      ...context(),
      signal: scope.signal,
      itemId,
      state: item.state,
      visible,
      width: element.clientWidth,
      height: element.clientHeight,
      root: item.pinned ? item.root || "" : context().root,
      file: item.pinned && item.root !== context().root ? null : context().file,
    };
  };
  async function refresh() {
    if (scope.signal.aborted || !visible) return;
    const request = ++generation;
    try {
      const item = sidebarLayout.item(itemId);
      if (!initialized) {
        initializing ||= (async () => {
          if (
            item.stateVersion !== (view.stateVersion || 1) &&
            view.migrateState
          ) {
            const state = await view.migrateState(
              item.state,
              item.stateVersion,
            );
            if (scope.signal.aborted) return;
            sidebarLayout.setState(itemId, state, view.stateVersion || 1);
          }
          await view.setState?.(item.state);
          if (scope.signal.aborted) return;
          await view.onOpen?.(snapshot());
          if (scope.signal.aborted) return;
          initialized = true;
          if (visible) await view.onShow?.();
        })();
        await initializing;
        if (scope.signal.aborted) return;
      }
      const tree = await view.render(snapshot());
      if (scope.signal.aborted || generation !== request) {
        releaseUiCallbacks(tree);
        return;
      }
      disposeTree?.();
      disposeTree = mountViewTree(element, tree, styles, onError);
    } catch (error) {
      if (!scope.signal.aborted) onError(error);
    }
  }
  const visibility = (next: boolean) => {
    if (visible === next) return;
    visible = next;
    generation++;
    if (initialized)
      void Promise.resolve(next ? view.onShow?.() : view.onHide?.()).catch(
        onError,
      );
    if (!next && initialized && view.getState)
      void Promise.resolve(view.getState())
        .then((state) => {
          if (!scope.signal.aborted && sidebarLayout.state.items[itemId])
            sidebarLayout.setState(itemId, state, view.stateVersion || 1);
        })
        .catch(onError);
    if (next) void refresh();
  };
  const instance = {
    refresh,
    visibility,
    context: () => {
      if (initialized)
        void Promise.resolve(view.onContextChange?.(snapshot()))
          .then(() => refresh())
          .catch(onError);
    },
  };
  sidebarInstances.set(itemId, instance);
  let resizeQueued = false;
  const observer = new ResizeObserver(() => {
    if (resizeQueued || !visible) return;
    resizeQueued = true;
    requestAnimationFrame(() => {
      resizeQueued = false;
      if (scope.signal.aborted || !visible) return;
      void Promise.resolve(
        view.onResize?.({
          width: element.clientWidth,
          height: element.clientHeight,
        }),
      ).catch(onError);
    });
  });
  observer.observe(element);
  scope.track(() => observer.disconnect());
  scope.track(() => {
    if (sidebarInstances.get(itemId) === instance) sidebarInstances.delete(itemId);
    disposeTree?.();
  });
  scope.track(async () => {
    if (initialized) {
      if (view.getState && sidebarLayout.state.items[itemId]) {
        const state = await view.getState();
        if (sidebarLayout.state.items[itemId])
          sidebarLayout.setState(itemId, state, view.stateVersion || 1);
      }
      await view.onClose?.();
    }
  });
  void refresh();
  return () => {
    generation++;
    void scope.close();
  };
}
