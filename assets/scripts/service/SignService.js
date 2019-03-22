
import SignUtil from '../shared/service/SignUtil';
import UserInfo from '../shared/service/UserInfo';
import Configure from './Configure';
import NetStatusUtil, {NetworkStatusChanged} from '../shared/service/NetStatusUtil';

class SignService {

    //快速登录
    static fastSignIn (callback) {
        if (this._signInCallbacks) {
            this._signInCallbacks.push(callback);
        } else {
            this._signInCallbacks = [];
            this._signInCallbacks.push(callback);

            const handler = function (err) {
                const arr = this._signInCallbacks;
                this._signInCallbacks = null;
                arr.forEach(function (cb) {
                    cb && cb(err);
                });
            }.bind(this);

            SignUtil.fastLogin(function (result) {
                if (!result.error && result.reLogin){
                    this._saveInfo();
                }
                handler(result.error);
            }.bind(this));
        }
    }

    //保存信息
    static _saveInfo () {
        Configure.nickName = UserInfo.userInfoData.nickName;
        Configure.avatarUrl = UserInfo.userInfoData.avatarUrl;
        if (UserInfo._appInfo && UserInfo._appInfo.identifier && UserInfo._appInfo.identifier.length > 0) {
            Configure.isTourist = false;
        }
    }

    //断开连接
    static disconnect (callback) {
        this._signInCallbacks = null;
        SignUtil.disconnect(callback);
    }

    //监听网络状态
    static observerNetworkStatus (cb) {
        NetStatusUtil.initNetStatus();
        NetStatusUtil.on(NetworkStatusChanged, function (connected) {
            if (!connected) {
                cb && cb();
            }
        });
    }

}

export default SignService;
