/**
 * Cocos Creator环境模拟
 * 用于在Node.js环境中测试Cocos Creator游戏代码
 */

// 模拟Cocos Creator的核心类和API
const mockCocos = {
  // 装饰器
  _decorator: {
    ccclass: function(target) {
      return target;
    },
    property: function(options) {
      return function(target, key) {
        // 不做任何事情，仅用于模拟装饰器
      };
    }
  },

  // 基础组件类
  Component: class Component {
    constructor() {
      this.node = null;
      this.enabled = true;
    }

    // 生命周期方法
    onLoad() {}
    start() {}
    update(dt) {}
    lateUpdate(dt) {}
    onDestroy() {}

    // 组件方法
    getComponent(type) {
      return null;
    }

    addComponent(type) {
      return new type();
    }

    isValid() {
      return true;
    }
  },

  // 节点类
  Node: class Node {
    constructor(name = '') {
      this.name = name;
      this.children = [];
      this.parent = null;
      this.components = [];
      this.active = true;
      this.position = { x: 0, y: 0, z: 0 };
      this.scale = { x: 1, y: 1, z: 1 };
      this.rotation = { x: 0, y: 0, z: 0 };
      this.uuid = Math.random().toString(36).substring(2, 15);
    }

    // 节点方法
    addChild(child) {
      if (child.parent) {
        child.parent.removeChild(child);
      }
      this.children.push(child);
      child.parent = this;
      return child;
    }

    removeChild(child) {
      const index = this.children.indexOf(child);
      if (index !== -1) {
        this.children.splice(index, 1);
        child.parent = null;
      }
    }

    removeFromParent() {
      if (this.parent) {
        this.parent.removeChild(this);
      }
    }

    getComponent(type) {
      for (const component of this.components) {
        if (component instanceof type) {
          return component;
        }
      }
      return null;
    }

    addComponent(type) {
      const component = new type();
      component.node = this;
      this.components.push(component);
      return component;
    }

    getComponentInChildren(type) {
      const component = this.getComponent(type);
      if (component) {
        return component;
      }

      for (const child of this.children) {
        const childComponent = child.getComponentInChildren(type);
        if (childComponent) {
          return childComponent;
        }
      }

      return null;
    }

    setPosition(x, y, z) {
      if (typeof x === 'object') {
        this.position = { x: x.x, y: x.y, z: x.z };
      } else {
        this.position = { x, y, z };
      }
    }

    setScale(x, y, z) {
      if (typeof x === 'object') {
        this.scale = { x: x.x, y: x.y, z: x.z };
      } else {
        this.scale = { x, y, z };
      }
    }

    on(eventType, callback, target) {
      // 事件监听器模拟
    }

    off(eventType, callback, target) {
      // 移除事件监听器模拟
    }

    emit(eventType, ...args) {
      // 事件发射模拟
    }

    get isValid() {
      return true;
    }
  },

  // UI变换组件
  UITransform: class UITransform {
    constructor() {
      this.width = 100;
      this.height = 100;
      this.anchorX = 0.5;
      this.anchorY = 0.5;
    }

    setContentSize(width, height) {
      this.width = width;
      this.height = height;
    }

    getBoundingBoxToWorld() {
      return {
        x: 0,
        y: 0,
        width: this.width,
        height: this.height
      };
    }
  },

  // 精灵组件
  Sprite: class Sprite {
    constructor() {
      this.spriteFrame = null;
      this.color = { r: 255, g: 255, b: 255, a: 255 };
      this.sizeMode = 0; // TRIMMED
    }

    setMaterial(material) {
      // 材质设置模拟
    }
  },

  // 精灵帧
  SpriteFrame: class SpriteFrame {
    constructor() {
      this.texture = null;
      this.rect = { x: 0, y: 0, width: 100, height: 100 };
    }
  },

  // 向量类
  Vec3: class Vec3 {
    constructor(x = 0, y = 0, z = 0) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    static ZERO = new this(0, 0, 0);
  },

  // 缓动系统
  tween: function(target) {
    return {
      to: function(duration, props, easing) {
        return {
          call: function(callback) {
            return this;
          },
          delay: function(time) {
            return this;
          },
          repeat: function(times) {
            return this;
          },
          repeatForever: function() {
            return this;
          },
          start: function() {
            // 立即应用属性变化
            if (props) {
              Object.assign(target, props);
            }
            return this;
          }
        };
      }
    };
  },

  // 资源管理
  resources: {
    load: function(path, type, callback) {
      if (typeof type === 'function') {
        callback = type;
        type = null;
      }

      // 模拟异步加载
      setTimeout(() => {
        if (path.includes('card')) {
          callback(null, new mockCocos.SpriteFrame());
        } else {
          callback(new Error('Resource not found'), null);
        }
      }, 10);
    }
  },

  // 场景管理
  director: {
    loadScene: function(sceneName, onLaunched) {
      if (onLaunched) {
        setTimeout(onLaunched, 10);
      }
    },
    getScene: function() {
      return {
        name: 'MockScene'
      };
    }
  },

  // 事件系统
  EventTarget: class EventTarget {
    constructor() {
      this._listeners = {};
    }

    on(type, callback, target) {
      if (!this._listeners[type]) {
        this._listeners[type] = [];
      }
      this._listeners[type].push({ callback, target });
    }

    off(type, callback, target) {
      if (!this._listeners[type]) {
        return;
      }

      const listeners = this._listeners[type];
      for (let i = 0; i < listeners.length; i++) {
        if (listeners[i].callback === callback && listeners[i].target === target) {
          listeners.splice(i, 1);
          break;
        }
      }
    }

    emit(type, ...args) {
      if (!this._listeners[type]) {
        return;
      }

      const listeners = this._listeners[type].slice();
      for (const listener of listeners) {
        listener.callback.apply(listener.target, args);
      }
    }
  },

  // 输入系统
  input: {
    on: function(type, callback, target) {
      // 输入事件监听模拟
    },
    off: function(type, callback, target) {
      // 移除输入事件监听模拟
    }
  },

  // 事件类型
  NodeEventType: {
    TOUCH_START: 'touch-start',
    TOUCH_MOVE: 'touch-move',
    TOUCH_END: 'touch-end',
    TOUCH_CANCEL: 'touch-cancel',
    MOUSE_DOWN: 'mouse-down',
    MOUSE_MOVE: 'mouse-move',
    MOUSE_UP: 'mouse-up',
    MOUSE_ENTER: 'mouse-enter',
    MOUSE_LEAVE: 'mouse-leave'
  }
};

module.exports = mockCocos;
