import type { MenuProps } from 'antd';
import { consolidatedMenuItems } from '../consolidated/menu';
import * as Summary from '../consolidated/summary';
import * as Merge from '../consolidated/merge';

/** 全局导航 */
export const globalNavItems: MenuProps['items'] = [{
  key: 'consolidated',
  label: '合并报表',
}, {
  key: 'todo',
  label: '待开发功能',
}];

/** 各全局导航对应的菜单 */
const navMenuItemMap: Record<string, MenuProps['items']> = {
  consolidated: consolidatedMenuItems,
};

/** 获取某个导航的菜单内容 */
export const getNavMenuItems = (navKey: string): MenuProps['items'] => {
  if (navKey in navMenuItemMap) {
   return navMenuItemMap[navKey];
  }

  return [];
};

const fnCompMap: Record<string, React.FC<any>> = {
  'consolidated:summary': Summary.ui,
  'consolidated:merge': Merge.ui,
};

/** 获取菜单对应的功能组件 */
export const getFnCompByMenu = (navKey: string, menuKey: string): React.FC => {
  const key = `${navKey}:${menuKey}`;
  if (key in fnCompMap) {
    return fnCompMap[key];
  }

  return null;
};