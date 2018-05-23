/**
 * 图片上传剪裁上传流程：
 * 通过change事件对图片格式和大小做合理性检验
 * 通过H5中FileReader获取图片base64格式url，再结合new Image()拿到图片尺寸，对图片尺寸做检验
 * cropper.getCroppedCanvas获取裁剪后得到的canvas数据
 * canVas.toDataURL转为base64格式
 * webuploader.addFiles方法上传最终的图片
 */
(function ($) {
    const AvatarHtml = `
        <div class="cropper-container">
            <div class="cropper-l">
                <div class="upload-btn-wrapper">
                    <div class="upload-btn">添加图片
                        <input type="file" accept="image/gif, image/jpeg, image/x-png" class="avatar-input">
                    </div>
                </div>
                <div class="upload-image-wrapper">
                    <div class="image-edit-ct">
                        <img src="" alt="" id="cropper-img">
                    </div>
                    <div class="image-btn-ct">
                        <div class="re-upload">重新上传
                        </div>
                        <div class="rotate-btn">右旋转</div>
                    </div>
                </div>
            </div>
            <div class="cropper-r">
                <div class="cropper-preview-title">预览结果</div>
                <div class="cropper-preview"></div>
            </div>
        </div>
        <div class="cropper-footer">
            <div class="sure-btn">确定</div>
            <div class="cancle-btn">取消</div>
        </div>`

    $(document).ready(function () {
        var modal_time = new Date().getTime();
        $.modal({
            title: "<div class=\"cropper-modal-title\"><div class=\"modal-title-text\">头像设置</div><div class=\"close close-modal\"></div></div>",
            text: AvatarHtml,
            extraClass: "ava-cropper-modal modal-" + modal_time
        });
        return new CropAvatar(modal_time);
    })

    var CropAvatar = function (modal_time) {
        this.$avatarModal = $(".modal-" + modal_time);
        this.$avatarimage = this.$avatarModal.find("#cropper-img");
        this.$avatarInput = this.$avatarModal.find(".avatar-input"); // 选择按钮
        this.$avatarCutBtn = this.$avatarModal.find(".sure-btn"); // 确定剪裁按钮
        this.$avatarRotateBtn = this.$avatarModal.find(".rotate-btn"); // 旋转按钮
        this.$avatarCancleBtn = this.$avatarModal.find(".cancle-btn"); // 取消按钮
        this.$avatarReuploadBtn = this.$avatarModal.find(".re-upload"); // 重选按钮
        this.$avatarCloseBtn = this.$avatarModal.find(".close-modal"); // 关闭按钮
        this.init(); // init cropper
    }

    CropAvatar.prototype = {
        constructor: CropAvatar,
        cropper: null,
        init: function () {
            this.addListener();
        },
        addListener: function () {
            this.$avatarInput.on('change', $.proxy(this.change, this));
            this.$avatarCutBtn.on('click', $.proxy(this.cut, this));
            this.$avatarRotateBtn.on('click', $.proxy(this.rotate, this));
            this.$avatarCancleBtn.on('click', $.proxy(this.cancle, this));
            this.$avatarCloseBtn.on('click', $.proxy(this.close, this));
            this.$avatarReuploadBtn.on('click', $.proxy(this.reUpload, this));
        },
        change: function () {
            var _this = this;
            var files, file, reader;
            _this.destroyCropper();
            files = _this.$avatarInput.prop('files');
            if (files.length > 0) {
                file = files[0];
            }
            $(".upload-btn-wrapper").hide();
            $(".upload-image-wrapper").show();
            reader = new FileReader();
            reader.onload = function () {
                var replaceSrc = reader.result;
                _this.initCropper(replaceSrc);
            };
            reader.readAsDataURL(file);
        },
        destroyCropper: function () {
            if (this.cropper) {
                this.cropper.destroy();
                $(this.$avatarimage).attr('src', '');
            }
        },
        initCropper: function (src) {
            var _this = this;
            var cropperImg = new Image(); //这步操作是为了拿到图片的尺寸
            cropperImg.src = src;
            cropperImg.onload = function () {
                //所有检测通过，弹出弹窗，在弹窗中进行图片裁剪操作
                var image = document.getElementById('cropper-img');
                $(image).attr('src', src);
                var cropper_option = {
                    viewMode: 2, // 裁剪框只能在图片范围内移动
                    autoCropArea: 1, //0-1之间的数值，定义自动剪裁区域的大小，默认0.8
                    responsive: true,
                    restore: true,
                    scalable: true,
                    preview: ".cropper-preview",
                    cropBoxResizable: false,
                    toggleDragModeOnDblclick: false,
                    ready: function () {
                        var data = _this.cropper.getData();
                        var getCanvasData = _this.cropper.getCanvasData();
                        // 初始化剪裁框大小
                        var init_canvas_size = Math.min(data.width, data.height);
                        var canvasData_l = getCanvasData.left == 0 ? (data.width - init_canvas_size) / 2 : getCanvasData.left;
                        var canvasData_t = getCanvasData.top == 0 ? (data.height - init_canvas_size) / 2 : getCanvasData.top;
                        _this.cropper.setData({
                            width: init_canvas_size,
                            height: init_canvas_size,
                            x: canvasData_l,
                            y: canvasData_t
                        })
                    }
                }
                // 实例化cropper
                _this.cropper = new Cropper(image, cropper_option);
            };
        },
        cut: function () {
            var croppedCanvas = this.cropper.getCroppedCanvas(); //获取裁剪后得到的canvas数据
            var file = this.convertBase64UrlToBlob(croppedCanvas.toDataURL(
                'image/jpeg', '0.0')); //将canvas转换为Blob格式
            console.log("result-file:");
            console.log(file);
        },
        rotate: function () {
            this.cropper.rotate(90);
            this.cropper.zoom(0)
        },
        cancle: function () {
            $.closeModal();
        },
        reUpload: function () {
            $(this.$avatarInput).trigger("click");
        },
        close: function () {
            $.closeModal();
        },
        convertBase64UrlToBlob: function (urlData) {
            var bytes = window.atob(urlData.split(',')[1]); //去掉url的头，并转换为byte
            //处理异常,将ascii码小于0的转换为大于0
            var ab = new ArrayBuffer(bytes.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < bytes.length; i++) {
                ia[i] = bytes.charCodeAt(i);
            }
            return new Blob([ab], {
                type: 'image/jpeg'
            });
        }
    }
    $.init();
})(Zepto);