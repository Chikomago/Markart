import { computed, shallowReactive } from "vue";
import { pluginRuntime } from "../runtime";
import {
  sidebarLayout,
  filesView,
  outlineView,
  type SidebarGroup,
} from "./sidebarLayout";
import { t } from "../../i18n";
export const sidebarHeadingTargets = shallowReactive(new Map<string, HTMLElement>());
export const sidebarTargets = shallowReactive(new Map<string, HTMLElement>());
export const sidebarViews = computed(() => [
  { id: filesView, title: t("文件"), multiple: false },
  { id: outlineView, title: t("大纲"), multiple: false },
  ...pluginRuntime.state.views
    .filter((view) => view.location !== "settings")
    .map((view) => ({
      id: view.id,
      title: view.title,
      multiple: view.multiple === true,
    })),
]);
export function groupItems(group: SidebarGroup) {
  return group.items.flatMap((id) => {
    const item = sidebarLayout.state.items[id],
      view = item && sidebarViews.value.find((view) => view.id === item.viewId);
    return item && view ? [{ ...item, title: view.title }] : [];
  });
}
export function activeItem(group: SidebarGroup) {
  const items = groupItems(group);
  return items.find((item) => item.id === group.active) || items[0];
}
export const groupLabel = (group: SidebarGroup) =>
  ({
    "left-top": t("左侧上方"),
    "left-bottom": t("左侧下方"),
    "right-top": t("右侧上方"),
    "right-bottom": t("右侧下方"),
  })[group.slot];
