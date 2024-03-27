<template>
  <div>
    <input type="file" accept="application/vnd.openxmlformats-officedocument.presentationml.presentation" />
  </div>
</template>
<script setup>
import pptxgen from "pptxgenjs";
import { parse } from "pptxtojson";
import { onMounted } from "vue";
const pptx = new pptxgen();
// 设置ppx画布大小比例
// LAYOUT_16x9	Yes	10 x 5.625 inches
// LAYOUT_16x10	No	10 x 6.25 inches
// LAYOUT_4x3	No	10 x 7.5 inches
// LAYOUT_WIDE	No	13.3 x 7.5 inches
pptx.layout = 'LAYOUT_16x9'
const getColor = (color) => {
  let rightColor = color.substring(1)

  if (rightColor.length === 3) {
    rightColor = rightColor.split('').map(char => char.repeat(2)).join('');
  }
  // console.log('rightColor',rightColor)
  return rightColor
}
// 获取文本内容
function getTextFromHtml(htmlString) {
  // 创建一个临时的div元素
  var tempDiv = document.createElement('div');
  // 将HTML字符串设置为该元素的innerHTML
  tempDiv.innerHTML = htmlString;
  // 返回元素的textContent，这将获取所有文本内容，忽略HTML标签
  return tempDiv.textContent || tempDiv.innerText;
}
// 获取文本样式
function extractInlineStylesFromHtml(htmlString) {
  // 创建一个临时的div元素并设置其innerHTML为传入的HTML字符串
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;
  // 获取所有<span>元素
  const spanElements = tempDiv.getElementsByTagName('span');
  // 初始化一个数组来存储样式信息
  const spanStyles = [];
  // 遍历所有<span>元素
  for (let i = 0; i < spanElements.length; i++) {
    const spanElement = spanElements[i];
    // 检查元素是否有内联样式
    if (spanElement.style.cssText) {
      // 提取并解析内联样式字符串为一个样式对象
      const styleObject = {};
      const stylePairs = spanElement.style.cssText.split(';');
      stylePairs.forEach(stylePair => {
        const [key, value] = stylePair.trim().split(':');
        if (key && value) {
          if (key == 'font-size') {
            styleObject[key.trim()] = value.trim().replace('pt', '');
          } else {
            styleObject[key.trim()] = value.trim();
          }

        }
      });

      // 将样式对象添加到数组中
      spanStyles.push(styleObject);
    }
  }

  // 返回包含所有<span>元素内联样式的数组
  return spanStyles;
}
const textColo = (rgbString) => {
  // 正则表达式匹配十六进制颜色
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
  if (hexRegex.test(rgbString)) {
    return rgbString
  } else {
    // 检查 rgbString 是否是有效的 RGB 字符串
    const rgbRegex = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/;
    const match = rgbString.match(rgbRegex);

    if (!match || match.length !== 4) {
      throw new Error('Invalid RGB format');
    }

    // 提取 RGB 分量
    const rgbValues = match.slice(1).map(value => value.trim());

    // 检查 RGB 分量是否都是数字
    for (const value of rgbValues) {
      if (isNaN(value) || value < 0 || value > 255) {
        throw new Error('RGB component must be a number between 0 and 255');
      }
    }

    // 转换 RGB 分量为十六进制并组合成颜色字符串
    const hexValues = rgbValues.map(value => parseInt(value, 10).toString(16).padStart(2, '0'));
    return `#${hexValues.join('')}`;
  }

}
onMounted(() => {
  const options = {
    slideFactor: 1, // 幻灯片尺寸转换因子，默认 96 / 914400
    fontsizeFactor: 1, // 字号转换因子，默认 100 / 75
  };
  document.querySelector("input").addEventListener("change", (evt) => {
    const file = evt.target.files[0];
    const reader = new FileReader();
    reader.onload = async (e) => {
      const json = await parse(e.target.result, options);
      console.log("json", json);
      json.slides.forEach((v, j) => {
        var slide = pptx.addSlide();
        if (v.fill.type == 'image' && v.fill.value.picBase64) {
          slide.addImage({
            data: v.fill.value.picBase64,
            // type: 'jpeg', // 根据你的图片类型指定，例如'jpeg'、'png'等
            x: 0,
            y: 0,
            w: '100%',
            h: '100%',
            sizing: {
              type: 'cover',
              x: 0,
              y: 0,
              w: '100%',
              h: '100%',
            } // 设置图片填充方式为覆盖整个幻灯片
          });
        }
        v.elements.forEach((i) => {
          if (i.type == "image") {
            slide.addImage({
              x: i.left * 0.75,
              y: i.top * 0.75,
              h: i.height * 0.75,
              w: i.width * 0.75,
              path: i.src,
            });
          } else if (i.type == "text") {
            // 插入的文本
            const text = getTextFromHtml(i.content);
            // 样式集合
            const styleSet = extractInlineStylesFromHtml(i.content)
            console.log('文字样式：', styleSet[0]['color'])
            // 文本配置
            const options = {
              x: i.left * 0.75, //横坐标
              y: i.top * 0.75, //纵坐标
              w: i.width, //宽度
              h: i.height, //高度
              fontFace: styleSet[0]['font-family'], //字体
              fontSize: styleSet[0]['font-size'] * 0.75, //字号
              color: styleSet[0]['color'] ? textColo(styleSet[0]['color']) : '', //颜色 与背景颜色一样，一样不要 #，填满6位
              bold: styleSet[0]['font-weight'] !== '' ? true : false, //是否加粗
              // align: "center", //左右居中 可选值 left align right
              // valign: i.vAlign, // 垂直居中 top middle bottom
              underline: styleSet[0]['underline'], //下划线
              // isTextBox: true, //是否文字盒子（额，目前暂时不怎么用到）
            };
            slide.addText(text, options);
          } else if (i.type == "shape") {
            const options = {
              x: i.left * 0.75, //横坐标
              y: i.top * 0.75, //纵坐标
              w: i.width * 0.75, //宽度
              h: i.height * 0.75, //高度 

              shapeName: i.shapType,
              rotate: i.rotate,
              rectRadius: 5,
              fill: {
                type: i.borderType,
                color: getColor(i.fillColor),
                transparency:0
              },
              line: { color: getColor(i.borderColor), width: i.borderWidth },
            };
            slide.addShape(pptx.ShapeType.rect, options);
          }
        });
      });
      // 保存PPTX文件
      const filePath = "output.pptx";
      pptx.writeFile({ fileName: filePath }).then(() => { });
    };
    reader.readAsArrayBuffer(file);
  });
});
</script>

<style scoped></style>
