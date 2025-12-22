/**
 * 设置面板 - 外观标签页
 */

import { useNewtabStore } from '../../../hooks/useNewtabStore';
import {
  SettingSection,
  ToggleItem,
  SelectItem,
  ColorItem,
  TextItem,
  RangeItem,
} from '../components/SettingItems';
import type { WallpaperType } from '../../../types';

export function AppearanceTab() {
  const { settings, updateSettings } = useNewtabStore();

  return (
    <div className="space-y-6">
      <SettingSection title="快捷方式">
        <ToggleItem
          label="显示快捷方式"
          checked={settings.showShortcuts}
          onChange={(v) => updateSettings({ showShortcuts: v })}
        />
        <SelectItem
          label="每行数量"
          value={String(settings.shortcutColumns)}
          options={[
            { value: '6', label: '6 个' },
            { value: '8', label: '8 个' },
            { value: '10', label: '10 个' },
          ]}
          onChange={(v) => updateSettings({ shortcutColumns: Number(v) as 6 | 8 | 10 })}
        />
        <SelectItem
          label="样式"
          value={settings.shortcutStyle}
          options={[
            { value: 'icon', label: '图标' },
            { value: 'card', label: '卡片' },
          ]}
          onChange={(v) => updateSettings({ shortcutStyle: v as 'icon' | 'card' })}
        />
      </SettingSection>

      <SettingSection title="壁纸">
        <SelectItem
          label="壁纸类型"
          value={settings.wallpaper.type}
          options={[
            { value: 'color', label: '纯色' },
            { value: 'bing', label: 'Bing 每日壁纸' },
            { value: 'unsplash', label: '随机风景' },
            { value: 'image', label: '自定义图片' },
          ]}
          onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, type: v as WallpaperType } })}
        />
        {settings.wallpaper.type === 'color' && (
          <ColorItem
            label="背景颜色"
            value={settings.wallpaper.value}
            onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })}
          />
        )}
        {settings.wallpaper.type === 'bing' && (
          <>
            <SelectItem
              label="历史图片"
              value={String(settings.wallpaper.bingHistoryIndex || 0)}
              options={[
                { value: '0', label: '今天' },
                { value: '1', label: '昨天' },
                { value: '2', label: '2 天前' },
                { value: '3', label: '3 天前' },
                { value: '4', label: '4 天前' },
                { value: '5', label: '5 天前' },
                { value: '6', label: '6 天前' },
                { value: '7', label: '7 天前' },
              ]}
              onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, bingHistoryIndex: Number(v) } })}
            />
            <ToggleItem
              label="显示图片信息"
              checked={settings.wallpaper.showBingInfo || false}
              onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, showBingInfo: v } })}
            />
          </>
        )}
        {settings.wallpaper.type === 'image' && (
          <TextItem
            label="图片 URL"
            value={settings.wallpaper.value}
            placeholder="https://..."
            onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, value: v } })}
          />
        )}
        <RangeItem
          label="模糊"
          value={settings.wallpaper.blur}
          min={0}
          max={20}
          onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, blur: v } })}
        />
        <RangeItem
          label="亮度"
          value={settings.wallpaper.brightness}
          min={20}
          max={100}
          onChange={(v) => updateSettings({ wallpaper: { ...settings.wallpaper, brightness: v } })}
        />
      </SettingSection>
    </div>
  );
}
