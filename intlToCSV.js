const fs = require('fs');
const path = require('path');

function compose() {
	const fns = [].slice.call(arguments);
	return function(init) {
		let res = init;
		for(let i = fns.length - 1; i >= 0; i--) {
			res = fns[i](res);
		}
		return res;
	}
}

// 本文件路径
const thisFile = path.resolve('./intlToCSV.js');

/**
 * 绝对路径
 * @param {string} p 初始路径
 */
const absolutePath = (p) =>  path.resolve(p);

/**
 * 读取文件路径
 * @param {string} absolutePath 初始绝对路径
 * @return {Array<string>} 初始路径下所有js文件路径
 */
const allFilesPath = (absolutePath) => {
  let list = [];
  const abPath = absolutePath;
  const files = fs.readdirSync(abPath, {encoding: 'utf-8', withFileTypes: true});
  if(!Array.isArray(files)) {
    // throw error
    throw new Error('get file path error')
  }
  for(let i = 0; i < files.length; i++) {
    const file = files[i];
    const fap = path.resolve(absolutePath + '/' + file.name)
    if(file.name === 'node_modules') continue;
    if(fap === thisFile) continue;
    if(file.isDirectory()) {
      list = list.concat(allFilesPath(fap));
    } else if(path.extname(fap) === '.js') {
      list.push(fap);
    }
  }
  return list;
}

/**
 * 去重
 * @param {Array<string>} allIntlList 所有的多语言语句
 */
const noRepeatIntl = (allIntlList) => {
  return allIntlList.reduce((prev, curr) => {
    if(!prev.includes(curr)) {
      prev.push(curr);
    }
    return prev;
  }, []);
}

/**
 * 获取所有多语言语句
 * @param {Array<strinf>} files 初始路径下所有js文件路径
 * @return {Array<string>} 所有多语言语句
 */
const allIntls = (files) => {
  let allFilesIntl = [];
  for(let i = 0; i < files.length; i++) {
    const content = fs.readFileSync(files[i], { encoding: 'utf-8' })
    const fileIntlList = matchIntlExpression(noCommentLines(content));
    allFilesIntl = allFilesIntl.concat(fileIntlList);
  }
  return allFilesIntl;
}

/**
 * 匹配文件中的多语言语句
 * @param {string} content 文件内容
 * @return {Array<string>} 文件中所有的多语言语句
 */
const matchIntlExpression = (content) => {
  let list = [];
  const reg = /intl\r?\n?\s*\.get\(.*\)\r?\n?\s*\.d\(.*\)/g;
  let arr = [];
  while ((arr = reg.exec(content)) !== null) {
    const noQouteStr = noQoute(arr[0]);
    if(!noCommonIntl(noQouteStr)) {
      list.push(noQouteStr);
    }
  }
  return list;
}

/**
 * 去除引号和问号
 */
const noQoute = (str) => {
  const reg = /'|"|`|\?|？/g;
  return str.replace(reg, '');
}

/**
 * 去除所有注释的内容
 * @param {string} content 文件内容
 * @return {string} 不包含注释的文件内容
 */
const noCommentLines = (content) => {
  const oneLineReg = /\/\/.*/g;
  const mutiLineReg = /{\/\*[^]*\*\/}/g;
  const noOneLineComment = content.replace(oneLineReg, '');
  const noMutiLineComment = noOneLineComment.replace(mutiLineReg, '');
  return noMutiLineComment;
}

/**
 * 匹配公共的多语言语句 hzero.common
 * @param {string} line 多语言语句
 */
const noCommonIntl = (line) => {
  const reg = /intl\r?\n?\s*\.get\(hzero\.common.*\)/;
  return reg.test(line);
}

/**
 * 匹配多语言代码和对应的中文
 * @param {Array<string>} list 多语言语句
 * @return [[code, chinese]]
 */
const codeChinese = (list) => {
  const codeChineseList = [];
  const reg = /\((.*)\)[^]*d\((.*)\)/
  for(let i = 0; i < list.length; i++) {
    const arr = reg.exec(list[i]);
    codeChineseList.push([arr[1], arr[2]]);
  }
  return codeChineseList;
}

/**
 * 拆分多语言 code
 * @param {string} code 多语言code
 * @return [model, code]
 */
const splitCode = (code) => {
  const res = code.split('.');
  const [one, two, ...rest] = res;
  return [one + '.' + two, rest.join('.'), 'zh_CN'];
}

/**
 * 将多语言填入 csv
 * @param {Array} 多语言 code 和 中文
 */
const fillInCsv = (list) => {
  let rowStr = '#prompt_key,prompt_code,#lang,description\n';
  for(let i = 0; i < list.length; i++) {
    const arr = list[i];
    const code = arr[0];
    const row = splitCode(code);
    row.push(arr[1])
    rowStr = rowStr + row.join() + '\n';
  }
  fs.appendFile('intl.csv', rowStr, (err) => {
    if(err) {
      throw new Error('write execl failed: ', err.message || err);
    }
    console.log('已完成');
  })
}

const intlToCsv = compose(fillInCsv, codeChinese, noRepeatIntl, allIntls, allFilesPath, absolutePath);
intlToCsv('./')