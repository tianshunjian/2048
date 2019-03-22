'use strict';

import StringBuffer from "./StringBuffer";
import {GetPlatform, PLATFORM} from "../service/Constants";
import setupSHJSBridge from "../bridge/WebNetiveBridge";

/**
 * 日志级别
 * @type {{TRACE: number, DEBUG: number, INFO: number, WARN: number, ERROR: number}}
 */
const logLevel = {
    CONSOLE: 0,
    TRACE: 1,
    DEBUG: 2,
    INFO: 3,
    WARN: 4,
    ERROR: 5
};

/**
 * logLevelDesc
 * @type {{}}
 */
const logLevelDesc = {
    [logLevel.CONSOLE]: 'CONSOLE',
    [logLevel.TRACE]: 'TRACE',
    [logLevel.DEBUG]: 'DEBUG',
    [logLevel.INFO]: 'INFO',
    [logLevel.WARN]: 'WARN',
    [logLevel.ERROR]: 'ERROR'
};

/**
 * logLevelMethod
 * @type {{}}
 */
const logLevelMethod = {
    [logLevel.CONSOLE]: 'logConsole',
    [logLevel.TRACE]: 'logTrace',
    [logLevel.DEBUG]: 'logDebug',
    [logLevel.INFO]: 'logInfo',
    [logLevel.WARN]: 'logWarn',
    [logLevel.ERROR]: 'logError'
};

/**
 * _logLevel
 * @type {number}
 * @private
 */
let _logLevel = logLevel.INFO;
let _logPath = '/tmp'
let _logReady = false;
let _logFileName = '/log.txt';
let _stringBuffer = StringBuffer;
const _cacheMaxLines = 1000;
/**
 * GameLog 应用日志
 *
 * @example
 * const logger = require('logger').getLogger('Logger.js');
 * logger.info('test1');
 * logger.info('test2,{1},{0}',123,456);
 * logger.info('test3,{0}','abc');
 * logger.info('test4,{0},{1}','abc',123);
 * logger.info('test5,{name},{age}',{'name':'abc','age':23});
 */
class GameLog {
    /**
     * logLevel 默认情况，debug下打印debug及以上级别日志，release下打印info及以上级别日志
     * @param {number} level
     */
    static logLevel(level) {
        console.log(`Logger.js - log level: ${logLevelDesc[level]}`);
        _logLevel = level;
    }

    set logLevel(level) {
        this._logLevel = level;
    }

    get logLevel() {
        return this._logLevel;
    }

    /**
     * constructor
     * @param {string} name
     */
    constructor(name, level) {
        this._logLevel = level;
        this._tag = name || '';
    }

    /**
     * 初始化
     * 创建log文件
     */
    initLogFile(path,cb){
        _logPath = path;

        if (GetPlatform() == PLATFORM.kWeChatGame){
            const sysInfo = wx.getSystemInfoSync() || {};
            if (sysInfo.SDKVersion < '2.1.0'){
                console.error('基础库版本低于2.1.0，不支持日志持久化功能！');
                return;
            }

            let logPath = this.getLogPath();
            let logFilePath = this.getLogFilePath();
            wx.getFileSystemManager().access({
                path:logFilePath,
                success:function (res) {
                    console.log('Logger 本地log文件已存在：'+JSON.stringify(res));
                    let stat = wx.getFileSystemManager().statSync(logFilePath);
                    console.log('Logger 本地log文件 信息：'+JSON.stringify(stat));
                    let fileSize = stat.size /1024;//除 后单位KB
                    if(fileSize>2048){
                        console.log('Logger 本地log文件过大 删除重建');
                        this._createNewLogFile(logFilePath,cb);
                    }else{
                        console.log('Logger 本地log已准备完成');
                        _logReady = true;
                        cb&&cb();
                    }
                }.bind(this),
                fail:function (res) {
                    console.log('Logger 没有指定路径 创建文件路径：'+logPath);
                    wx.getFileSystemManager().mkdir({
                        dirPath:logPath,
                        success:function () {
                            this._createNewLogFile(logFilePath,cb);
                        }.bind(this),
                        fail:function (res) {
                            console.log('Logger 创建路径失败 '+res.errMsg);
                            if(res.errMsg.indexOf('fail file already exists')!=-1){
                                this._createNewLogFile(logFilePath,cb);
                            }
                        }.bind(this)
                    });
                }.bind(this)
            });
        }else {
            const msg = this._initLogMsg();
            setupSHJSBridge(function (bridge) {
                bridge.invokeNative("log-init",{msg:msg,path:path},function(ok){
                    if (ok){
                        _logReady = true;
                    }
                });
            });
        }
    }

