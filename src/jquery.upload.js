/**
 * @file        基于jQuery的文件上传组件
 * @author      龙泉 <yangtuan2009@126.com>
 * @version     1.0.0
 */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD module
    define(['jquery'], factory);
  } else if (typeof module !== "undefined" && module.exports) {
    // Node/CommonJS
    // Seajs build
    factory(require('jquery'));
  } else {
    // 浏览器全局模式
    factory(jQuery);
  }
})(function($) {
  // 常见MIME类型
  // 扩展名与MIME类型匹配，用来设置HTML5新增的accept属性（支持IE10+）
  var MIMEData = {
    jpeg: 'image/jpeg',
    jpg: 'image/jpg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    txt: 'text/plain',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    zip: 'aplication/zip'
  };

  // 构造函数
  function Uploader(ele, options) {
    options = $.extend({
      // 上传字段的name属性
      name: '',
      // 上传表单的action
      action: '',
      // 是否强制采用Form&Ifrmae提交（用于兼容测试）
      byIframe: false,
      // 采用Form&Ifrmae提交时，是否保留iframe（用于兼容测试）
      keepIframe: false,
      // 是否该使用类似cookies,authorization headers(头部授权)或者TLS客户端证书这一类资格证书来创建一个跨站点访问控制（cross-site Access-Control）请求
      // xmlhttprequest发送的请求需要使用“withCredentials”来带上cookie，如果一个目标域设置成了允许任意域的跨域请求，这个请求又带着cookie的话，这个请求是不合法的。（就是如果需要实现带cookie的跨域请求，需要明确的配置允许来源的域，使用任意域的配置是不合法的）浏览器会屏蔽掉返回的结果。javascript就没法获取返回的数据了。这是cors模型最后一道防线。假如没有这个限制的话，那么javascript就可以获取返回数据中的csrf token，以及各种敏感数据。这个限制极大的降低了cors的风险。
      withCredentials: false,
      // 是否允许上传队列，默认为true，每次点击上传按钮选择的文件都将被添加到上传队列
      // 为false时，每次点击上传按钮选择文件将自动替换之前所选择的文件
      allowedQueue: true,
      // 是否添加文件后自动上传，默认为true
      // 为false时，需要通过uploadTrigger参数指定上传的触发器
      autoUpload: true,
      // 指定手动上传的触发器
      uploadTrigger: null,
      // 点击触发器时未选择文件时的回调函数
      triggerError: null,
      // disabled类名
      disabledClass: 'disabled',
      // 数据类型，text-纯文本类型，json-json对象（默认）
      dataType: 'json',
      // 支持的文件类型（扩展名），多个类型使用逗号隔开
      // 在没有设置acceptMime参数时，会自动根据扩展名从MIMEData数据中读取MIME信息然后赋值到file表单的accept属性（支持IE10）
      acceptType: null,
      // 不符合acceptType参数设置的文件格式时的回调函数
      // 参数-that，指向对象实例
      // that.fileName，格式错误的文件名称（多个文件名称使用逗号隔开）
      acceptError: null,
      // 设置file表单的accept属性的值，html5新增属性（支持IE10+）
      // 在Chrome浏览器下，可能会有文件选择窗口打开非常慢的问题，谨慎选择
      acceptMime: null,
      // 是否可以选择多个文件，html5新增属性（支持IE10+），默认为false
      multiple: false,
      // 最大允许的文件大小，单位M（使用HTML5对象判断，支持IE10+）（后端同样需要判断，前端判断以此是为了减轻不必要的服务器请求）
      maxFileSize: null,
      // 文件大小超出限制时的回调函数
      // 参数-that，指向对象实例
      // that.fileName，超出大小限制的文件名称（多个文件名称使用逗号隔开）
      maxFileSizeError: null,
      // 添加文件时的处理函数，如果返回false将阻止文件的添加
      // 参数-data，相关数据
      // data.ele, 绑定上传组件的元素
      // data.options，配置选项
      // data.filePath，文件路径
      // data.fileName，文件名称
      // data.supportProgress，是否支持上传进度显示
      // data.context，上传结果处理的上下文元素
      // data.form，表单数据，支持data.form.append('name', 'value')附加表单字段
      add: null,
      // 上传完成后对接口返回数据进行过滤的回调函数
      // 参数-data，相关数据，同add回调函数，其它可用字段：
      // data.response，后端返回的原始数据
      dataFilter: null,
      // 执行函数-上传完成（需要继续判断后端是否处理成功）
      // 参数-data，相关数据，同add回调函数，其它可用字段：
      // data.response，后端返回的原始数据
      // data.result，后端返回的数据经过dataType处理后的数据
      done: null,
      // 执行函数-上传错误
      // 参数-data，相关数据，同add回调函数
      error: null,
      // 进度条处理的回调函数
      // 参数-data，相关数据，同add回调函数，其它可用字段：
      // data.percent，当前传输进度的百分比
      // data.loaded，已经传输的字节
      // data.total，需要传输的总字节
      progress: null,
    }, options)

    // 上传组件的容器
    this.ele = $(ele);

    // 配置参数
    this.options = options;

    // 是否支持XMLHttpRequest level2
    this.supportXHR2 = 'FormData' in window;

    // 是否使用xhr上传文件
    this.isUseXHR = this.supportXHR2 && !options.byIframe;

    // 上传队列
    this.queue = [];

    // 创建上传表单
    this.createFileInput();

    // 绑定手动上传的触发器
    this.bindUploadTrigger();
  }

  // 对象原型
  Uploader.prototype = {
    /**
     * 创建上传表单
     * @return {undefined}
     */
    createFileInput: function() {
      var that = this,
        options = that.options,
        strAccept = '',
        $ele = that.ele,
        $fileInput = $('<input type="file" name="' + options.name + '" style="position:absolute;right:0;top:0;opacity:0;filter:alpha(opacity=0);width:auto!important;height:100%!important;padding:0!important;border:0!important;margin:0!important;cursor:pointer;font-size:216px!important;">');

        // 表单需要相对容器进行定位
      if ($ele.css('position') === 'static') {
        $ele.css('position', 'relative');
      }

      // 相对容器需要overflow:hidden;
      if ($ele.css('overflow') !== 'hidden') {
        $ele.css('overflow', 'hidden');
      }

      // 设置file表单的multiple属性
      if (options.multiple) {
        $fileInput.attr('multiple', 'multiple');
      }

      // 设置file表单的accept属性
      if (options.acceptMime) {
        $fileInput.attr('accept', options.acceptMime);
      } else if (options.acceptType) {
        $.each(options.acceptType.split(','), function(i, value) {
          strAccept = strAccept + ',' + (value.indexOf('/') !== -1 ? value : MIMEData[value] || '');
        });

        if (strAccept !== '') {
          strAccept = strAccept.substring(1);
          $fileInput.attr('accept', strAccept);
        }
      }

      // 附加页面容器
      $fileInput.appendTo($ele);

      // 上传input
      that.fileInput = $fileInput;

      // 绑定文件选择变更事件
      that.bindChange();
    },

    /**
     * 绑定手动上传的触发器
     * @return {undefined}
     */
    bindUploadTrigger: function() {
      var that = this,
        options = that.options;

      if (options.autoUpload === false && options.uploadTrigger) {
        $(options.uploadTrigger).addClass(options.disabledClass).on('click', function() {
          var $that = $(this),
            hasDisabled = $that.hasClass(options.disabledClass);

          if (!hasDisabled) {
            that.submit();
          } else {
            $.isFunction(options.triggerError) && options.triggerError();
          }
        });
      }
    },

    /**
     * 绑定文件选择变更事件
     * @return {undefined}
     */
    bindChange: function() {
      var that = this,
        options = that.options,
        optionAcceptType = options.acceptType;

      // 选择文件后判断文件类型，并执行上传
      that.fileInput.on('change', function() {
        var $fileInput = $(this),
          val = $fileInput.val(),
          arrFiles = $fileInput[0].files,
          objFile, reg, i, len, arrErrFiles = [];

        // 没有选择文件不执行后续处理
        if (val === '') return;

        // 扩展名判断
        if (optionAcceptType && $.isFunction(options.acceptError)) {
          reg = new RegExp('\\\.(' + optionAcceptType.replace(/,/g, '|') + ')$', 'i');

          if (arrFiles === undefined) {
            arrFiles = [{
              name: val
            }];
          }

          for (i = 0, len = arrFiles.length; i < len; i++) {
            objFile = arrFiles[i];
            if (!reg.test(objFile.name)) {
              arrErrFiles.push(objFile.name);
            }
          }

          if (arrErrFiles.length) {
            options.acceptError(arrErrFiles.join(','), options);
            $fileInput.val('');
            return;
          }
        }

        // 文件大小判断
        if (options.maxFileSize && arrFiles !== undefined && $.isFunction(options.maxFileSizeError)) {
          for (i = 0, len = arrFiles.length; i < len; i++) {
            objFile = arrFiles[i];
            if (objFile.size > options.maxFileSize * 1024 * 1024) {
              arrErrFiles.push(objFile.name);
            }
          }

          if (arrErrFiles.length) {
            options.maxFileSizeError(arrErrFiles.join(','), options);
            $fileInput.val('');
            return;
          }
        }

        // 上传触发器移除禁用类名
        if (options.autoUpload === false && options.uploadTrigger) {
          $(options.uploadTrigger).removeClass(options.disabledClass);
        }

        // 设置队列数据
        that.setQueueData();

        // 执行上传
        options.autoUpload && that.submit();
      });
    },

    /**
     * 设置队列数据
     * @return {undefined}
     */
    setQueueData: function() {
      var that = this,
        options = that.options,
        canContinue = true,
        $fileInput = that.fileInput,
        filePath = $fileInput.val(),
        _formData, arrFiles, objFile,
        queueData = {
          ele: that.ele,
          options: options,
          filePath: filePath,
          fileName: that.getFileNameByPath(filePath),
          supportProgress: that.isUseXHR
        };

      // 添加表单
      if (that.isUseXHR) {
        // 创建表单数据对象
        _formData = new FormData();

        // 文件列表
        arrFiles = $fileInput[0].files;

        // 遍历文件列表，插入到表单数据中
        for (i = 0, len = arrFiles.length; i < len; i++) {
          objFile = arrFiles[i];
          _formData.append($fileInput.attr('name'), objFile);
        }

        // 添加图片后清除字段值
        options.allowedQueue && that.fileInput.val('');
      } else {
        // 模拟表单数据
        _formData = {
          form: $('<form method="post" enctype="multipart/form-data" style="position:absolute;left:-9999px;width:0;height:0;overflow:hidden;"></form>'),
          append: function(name, value) {
            var $field = this.form.find('[name="' + name + '"]');
            if ($field.length === 0) {
              $field = $('<input type="hidden" name="' + name + '" value="' + value + '">').appendTo(this.form);
            } else {
              $field.val(value);
            }
          }
        };

        // 将上传表单添加到本次的队列form中
        _formData.form.append($fileInput.off('change'));

        // 重新创建上传表单
        that.createFileInput();
      }

      // 保存表单
      queueData.form = _formData;

      // 执行添加的回调函数
      if ($.isFunction(options.add)) {
        if (options.add(queueData) === false) {
          canContinue = false;
        }
      }

      // 追加序列对象
      if (canContinue) {
        if (options.allowedQueue) {
          that.queue.push(queueData);
        } else {
          that.queue = null;
          that.queue = [queueData];
        }
      }
    },

    /**
     * 执行上传处理
     * @return {undefined}
     */
    submit: function() {
      var that = this,
        queueData;

      if (!that.isUploading && that.queue.length) {
        that.isUploading = true;
        queueData = that.queue[0];

        // 根据是否支持XMLRequest Level2采用不同的方式进行上传
        that.isUseXHR ? that.uploadByXHR(queueData) : that.uploadByForm(queueData);
      }
    },

    /**
     * 执行下一个队列
     * @return {undefined}
     */
    nextQueue: function() {
      var that = this,
        options = that.options;

      if (that.queue.length) {
        that.queue.shift();
      }

      that.isUploading = false;

      // 如果还存在上传队列则继续执行提交
      if (that.queue.length) {
        that.submit();
      }
      // 否则在存在上传触发器的情况下需要添加disabled类名
      else if (options.autoUpload === false && options.uploadTrigger) {
        $(options.uploadTrigger).addClass(options.disabledClass);
      }
    },

    /**
     * 使用XMLRequest对象提交
     * @param  {Object} queueData 队列数据
     * @return {undefined}
     */
    uploadByXHR: function(queueData) {
      var that = this,
        options = that.options,
        xhr = new XMLHttpRequest();

      // 是否创建一个跨站点访问控制请求（默认值是false）
      try {
        // IE10不支持这样写，暂时捕捉异常，后面抽时间再看
        xhr.withCredentials = options.withCredentials;
      } catch (e) {}

      // 上传进度
      if ($.isFunction(options.progress)) {
        // event.total是需要传输的总字节，event.loaded是已经传输的字节。如果event.lengthComputable不为真，则event.total等于0。
        xhr.upload.onprogress = function(ev) {
          if (ev.lengthComputable) {
            queueData.percent = Math.round(ev.loaded * 100 / ev.total);
            queueData.loaded = ev.loaded;
            queueData.total = ev.total;
            options.progress(queueData);
          }
        };
      }

      // 请求完成后执行的操作
      xhr.onload = function(ev) {
        if (this.status === 200 || this.status === 304) {
          queueData.response = this.responseText;
          if ($.isFunction(options.dataFilter)) {
            queueData.response = options.dataFilter(queueData);
          }
          // 处理返回数据
          that.execResponse(queueData);
        } else {
          $.isFunction(options.error) && options.error(queueData);
        }

        // 执行下一个队列
        that.nextQueue();
      };

      // 请求error
      xhr.onerror = function() {
        that.nextQueue();
        $.isFunction(options.error) && options.error(queueData);
      };

      // 请求中断
      xhr.onabort = function() {
        that.nextQueue();
        $.isFunction(options.abort) && options.abort(queueData);
      };

      // 发送请求
      xhr.open('POST', options.action);
      xhr.send(queueData.form);
    },

    /**
     * 使用表单提交
     * @param  {Object} queueData 队列数据
     * @return {undefined}
     */
    uploadByForm: function(queueData) {
      var that = this,
        options = that.options,
        $form = queueData.form.form,
        $uploadIframe;

      // 检测用于form提交的iframe
      $uploadIframe = that.checkIframe();

      // iframe加载完成，获取反馈结果
      $uploadIframe.off('load').on('load', function() {
        // 跨域将导致代码执行报错
        // 通常情况下后端返回的内容将存放在body下，且是纯文本数据
        // 如果后端返回的是非标准的文本数据，那么就需要使用dataFilter回调函数从html下生成的内容进行过滤
        try {
          queueData.response = $uploadIframe.contents().find('body').html();
          if ($.isFunction(options.dataFilter)) {
            queueData.response = $uploadIframe.contents().find('html').html();
            queueData.response = options.dataFilter(queueData);
          }
        } catch (e) {}

        // 处理返回数据
        that.execResponse(queueData);

        // 移除iframe
        // 清除创建的form表单
        if (!options.keepIframe) {
          $uploadIframe.remove();
          $form.remove();
        }

        // 执行下一个队列
        that.nextQueue();
      });

      // 添加action和target
      $form.attr('action', options.action).attr('target', $uploadIframe.attr('name')).appendTo('body');

      // 提交表单
      $form.submit();
    },

    /**
     * 执行返回数据的处理
     * @param  {Object} queueData 队列数据
     * @return {undefined}
     */
    execResponse: function(queueData) {
      var that = this,
        options = that.options,
        response = queueData.response;

      // 转换数据格式
      if (options.dataType === 'json' && typeof response === 'string') {
        try {
          response = $.parseJSON(response);
        } catch (e) {
          response = {};
        }
      }

      // 根据结果执行不同的回调
      if (response) {
        queueData.result = response;
        $.isFunction(options.done) && options.done(queueData); // 上传完成
      } else {
        $.isFunction(options.error) && options.error(queueData); // 上传错误
      }
    },

    /**
     * 检测并返回用于form提交的iframe
     * 不支持FormData的浏览器采用form表单提交，需要一个iframe
     * @return {jQuery}
     */
    checkIframe: function() {
      var name = 'uploadIframe' + new Date().getTime(),
        $form = $('<iframe src="about:blank" name="' + name + '" style="display:none;"></iframe>');
      $form.appendTo('body');
      return $form;
    },

    /**
     * 根据文件路径获取文件名称
     * @param  {string} filePath 文件路径
     * @return {string}
     */
    getFileNameByPath: function(filePath) {
      // 文件路径统一用右斜杠
      filePath = filePath.replace(/\//g, '\\');
      var match = /\\([^\\]+)$/.exec(filePath);

      if (match !== null) {
        return match[1];
      } else {
        return filePath;
      }
    }
  };

  /**
   * 对外访问
   * @param  {string} selector 选择器
   * @param  {Object} options  对象
   * @return {undefined}
   */
  $.upload = function(selector, options) {
    $(selector).each(function() {
      var $that = $(this);
      if ($that.data('didBindUpload') === undefined) {
        new Uploader($(this), options);
        $that.data('didBindUpload', 1);
      }
    });
  };

  /**
   * 设置HTML5新增的accept属性需要用到的MIME数据
   * @param {Object} data JSON配置对象
   */
  $.upload.setMIME = function(data) {
    $.each(data, function(name, value) {
      if (MIMEData[name] === undefined) {
        MIMEData[name] = value;
      }
    });
  };
});
