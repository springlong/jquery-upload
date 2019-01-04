# jQuery upload

基于jQuery的文件上传组件

由于示例文件上传不支持本地file协议，为了更好的查看示例文件，我们提供了node server配置，安装好node依赖后执行 `node server.js` 即可。

```js
// 绑定图片的上传
$.upload('上传按钮的css选择器', {
  // 上传字段的name属性
  name: 'file',

  // 上传表单的action
  action: '/upload',

  // 是否允许上传队列，默认为true，每次点击上传按钮选择的文件都将被添加到上传队列
  // 为false时，每次点击上传按钮选择文件将自动替换之前所选择的文件
  allowedQueue: true,

  // 是否添加文件后自动上传，默认为true
  // 为false时，需要通过uploadTrigger参数指定上传的触发器
  autoUpload: true,

  // 数据类型，text-纯文本类型，json-json对象（默认）
  dataType: 'json',

  // 支持的文件类型（扩展名），多个类型使用逗号隔开
  // 在没有设置acceptMime参数时，会自动根据扩展名从MIMEData数据中读取MIME信息然后赋值到file表单的accept属性（支持IE10）
  acceptType: 'jpeg,jpg,png,gif',

  // 不符合acceptType参数设置的文件格式时的回调函数
  // 参数-fileName，格式错误的文件名称（多个文件名称使用逗号隔开）
  // 参数-options，配置选项
  acceptError: function(fileName, options) {
    alert(fileName.replace(/,/ig, '\n') + '\n图片格式不正确！');
  },

  // 设置file表单的accept属性的值，html5新增属性（支持IE10+）
  // 在Chrome浏览器下，可能会有文件选择窗口打开非常慢的问题，谨慎选择
  acceptMime: 'image/*',

  // 是否可以选择多个文件，html5新增属性（支持IE10+），默认为false
  multiple: false,

  // 最大允许的文件大小，单位MB（使用HTML5对象判断，支持IE10+）（后端同样需要判断，前端判断是为了减轻不必要的服务器请求）
  maxFileSize: 5,

  // 文件大小超出限制时的回调函数
  // 参数-fileName，超出大小限制的文件名称（多个文件名称使用逗号隔开）
  // 参数-options，配置选项
  maxFileSizeError: function(fileName, options) {
    alert(fileName.replace(/,/ig, '\n') + '\n最大允许' + options.maxFileSize + 'M！');
  },

  // 添加文件时的处理函数，如果返回false将阻止文件的添加
  // 参数-data，相关数据
  // data.ele, 绑定上传组件的元素
  // data.options，配置选项
  // data.filePath，文件路径
  // data.fileName，文件名称
  // data.supportProgress，是否支持上传进度显示
  // data.context，上传结果处理的上下文元素
  // data.form，表单数据，支持data.form.append('name', 'value')附加表单字段
  add: function(data) {
    // ...
  },

  // 执行函数-上传完成（需要继续判断后端是否处理成功）
  // 参数-data，相关数据，同add回调函数，其它可用字段：
  // data.response，后端返回的原始数据
  // data.result，后端返回的数据经过dataType处理后的数据
  done: function(data) {
    if (data.result.code === 0) {
      data.context.find('.progress').hide();
      data.context.addClass("success").find('.pic').attr("src", data.result.data);
    } else {
      alert('上传失败');
      data.context.remove();
    }
  },

  // 执行函数-上传错误
  // 参数-data，相关数据，同add回调函数
  error: function(data) {
    alert('上传错误');
    data.context.remove();
  },

  // 进度条处理的回调函数
  // 参数-data，相关数据，同add回调函数，其它可用字段：
  // data.percent，当前传输进度的百分比
  // data.loaded，已经传输的字节
  // data.total，需要传输的总字节
  progress: function(data) {
    data.context.find('.progress').html(data.percent + '%');
    console.log('progress: ' + data.loaded + ' ' + data.total + ' ' + data.percent);
  }
});

```
