## 定制版财务桌面客户端

### 开发

* 安装依赖
```
npm i
```

*启动前要先执行下面的命令以生成必要的运行时配置文件*
```
npm run preprocess
```


* Dev 启动
```
npm start
```
* 生成应用
```
npm run package
```
* 应用打包为安装文件
```
npm run make
```

### scaffold

该工程使用如下技术栈：

| framework | description |
| ---- | ---- |
| electron | 桌面客户端核心框架 |
| electron-forge | 应用打包与发布工具 |
| react | UI 组件框架 |
| antd | UI 组件库 |
| typescript | 开发语言 |
| webpack | 代码构建工具（bundler） |
| xlsx | excel 文件操作工具库 |
| lodash | 通用 utils 库 |