    _initLogMsg(){
        let sysInfo = '';
        if (GetPlatform() == PLATFORM.kWeChatGame){
            const system = wx.getSystemInfoSync() || {};
            sysInfo = JSON.stringify(system);
        }else {
            sysInfo = navigator.userAgent;
        }

        const msg = '================= ' + _logPath + ' ' + this.getLogName() + ' =================\n=================\n' + sysInfo + '\n=================\n'
        return msg;
    }

    _createNewLogFile(logFilePath,callback){

        const msg = this._initLogMsg();
        wx.getFileSystemManager().writeFileSync(
            logFilePath, msg
            // success:function (res) {
            //     console.log('Logger 创建文件成功 '+JSON.stringify(res));
            //     console.log('Logger 本地log已准备完成');
            //     _logReady = true;
            //     callback&&callback();
            // }.bind(this),
            // fail:function (res) {
            //     console.log('Logger 创建文件失败 '+res.errMsg);
            // }
        );

        console.log('Logger 创建文件成功');
        console.log('Logger 本地log已准备完成');
        _logReady = true;
        callback&&callback();
    }
    /**
     * 获取日志文件名
     * @returns {string}
     */
    getLogName() {
        return this._dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss.S');
    }

    /**
     * 获取日志文件名
     * @returns {string}
     */
    getLogPath() {
        return `${wx.env.USER_DATA_PATH}`+ "/" + _logPath;
    }

    getLogFilePath() {
        return this.getLogPath() + _logFileName;
    }

    /**
     * 读取所有日志内容
     * @returns {string}
     */
    readLog(callback) {

        const sysInfo = wx.getSystemInfoSync() || {};
        if (sysInfo.SDKVersion < '2.1.0'){
            console.error('基础库版本低于2.1.0，不支持日志持久化功能！');
            callback();
            return;
        }

        let logFilePath = this.getLogFilePath();
        wx.readFile({
            filePath:logFilePath,
            encoding:'utf-8',
            success:function (res) {
                callback&&callback(res.data);
            }.bind(this),
            fail:function (res) {
                console.log('日志读取失败 : '+res.errMsg);
            }
        });
    }

    _printToConsole(){
        return GameLog.toConsole;
    }

    /**
     * log 只会写到控制台不会写到日志文件
     * @param msg
     * @param args
     */
    log(msg, ...args) {
        if (this._printToConsole()){
            const content = this._format(logLevel.CONSOLE,msg, ...args);
            console.log(content);
        }
    }

    /**
     * trace级别日志，会根据logLevel是否写到日志文件
     * @param msg
     * @param args
     */
    trace(msg, ...args) {
        const level = logLevel.TRACE;
        const content = this._format(level,msg, ...args);
        if (this._printToConsole()) {
            console.log(content);
        }
        this._log(level, content);
    }

    /**
     * debug级别日志，会根据logLevel是否写到日志文件
     * @param msg
     * @param args
     */
    debug(msg, ...args) {
        const level = logLevel.DEBUG;
        const content = this._format(level,msg, ...args);
        if (this._printToConsole()) {
            console.log(content);
        }
        this._log(level, content);
    }

    /**
     * info级别日志，会根据logLevel是否写到日志文件
     * @param msg
     * @param args
     */
    info(msg, ...args) {
        const level = logLevel.INFO;
        const content = this._format(level,msg, ...args);
        if (this._printToConsole()) {
            console.info(content);
        }
        this._log(level, content);
    }

