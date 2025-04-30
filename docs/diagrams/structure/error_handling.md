# FoolCards 错误处理策略

## 概述

FoolCards游戏采用了全面的错误处理策略，确保游戏在各种情况下都能稳定运行。本文档描述了项目中使用的主要错误处理机制和最近的改进。

## 错误处理原则

1. **早期检测**：在操作开始前验证所有前提条件
2. **优雅降级**：在错误发生时尽可能保持游戏状态
3. **详细日志**：提供清晰的错误信息以便调试
4. **用户反馈**：适当时向用户提供错误反馈
5. **异步安全**：确保异步操作中的错误被正确处理

## 主要错误处理机制

### 参数验证

```typescript
// 示例：参数验证
public init(param1: Type1, param2: Type2) {
    if (!param1) {
        console.error("参数1为空");
        return;
    }
    
    if (!param2) {
        console.error("参数2为空");
        return;
    }
    
    // 继续初始化...
}
```

### 节点有效性检查

```typescript
// 示例：节点有效性检查
private updateNode() {
    if (!this.node || !this.isValid) {
        console.error("节点无效");
        return;
    }
    
    // 继续更新...
}
```

### 异步操作保护

```typescript
// 示例：异步操作保护
someAsyncOperation()
    .then(result => {
        // 检查组件是否仍然有效
        if (!this.isValid) {
            console.warn("组件已销毁，取消后续操作");
            return;
        }
        
        // 处理结果...
    })
    .catch(error => {
        console.error("操作失败:", error);
    });
```

### 异常捕获

```typescript
// 示例：异常捕获
try {
    // 可能抛出异常的代码
    this.performRiskyOperation();
} catch (error) {
    console.error("操作失败:", error);
    // 恢复或清理...
}
```

## 最近的错误处理改进

### AI对手卡牌显示错误修复

最近，我们在AI对手卡牌显示过程中发现了"Cannot read properties of null (reading 'getComponent')"错误。这个问题出现在异步加载卡牌精灵时，节点可能在加载完成前被销毁。

#### 修复策略

1. **节点有效性检查**：
   ```typescript
   // 在访问节点属性前检查节点是否有效
   if (!cardClone || !cardClone.isValid) {
       console.error('Card node became invalid before animation');
       return;
   }
   ```

2. **组件创建保护**：
   ```typescript
   // 使用try-catch包装组件创建
   let cardComp: Card = null;
   try {
       cardComp = cardClone.addComponent(Card);
   } catch (error) {
       console.error('Error adding Card component:', error);
       return;
   }

   if (!cardComp) {
       console.error('Failed to add Card component to AI card');
       return;
   }
   ```

3. **异步操作链中的安全检查**：
   ```typescript
   cardComp.init(card.suit, card.rank)
       .then(() => {
           // 检查节点和组件是否仍然有效
           if (!cardClone || !cardClone.isValid || !cardComp || !cardComp.isValid) {
               console.error('Card node or component became invalid after initialization');
               return Promise.reject(new Error('Card node or component became invalid'));
           }
           // 继续操作...
       })
   ```

4. **回调函数中的安全检查**：
   ```typescript
   .call(() => {
       // 检查节点是否仍然有效
       if (cardClone && cardClone.isValid && this.node && this.node.isValid) {
           // 重新排列该区域的AI卡牌
           this.arrangeAICardsInPlayArea(areaIndex);
       }
   })
   ```

### Card组件错误处理改进

Card组件也进行了类似的改进，特别是在异步加载卡牌精灵的过程中：

1. **节点有效性检查**：
   ```typescript
   // 检查节点是否有效
   if (!this.node || !this.isValid) {
       console.error('Card node is invalid in showCardFace');
       return Promise.reject(new Error('Card node is invalid'));
   }
   ```

2. **组件重建保护**：
   ```typescript
   try {
       this.cardSprite = this.getComponent(Sprite);
       if (!this.cardSprite) {
           this.cardSprite = this.addComponent(Sprite);
           console.log('Created new Sprite component for card');
       }
   } catch (error) {
       console.error('Error recreating sprite component in showCardFace:', error);
       return Promise.reject(error);
   }
   ```

## 错误处理最佳实践

1. **始终检查节点有效性**：
   - 在访问节点属性或调用方法前检查`node`和`isValid`
   - 特别是在异步操作的回调中

2. **使用Promise链处理异步错误**：
   - 使用`.catch()`捕获并处理错误
   - 使用`Promise.reject()`传递错误

3. **提供详细的错误信息**：
   - 包含上下文信息
   - 描述错误发生的位置和原因

4. **避免静默失败**：
   - 不要忽略错误
   - 至少记录错误信息

5. **优雅地处理组件销毁**：
   - 检查`isValid`属性
   - 取消未完成的异步操作

## 未来改进

1. **集中式错误处理**：
   - 实现错误管理服务
   - 统一错误日志格式

2. **用户友好的错误提示**：
   - 为关键错误添加用户可见的提示
   - 提供恢复选项

3. **自动恢复机制**：
   - 实现游戏状态自动保存
   - 添加错误后的恢复逻辑

4. **错误监控与分析**：
   - 收集错误统计信息
   - 识别常见错误模式
