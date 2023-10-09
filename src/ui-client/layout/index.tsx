import React, { useMemo, useState } from 'react';
import { Breadcrumb, Layout, Menu, theme } from 'antd';
import { globalNavItems, getNavMenuItems, getFnCompByMenu } from './utils';

const { Header, Content, Sider } = Layout;

export const AppLayout: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const [curNavKey, setNavKey] = useState(globalNavItems[0].key as string);
  const navMenuItems = useMemo(() => getNavMenuItems(curNavKey), [curNavKey]);
  const [curMenuKey, setMenuKey] = useState(navMenuItems[0]?.key as string ?? '');
  const FnComp = useMemo(() => getFnCompByMenu(curNavKey, curMenuKey), [curNavKey, curMenuKey]);

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center' }}>
        <div className="nav-logo" style={{color: '#fff'}}>Logo</div>
        <Menu
          theme="dark"
          mode="horizontal"
          defaultSelectedKeys={[ curNavKey ]}
          items={globalNavItems}
          onSelect={info => {
            setNavKey(info.key);
          }}
        />
      </Header>
      <Layout>
        <Sider width={200} style={{ background: colorBgContainer }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={[ curMenuKey ]}
            defaultOpenKeys={['sub1']}
            style={{ height: '100%', borderRight: 0 }}
            items={navMenuItems}
            onSelect={info => {
              setMenuKey(info.key);
            }}
          />
        </Sider>
        <Layout style={{ padding: '16px 24px' }}>
          {/* <Breadcrumb style={{ margin: '16px 0' }}>
            <Breadcrumb.Item>Home</Breadcrumb.Item>
            <Breadcrumb.Item>List</Breadcrumb.Item>
            <Breadcrumb.Item>App</Breadcrumb.Item>
          </Breadcrumb> */}
          <Content
            style={{
              padding: 16,
              margin: 0,
              height: '100%',
              overflowY: 'auto',
              background: colorBgContainer,
            }}
          >
            {FnComp && <FnComp />}
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};