    /**
     * warn级别日志，会根据logLevel是否写到日志文件
     * @param msg
     * @param args
     */
    warn(msg, ...args) {
        const level = logLevel.WARN;
        const content = this._format(level,msg, ...args);
        if (this._printToConsole()) {
            console.warn(content);
        }
        this._log(level, content);
    }

    /**
     * error级别日志，会根据logLevel是否写到日志文件
     * @param msg
     * @param args
     */
    error(msg, ...args) {
        const level = logLevel.ERROR;
        const content = this._format(level,msg, ...args);
        if (this._printToConsole()) {
            console.error(content);
        }
        this._log(level, content);
    }

    saveLog(cb){
        this._writeLog2Local(cb);
    }

    /**
     * _log
     * @param {number} level
     * @param {string} info
     * @private
     */
    _log(level, info) {
        const logLevel = this._logLevel || _logLevel;
        if (level >= logLevel && _logReady) {
            _stringBuffer.append(info);
            if(_stringBuffer.length()>_cacheMaxLines){
               this._writeLog2Local();
            }
        }
    }

    _writeLog2Local(cb){
        let str = _stringBuffer.toString();
        _stringBuffer.clear();
        let logFilePath = this.getLogFilePath();
        wx.getFileSystemManager().appendFile({
            filePath:logFilePath,
            data:str+'\n',
            success:function () {
                cb && cb();
            },
            fail:function (res) {
                console.log('Logger 日志写入失败 '+res.errMsg);
                cb && cb(res);
            }
        });
    }
    /**
     * _format
     * @param {string} msg
     * @param {...} args
     * @returns {string}
     * @private
     */
    _formatArgs(msg, ...args) {
        let result = msg + '';
        if (args.length > 0) {
            if (args.length === 1 && typeof (args[0]) === 'object') {
                const obj = args[0];
                for (let key in obj) {
                    const reg = new RegExp('({' + key + '})', 'g');
                    if (obj.hasOwnProperty(key)) {
                        result = result.replace(reg, obj[key]);
                    }
                }
            } else {
                for (let i = 0; i < args.length; i++) {
                    if (args[i] !== undefined) {
                        const reg = new RegExp('({)' + i + '(})', 'g');
                        result = result.replace(reg, args[i]);
                    }
                }
            }
        }
        return result;
    }

    _dateFormat(date,format)
    {
        var o = {
            "M+" : date.getMonth()+1, //month
            "d+" : date.getDate(),    //day
            "h+" : date.getHours(),   //hour
            "m+" : date.getMinutes(), //minute
            "s+" : date.getSeconds(), //second
            "q+" : Math.floor((date.getMonth()+3)/3),  //quarter
            "S" : date.getMilliseconds() //millisecond
        }
        if(/(y+)/.test(format)) format=format.replace(RegExp.$1,
            (date.getFullYear()+"").substr(4 - RegExp.$1.length));
        for(var k in o)if(new RegExp("("+ k +")").test(format))
            format = format.replace(RegExp.$1,
                RegExp.$1.length==1 ? o[k] :
                    ("00"+ o[k]).substr((""+ o[k]).length));
        return format;
    }

    _format(leval,msg, ...args){
        const info = this._formatArgs(msg,...args);
        const date = this._dateFormat(new Date(),'yyyy-MM-dd hh:mm:ss.S');
        const level = logLevelDesc[leval];
        //2018-03-17 11:48:11.672 [INFO] - App.js: constructor
        return `${date} [${level}] - ${this._tag}:${info}`;
    }
}

///default do not print to console.
GameLog.toConsole = false;

const GameLogUtil =  {
    /**
     * 日志级别
     */
    LEVEL: logLevel,
    /**
     * get logger
     * @param {*} name
     * @returns {GameLog}
     */
    getLogger: function (name, level) {
        return new GameLog(name, level);
    },

    /**
     * set log level
     * @param {number} level
     */
    logLevel: function (level) {
        GameLog.logLevel(level);
    },

    /**
     * 设置是否需要将日志打印到控制台
     * @param flag
     */
    printToConsole: function(flag){
        GameLog.toConsole = flag;
    },

};

export default GameLogUtil;
