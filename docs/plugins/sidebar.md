# 侧栏

[插件 API](../plugins.md) / `ui.sidebar`

| 名称 | 含义 |
| --- | --- |
| Left sidebar / Right sidebar | 左侧栏／右侧栏容器 |
| `View` | 注册的视图类型 |
| `SidebarItem` | 打开的视图实例 |
| `SidebarGroup` | 侧栏内的面板组，可容纳多个实例 |

左右侧栏各分上下两区。文件面板独占一个面板组，不能与其他面板混放。同一区域点击名称切换面板；空区域收起，移回后恢复原比例。容器 ID 由宿主管理。

## 注册与打开

```js
let panel
export async function activate(api) {
  await api.ui.sidebar.register({
    id: 'panel', title: '面板',
    defaultPlacement: 'right-bottom',
    render: context => ({ tag: 'p', text: '面板内容' })
  })
  panel = await api.ui.sidebar.open('panel')
}
```

| 方法 | 返回值 |
| --- | --- |
| `register(view)` | `Promise<Dispose>` |
| `open(viewId, { groupId?, newInstance?, state? }?)` | `Promise<SidebarItem>` |
| `getItem(itemId)` | `Promise<SidebarItem \| null>` |
| `listItems()` | 本插件已打开的实例 |
| `listGroups()` | 各面板组的 ID、标题及本插件实例信息 |

注册后加入面板列表，不自动打开。调用 `open()` 时，已有单实例保留当前位置；新实例优先使用显式 `groupId`，其次恢复上次位置，再使用 `defaultPlacement`，未指定时放到右侧上方。默认区域被文件面板独占时，宿主选择其他可用区域。用户通过“偏好设置 → 布局”页面拖动面板到指定面板组。

用户在“偏好设置 → 布局”中拖动放置与排序，拖回中央列表会关闭实例。中央只显示未放置的已启用面板。组间移动保留实例与状态，布局自动保存。

## 默认位置

`View.defaultPlacement` 只决定没有历史位置时的默认区域，不覆盖用户在布局页的调整。

| 值 | 区域 |
| --- | --- |
| `left-top` | 左侧上方 |
| `left-bottom` | 左侧下方 |
| `right-top` | 右侧上方（默认） |
| `right-bottom` | 右侧下方 |

`listGroups()` 返回 `{ id, title, placement, itemIds, activeItemId }`。用稳定的 `placement` 查找区域，勿依赖显示标题或硬编码容器 ID：

```js
const groups = await api.ui.sidebar.listGroups()
const target = groups.find(group => group.placement === 'right-bottom')
if (target) await api.ui.sidebar.open('panel', { groupId: target.id })
```

## SidebarItem

| 字段或方法 | 作用 |
| --- | --- |
| `id`、`viewId` | 实例 ID、完整视图类型 ID |
| `getInfo()` | 当前容器、状态与固定目录 |
| `reveal()` | 选中实例并展开所在侧栏 |
| `moveTo(groupId)` | 移动到指定容器 |
| `refresh()` | 重新调用 `render()` |
| `setState(state)` | 保存状态并刷新；上限 256 KB |
| `close()` | 关闭实例 |

```js
const groups = await api.ui.sidebar.listGroups()
await panel.moveTo(groups[0].id)
```

## View

| 字段或回调 | 类型 |
| --- | --- |
| `id`、`title` | `string` |
| `multiple` | `boolean`，默认单实例 |
| `defaultPlacement` | `SidebarPlacement`，默认 `right-top` |
| `stateVersion` | `number`，默认 `1` |
| `render(context)` | `UiNode \| Promise<UiNode>` |
| `onOpen(context)`、`onClose()` | 创建与销毁 |
| `onShow()`、`onHide()` | 显示与隐藏 |
| `onResize({ width, height })` | 尺寸更新 |
| `onContextChange(context)` | 文件或目录更新 |
| `getState()`、`setState(state)` | 保存与恢复状态 |
| `migrateState(state, fromVersion)` | 状态升级 |

`context` 包含实例 ID、当前目录和权限范围内的文件快照、尺寸、可见状态、保存状态及取消信号。未获得编辑读取权限时，文件快照为 `null`。

首次可见时加载界面，切换保留实例，移动不重新创建。关闭、注销、停用会清理界面资源。

## 容器样式

| 部位 | 样式 |
| --- | --- |
| 侧栏顶部 | 与 topbar 共用高度和背景；开关位置固定 |
| 区域标题 | 只显示面板名称切换，由宿主管理 |
| 面板内容 | 上下 10 px、左右 12 px；填满区域可用空间 |
| 背景与文字 | 继承 `--paper`、`--ink`、`--muted` 等主题变量 |
| 上下分隔条 | 1 px 常驻线、6 px 拖动区域；可键盘调整 |
| 横向宽度 | 右侧 220–560 px，受编辑区剩余宽度限制 |

插件通过 `render()` 返回界面描述。宿主在样式隔离容器中生成元素，不向插件提供 DOM 对象。
