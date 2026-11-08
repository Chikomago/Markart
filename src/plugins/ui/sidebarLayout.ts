import { reactive } from "vue";
import { PluginError, type Json } from "../sdk/protocol";
export type SidebarSide = "left" | "right";
import type { SidebarPlacement } from "../sdk/index";
export type SidebarSlot = SidebarPlacement;
export type SidebarGroup = {
  id: string;
  slot: SidebarSlot;
  items: string[];
  active: string;
};
export type SidebarItemState = {
  id: string;
  viewId: string;
  groupId: string;
  state: Json;
  stateVersion: number;
  root: string | null;
  pinned: boolean;
};
const slots: SidebarSlot[] = [
  "left-top",
  "left-bottom",
  "right-top",
  "right-bottom",
];
export const filesView = "builtin:files",
  outlineView = "builtin:outline";
const key = "markart-panel-layout-v2";
function createState() {
  const groups = slots.map((slot, index) => ({
    id: `group-${index + 1}`,
    slot,
    items: [] as string[],
    active: "",
  }));
  const items: Record<string, SidebarItemState> = {};
  for (const [index, viewId] of [filesView, outlineView].entries()) {
    const id = `builtin-item-${index + 1}`,
      group = groups[index];
    group.items.push(id);
    group.active = id;
    items[id] = {
      id,
      viewId,
      groupId: group.id,
      state: null,
      stateVersion: 1,
      root: null,
      pinned: false,
    };
  }
  return {
    groups,
    items,
    lastGroups: {} as Record<string, string>,
    ratios: { left: 0.66, right: 0.5 },
  };
}
export class SidebarLayout {
  readonly state = reactive(createState());
  constructor(private storage?: Pick<Storage, "getItem" | "setItem">) {
    try {
      const value = JSON.parse(storage?.getItem(key) || "null");
      if (!value || !Array.isArray(value.groups) || !value.items) return;
      if (value.lastGroups && typeof value.lastGroups === "object") {
        for (const [viewId, groupId] of Object.entries(value.lastGroups))
          if (
            typeof groupId === "string" &&
            this.state.groups.some((group) => group.id === groupId)
          )
            this.state.lastGroups[viewId] = groupId;
      }
      const seen = new Set<string>();
      for (const group of this.state.groups) {
        const saved = value.groups.find(
          (entry: SidebarGroup) => entry.slot === group.slot,
        );
        if (!saved || !Array.isArray(saved.items)) continue;
        // Group identities are fixed by the host, never restored from storage.
        group.items = [];
        for (const id of saved.items.slice(0, 100)) {
          const item = value.items[id];
          if (
            typeof id !== "string" ||
            id.length > 200 ||
            seen.has(id) ||
            !item ||
            typeof item.viewId !== "string" ||
            item.viewId.length > 300
          )
            continue;
          seen.add(id);
          group.items.push(id);
          this.state.items[id] = {
            id,
            viewId: item.viewId,
            groupId: group.id,
            state: item.state ?? null,
            stateVersion: Number.isInteger(item.stateVersion)
              ? item.stateVersion
              : 1,
            root: typeof item.root === "string" ? item.root : null,
            pinned: item.pinned === true,
          };
        }
        group.active = group.items.includes(saved.active)
          ? saved.active
          : group.items[0] || "";
      }
      for (const id of Object.keys(this.state.items))
        if (!seen.has(id)) delete this.state.items[id];
      for (const side of ["left", "right"] as const)
        if (Number.isFinite(value.ratios?.[side]))
          this.state.ratios[side] = Math.max(
            0.15,
            Math.min(0.85, value.ratios[side]),
          );
    } catch {
      /* Keep defaults when stored layout cannot be read. */
    }
  }
  private save() {
    try {
      this.storage?.setItem(key, JSON.stringify(this.state));
    } catch {
      /* Layout remains usable during the session. */
    }
  }
  group(id: string) {
    const group = this.state.groups.find((group) => group.id === id);
    if (!group) throw new PluginError("not-found", "面板容器不存在");
    return group;
  }
  item(id: string) {
    const item = this.state.items[id];
    if (!item) throw new PluginError("not-found", "面板已关闭");
    return item;
  }
  canPlace(viewId: string, groupId: string, itemId?: string) {
    const group = this.group(groupId);
    const others = group.items.filter(id => id !== itemId).map(id => this.state.items[id]).filter(Boolean);
    return viewId === filesView ? !others.length : !others.some(item => item.viewId === filesView);
  }
  private requirePlacement(viewId: string, groupId: string, itemId?: string) {
    if (!this.canPlace(viewId, groupId, itemId)) throw new PluginError("invalid-argument", "文件面板需要独占面板组");
  }
  open(
    viewId: string,
    options: {
      groupId?: string;
      defaultPlacement?: SidebarPlacement;
      multiple?: boolean;
      state?: Json;
      stateVersion?: number;
    } = {},
  ) {
    if (options.defaultPlacement !== undefined && !slots.includes(options.defaultPlacement))
      throw new PluginError("invalid-argument", "默认面板位置无效");
    const existing =
      !options.multiple &&
      Object.values(this.state.items).find((item) => item.viewId === viewId);
    if (existing) {
      this.select(existing.id);
      return existing;
    }
    let group = options.groupId
      ? this.group(options.groupId)
      : this.state.groups.find(
          (group) => group.id === this.state.lastGroups[viewId],
        ) || this.state.groups.find((group) => group.slot === (options.defaultPlacement || "right-top"))!;
    if (!options.groupId && !this.canPlace(viewId, group.id)) {
      const available = this.state.groups.find(candidate => this.canPlace(viewId, candidate.id));
      if (available) group = available;
    }
    this.requirePlacement(viewId, group.id);
    const id = crypto.randomUUID(),
      item = {
        id,
        viewId,
        groupId: group.id,
        state: options.state ?? null,
        stateVersion: options.stateVersion ?? 1,
        root: null,
        pinned: false,
      };
    this.state.items[id] = item;
    group.items.push(id);
    group.active = id;
    this.save();
    return this.state.items[id];
  }
  select(id: string) {
    const item = this.item(id);
    this.group(item.groupId).active = id;
    this.save();
  }
  move(id: string, groupId: string) {
    const item = this.item(id),
      target = this.group(groupId),
      source = this.group(item.groupId);
    if (source === target) {
      this.select(id);
      return;
    }
    this.requirePlacement(item.viewId, target.id, id);
    this.detach(source, id);
    target.items.push(id);
    target.active = id;
    item.groupId = target.id;
    this.state.lastGroups[item.viewId] = target.id;
    this.save();
  }
  place(id: string, groupId: string, beforeId?: string) {
    const item = this.item(id), target = this.group(groupId), source = this.group(item.groupId);
    if (beforeId === id) return;
    if (beforeId && !target.items.includes(beforeId)) throw new PluginError("not-found", "目标面板已移走");
    this.requirePlacement(item.viewId, target.id, id);
    this.detach(source, id);
    const index = beforeId ? target.items.indexOf(beforeId) : target.items.length;
    target.items.splice(index, 0, id);
    target.active = id;
    item.groupId = target.id;
    this.state.lastGroups[item.viewId] = target.id;
    this.save();
  }
  private detach(group: SidebarGroup, id: string) {
    const index = group.items.indexOf(id);
    group.items = group.items.filter((item) => item !== id);
    if (group.active === id)
      group.active = group.items[Math.min(index, group.items.length - 1)] || "";
  }
  close(id: string) {
    const item = this.item(id);
    this.state.lastGroups[item.viewId] = item.groupId;
    this.detach(this.group(item.groupId), id);
    delete this.state.items[id];
    this.save();
  }
  setRatio(side: SidebarSide, value: number) {
    if (Number.isFinite(value)) {
      this.state.ratios[side] = Math.max(0.15, Math.min(0.85, value));
      this.save();
    }
  }
  setState(id: string, state: Json, version: number) {
    if (JSON.stringify(state).length > 256 * 1024)
      throw new PluginError("invalid-argument", "面板状态超过 256 KB");
    const item = this.item(id);
    item.state = state;
    item.stateVersion = version;
    this.save();
  }
  pin(id: string, root: string | null) {
    const item = this.item(id);
    item.pinned = !!root;
    item.root = root;
    this.save();
  }
}
export const sidebarLayout = new SidebarLayout(
  typeof localStorage === "undefined" ? undefined : localStorage,
);
