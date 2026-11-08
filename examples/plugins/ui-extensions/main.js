// examples/plugins/ui-extensions/main.ts
var api;
var item;
var count = 0;
async function activate(host) {
  api = host;
  await api.ui.sidebar.register({
    id: "panel",
    title: "ui-extensions",
    stateVersion: 1,
    setState(state) {
      count = Number(state?.count || 0);
    },
    getState() {
      return { count };
    },
    render: (context) => ({ tag: "div", attrs: { class: "example-panel" }, children: [
      { tag: "p", text: "\u8BA1\u6570 " + count },
      { tag: "button", text: "\u589E\u52A0", on: { click: async () => {
        count++;
        const current = await api.ui.sidebar.getItem(context.itemId);
        await current?.setState({ count });
      } } }
    ] })
  });
  await api.commands.register({ id: "open", title: "\u6253\u5F00 ui-extensions", run: async () => {
    item = await api.ui.sidebar.open("panel");
  } });
  await api.ui.registerAction({ id: "open", commandId: "open", location: "topbar-menu", icon: "puzzle" });
}
function deactivate() {
}
export {
  activate,
  deactivate
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsibWFpbi50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiaW1wb3J0IHR5cGUgeyBQbHVnaW5BUEkgfSBmcm9tICcuLi8uLi8uLi9zcmMvcGx1Z2lucy9zZGsvaW5kZXgnXG5sZXQgYXBpOiBQbHVnaW5BUElcbmxldCBpdGVtOiBBd2FpdGVkPFJldHVyblR5cGU8UGx1Z2luQVBJWyd1aSddWydzaWRlYmFyJ11bJ29wZW4nXT4+XG5sZXQgY291bnQgPSAwXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYWN0aXZhdGUoaG9zdDogUGx1Z2luQVBJKSB7XG4gIGFwaSA9IGhvc3RcbiAgYXdhaXQgYXBpLnVpLnNpZGViYXIucmVnaXN0ZXIoe1xuICAgIGlkOiAncGFuZWwnLCB0aXRsZTogJ3VpLWV4dGVuc2lvbnMnLFxuICAgIHN0YXRlVmVyc2lvbjogMSxcbiAgICBzZXRTdGF0ZShzdGF0ZSkgeyBjb3VudCA9IE51bWJlcigoc3RhdGUgYXMge2NvdW50PzpudW1iZXJ9KT8uY291bnQgfHwgMCkgfSxcbiAgICBnZXRTdGF0ZSgpIHsgcmV0dXJuIHtjb3VudH0gfSxcbiAgICByZW5kZXI6IGNvbnRleHQgPT4gKHsgdGFnOiAnZGl2JywgYXR0cnM6IHtjbGFzczogJ2V4YW1wbGUtcGFuZWwnfSwgY2hpbGRyZW46IFtcbiAgICAgIHt0YWc6ICdwJywgdGV4dDogJ1x1OEJBMVx1NjU3MCAnICsgY291bnR9LFxuICAgICAge3RhZzogJ2J1dHRvbicsIHRleHQ6ICdcdTU4OUVcdTUyQTAnLCBvbjoge2NsaWNrOiBhc3luYyAoKSA9PiB7Y291bnQrKztjb25zdCBjdXJyZW50PWF3YWl0IGFwaS51aS5zaWRlYmFyLmdldEl0ZW0oY29udGV4dC5pdGVtSWQpO2F3YWl0IGN1cnJlbnQ/LnNldFN0YXRlKHtjb3VudH0pfX19XG4gICAgXSB9KVxuICB9KVxuICBhd2FpdCBhcGkuY29tbWFuZHMucmVnaXN0ZXIoe2lkOidvcGVuJyx0aXRsZTonXHU2MjUzXHU1RjAwIHVpLWV4dGVuc2lvbnMnLHJ1bjphc3luYygpPT57aXRlbT1hd2FpdCBhcGkudWkuc2lkZWJhci5vcGVuKCdwYW5lbCcpfX0pXG4gIGF3YWl0IGFwaS51aS5yZWdpc3RlckFjdGlvbih7aWQ6J29wZW4nLGNvbW1hbmRJZDonb3BlbicsbG9jYXRpb246J3RvcGJhci1tZW51JyxpY29uOidwdXp6bGUnfSlcbn1cbmV4cG9ydCBmdW5jdGlvbiBkZWFjdGl2YXRlKCkge31cbiJdLAogICJtYXBwaW5ncyI6ICI7QUFDQSxJQUFJO0FBQ0osSUFBSTtBQUNKLElBQUksUUFBUTtBQUNaLGVBQXNCLFNBQVMsTUFBaUI7QUFDOUMsUUFBTTtBQUNOLFFBQU0sSUFBSSxHQUFHLFFBQVEsU0FBUztBQUFBLElBQzVCLElBQUk7QUFBQSxJQUFTLE9BQU87QUFBQSxJQUNwQixjQUFjO0FBQUEsSUFDZCxTQUFTLE9BQU87QUFBRSxjQUFRLE9BQVEsT0FBMkIsU0FBUyxDQUFDO0FBQUEsSUFBRTtBQUFBLElBQ3pFLFdBQVc7QUFBRSxhQUFPLEVBQUMsTUFBSztBQUFBLElBQUU7QUFBQSxJQUM1QixRQUFRLGNBQVksRUFBRSxLQUFLLE9BQU8sT0FBTyxFQUFDLE9BQU8sZ0JBQWUsR0FBRyxVQUFVO0FBQUEsTUFDM0UsRUFBQyxLQUFLLEtBQUssTUFBTSxrQkFBUSxNQUFLO0FBQUEsTUFDOUIsRUFBQyxLQUFLLFVBQVUsTUFBTSxnQkFBTSxJQUFJLEVBQUMsT0FBTyxZQUFZO0FBQUM7QUFBUSxjQUFNLFVBQVEsTUFBTSxJQUFJLEdBQUcsUUFBUSxRQUFRLFFBQVEsTUFBTTtBQUFFLGNBQU0sU0FBUyxTQUFTLEVBQUMsTUFBSyxDQUFDO0FBQUEsTUFBQyxFQUFDLEVBQUM7QUFBQSxJQUM1SixFQUFFO0FBQUEsRUFDSixDQUFDO0FBQ0QsUUFBTSxJQUFJLFNBQVMsU0FBUyxFQUFDLElBQUcsUUFBTyxPQUFNLDhCQUFtQixLQUFJLFlBQVM7QUFBQyxXQUFLLE1BQU0sSUFBSSxHQUFHLFFBQVEsS0FBSyxPQUFPO0FBQUEsRUFBQyxFQUFDLENBQUM7QUFDdkgsUUFBTSxJQUFJLEdBQUcsZUFBZSxFQUFDLElBQUcsUUFBTyxXQUFVLFFBQU8sVUFBUyxlQUFjLE1BQUssU0FBUSxDQUFDO0FBQy9GO0FBQ08sU0FBUyxhQUFhO0FBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
