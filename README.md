## 提取多语言
使用方法：
将 intlToCSV.js 文件和需要提取多语言的文件或目录移至一个新建文件夹中，然后在命令行该文件夹下执行 `node ./intlToCSV.js`。程序会在目录下生成文件 `intl.csv`，使用记事本打开文件，另存为 `ANSI` 编码，然后使用 execl 打开  

注意：不会提取 `hzero.common` 的多语言

nodejs 版本：v10.16.3
