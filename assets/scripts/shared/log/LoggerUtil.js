/**
 * @document 微信端日志持久化使用到了 appendFile 方法，该方法从基础库2.1.0版本开始支持，因此低于改版本的机器将不支持摇一摇上传日志功能！！！
 */


import {GetPlatform, GetVersion, PLATFORM} from "../service/Constants";
import UserInfo from "../service/UserInfo";
import GameLogUtil from "./GameLog";

class LoggerUtil {

    constructor(){
        GameLogUtil.printToConsole(true);
        const logger = GameLogUtil.getLogger("LoggerUtil");
        this.logger = logger;
    }

    init(path){
        this.path = path;
        const self = this;

        this.logger.initLogFile(path,function () {

        });

        if (GetPlatform() == PLATFORM.kWeChatGame) {

            const sysInfo = wx.getSystemInfoSync() || {};
            if (sysInfo.SDKVersion < '2.1.0'){
                console.error('基础库版本低于2.1.0，不支持摇一摇上传日志功能！');
                return;
            }

            wx.onShow(function () {
                wx.startAccelerometer({
                    interval:"normal"
                });
            });

            wx.onHide(function () {
                wx.stopAccelerometer();
            });

            wx.onAccelerometerChange(function (res) {
                    if (!self._modal){
                        // console.error(JSON.stringify(res));
                        const min = 3;
                        if(Math.abs(res.x) > min || Math.abs(res.y) > min || Math.abs(res.z) > min){
                            self._modal = true;
                            wx.showModal({
                                title:"提示",
                                content:"您想上传日志吗？",
                                cancelText:"暂不上传",
                                confirmText:"现在上传",
                                success:function (res) {
                                    if (res.confirm){
                                        console.error("点击了上传");
                                        self.upload();
                                    } else {
                                        console.error("点击了暂不上传");
                                    }
                                    self._modal = false;
                                }
                            });
                        }
                    }
                });
        }
    }

    upload(){

        const self = this;

        wx.showLoading({
            title:"努力上传中",
        });

        const finishUpload = function () {
            wx.hideLoading();
        }

        const doUpload = function () {
            const fileName = logger.getLogName();
            const system = wx.getSystemInfoSync() || {};
            const title = (UserInfo.numberId || '未登录') + '-' + system.system + '(' + system.version + ')-v' + GetVersion();
            let logFilePath = logger.getLogFilePath();
            wx.uploadFile({
                url:`https://qipai.56.com/feedback/${self.path}/upload?title=${title}`,
                filePath:logFilePath,
                name:`${fileName}`,
                fail:function (err) {
                    wx.showToast({
                        duration:3,
                        title:"上传失败" + JSON.stringify(err)
                    });
                    finishUpload();
                },
                success:function () {
                    wx.showToast({
                        duration:3,
                        title:"上传成功" + fileName
                    });
                    finishUpload();
                }
            });
        };

        const logger = this.logger;
        logger.saveLog(function (err) {
            if (err){
                finishUpload();
                self._modal = true;
                wx.showModal({
                    title:"错误提示",
                    content:"日志保存失败" + JSON.stringify(err),
                    cancelText:"知道了",
                    success:function () {
                        self._modal = false;
                    }
                });
            }else {
                doUpload();
            }
        });

    }

}

export default new LoggerUtil();
